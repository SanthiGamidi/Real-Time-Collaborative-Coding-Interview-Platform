package com.platform.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_participants")
public class SessionParticipant {

    @EmbeddedId
    private SessionParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("sessionId")
    @JoinColumn(name = "session_id")
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_role", nullable = false)
    private ParticipantRole sessionRole;

    @Column(name = "has_control", nullable = false)
    private boolean hasControl = true;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onJoin() {
        this.joinedAt = LocalDateTime.now();
    }

    // Constructors
    public SessionParticipant() {
    }

    public SessionParticipant(Session session, User user, ParticipantRole sessionRole) {
        this.session = session;
        this.user = user;
        this.sessionRole = sessionRole;
        this.hasControl = true;
        this.id = new SessionParticipantId(session.getId(), user.getId());
    }

    public SessionParticipant(SessionParticipantId id, Session session, User user, ParticipantRole sessionRole, LocalDateTime joinedAt, boolean hasControl) {
        this.id = id;
        this.session = session;
        this.user = user;
        this.sessionRole = sessionRole;
        this.joinedAt = joinedAt;
        this.hasControl = hasControl;
    }

    // Getters and Setters
    public SessionParticipantId getId() {
        return id;
    }

    public void setId(SessionParticipantId id) {
        this.id = id;
    }

    public Session session() {
        return session;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ParticipantRole getSessionRole() {
        return sessionRole;
    }

    public void setSessionRole(ParticipantRole sessionRole) {
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

    @Override
    public String toString() {
        return "SessionParticipant{" +
                "id=" + id +
                ", sessionRole=" + sessionRole +
                ", joinedAt=" + joinedAt +
                '}';
    }
}
