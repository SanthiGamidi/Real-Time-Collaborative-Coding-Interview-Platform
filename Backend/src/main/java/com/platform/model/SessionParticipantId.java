package com.platform.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class SessionParticipantId implements Serializable {

    @Column(name = "session_id", length = 36)
    private String sessionId;

    @Column(name = "user_id")
    private Long userId;

    // Constructors
    public SessionParticipantId() {
    }

    public SessionParticipantId(String sessionId, Long userId) {
        this.sessionId = sessionId;
        this.userId = userId;
    }

    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SessionParticipantId that = (SessionParticipantId) o;
        return Objects.equals(sessionId, that.sessionId) &&
                Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionId, userId);
    }

    @Override
    public String toString() {
        return "SessionParticipantId{" +
                "sessionId='" + sessionId + '\'' +
                ", userId=" + userId +
                '}';
    }
}
