package com.platform.dto;

import com.platform.model.Session;
import java.time.LocalDateTime;
import java.util.List;

public class SessionResponse {
    private String id;
    private String title;
    private UserResponse createdBy;
    private String status;
    private LocalDateTime createdAt;
    private List<SessionParticipantResponse> participants;

    // Constructors
    public SessionResponse() {
    }

    public SessionResponse(String id, String title, UserResponse createdBy, String status, LocalDateTime createdAt, List<SessionParticipantResponse> participants) {
        this.id = id;
        this.title = title;
        this.createdBy = createdBy;
        this.status = status;
        this.createdAt = createdAt;
        this.participants = participants;
    }

    public static SessionResponse fromEntity(Session session, List<SessionParticipantResponse> participants) {
        return new SessionResponse(
                session.getId(),
                session.getTitle(),
                UserResponse.fromUser(session.getCreatedBy()),
                session.getStatus().name(),
                session.getCreatedAt(),
                participants
        );
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public UserResponse getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserResponse createdBy) {
        this.createdBy = createdBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<SessionParticipantResponse> getParticipants() {
        return participants;
    }

    public void setParticipants(List<SessionParticipantResponse> participants) {
        this.participants = participants;
    }
}
