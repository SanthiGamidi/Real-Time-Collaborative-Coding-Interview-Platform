package com.platform.dto;

import com.platform.model.SessionParticipant;
import java.time.LocalDateTime;

public class SessionParticipantResponse {
    private UserResponse user;
    private String sessionRole;
    private boolean hasControl;
    private LocalDateTime joinedAt;

    // Constructors
    public SessionParticipantResponse() {
    }

    public SessionParticipantResponse(UserResponse user, String sessionRole, LocalDateTime joinedAt, boolean hasControl) {
        this.user = user;
        this.sessionRole = sessionRole;
        this.joinedAt = joinedAt;
        this.hasControl = hasControl;
    }

    public static SessionParticipantResponse fromEntity(SessionParticipant participant) {
        return new SessionParticipantResponse(
                UserResponse.fromUser(participant.getUser()),
                participant.getSessionRole().name(),
                participant.getJoinedAt(),
                participant.isHasControl()
        );
    }

    // Getters and Setters
    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getSessionRole() {
        return sessionRole;
    }

    public void setSessionRole(String sessionRole) {
        this.sessionRole = sessionRole;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isHasControl() {
        return hasControl;
    }

    public void setHasControl(boolean hasControl) {
        this.hasControl = hasControl;
    }
}
