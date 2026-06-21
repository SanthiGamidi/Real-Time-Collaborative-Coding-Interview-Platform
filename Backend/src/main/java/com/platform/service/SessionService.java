package com.platform.service;

import com.platform.dto.CreateSessionRequest;
import com.platform.dto.JoinSessionRequest;
import com.platform.dto.SessionParticipantResponse;
import com.platform.dto.SessionResponse;
import com.platform.exception.BadRequestException;
import com.platform.exception.ResourceNotFoundException;
import com.platform.exception.UnauthorizedException;
import com.platform.model.*;
import com.platform.repository.SessionParticipantRepository;
import com.platform.repository.SessionRepository;
import com.platform.repository.UserRepository;
import com.platform.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionParticipantRepository sessionParticipantRepository;
    private final UserRepository userRepository;

    public SessionService(SessionRepository sessionRepository,
                          SessionParticipantRepository sessionParticipantRepository,
                          UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.sessionParticipantRepository = sessionParticipantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request, UserPrincipal currentUser) {
        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        Session session = new Session(request.getTitle(), creator, SessionStatus.ACTIVE);
        Session savedSession = sessionRepository.save(session);

        // Auto join creator as INTERVIEWER
        SessionParticipant participant = new SessionParticipant(savedSession, creator, ParticipantRole.INTERVIEWER);
        sessionParticipantRepository.save(participant);

        List<SessionParticipantResponse> participants = List.of(SessionParticipantResponse.fromEntity(participant));
        return SessionResponse.fromEntity(savedSession, participants);
    }

    @Transactional
    public SessionResponse joinSession(String sessionId, JoinSessionRequest request, UserPrincipal currentUser) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BadRequestException("Cannot join a closed session");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        // Create or update participant
        SessionParticipant participant = new SessionParticipant(session, user, request.getSessionRole());
        sessionParticipantRepository.save(participant);

        return getSessionDetails(sessionId);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSessionDetails(String sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        List<SessionParticipant> participants = sessionParticipantRepository.findByIdSessionId(sessionId);
        List<SessionParticipantResponse> participantResponses = participants.stream()
                .map(SessionParticipantResponse::fromEntity)
                .collect(Collectors.toList());

        return SessionResponse.fromEntity(session, participantResponses);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getMySessions(UserPrincipal currentUser) {
        List<Session> sessions = sessionRepository.findMySessions(currentUser.getId());
        return sessions.stream()
                .map(session -> {
                    List<SessionParticipant> participants = sessionParticipantRepository.findByIdSessionId(session.getId());
                    List<SessionParticipantResponse> participantResponses = participants.stream()
                            .map(SessionParticipantResponse::fromEntity)
                            .collect(Collectors.toList());
                    return SessionResponse.fromEntity(session, participantResponses);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSession(String sessionId, UserPrincipal currentUser) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        // Enforce that only the creator or an ADMIN can delete the session
        boolean isCreator = session.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isCreator && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this session");
        }

        sessionParticipantRepository.deleteByIdSessionId(sessionId);
        sessionRepository.delete(session);
    }

    @Transactional
    public SessionResponse closeSession(String sessionId, UserPrincipal currentUser) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        boolean isCreator = session.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isInterviewer = false;
        if (!isCreator && !isAdmin) {
            SessionParticipantId participantId = new SessionParticipantId(sessionId, currentUser.getId());
            SessionParticipant participant = sessionParticipantRepository.findById(participantId)
                    .orElseThrow(() -> new UnauthorizedException("You are not a participant in this session"));
            isInterviewer = participant.getSessionRole() == ParticipantRole.INTERVIEWER;
        }

        if (!isCreator && !isAdmin && !isInterviewer) {
            throw new UnauthorizedException("Only interviewers can end the session");
        }

        session.setStatus(SessionStatus.CLOSED);
        sessionRepository.save(session);

        return getSessionDetails(sessionId);
    }

    @Transactional
    public void leaveSession(String sessionId, UserPrincipal currentUser) {
        SessionParticipantId participantId = new SessionParticipantId(sessionId, currentUser.getId());
        if (sessionParticipantRepository.existsById(participantId)) {
            sessionParticipantRepository.deleteById(participantId);
        }
    }

    @Transactional
    public SessionResponse updateParticipantControl(String sessionId, Long userId, boolean hasControl, UserPrincipal currentUser) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        boolean isCreator = session.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isCreator && !isAdmin) {
            throw new UnauthorizedException("Only the session host can manage editing controls");
        }

        SessionParticipantId participantId = new SessionParticipantId(sessionId, userId);
        SessionParticipant participant = sessionParticipantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));

        participant.setHasControl(hasControl);
        sessionParticipantRepository.save(participant);

        return getSessionDetails(sessionId);
    }
}
