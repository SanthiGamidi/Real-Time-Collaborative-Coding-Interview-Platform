package com.platform.dto;

import com.platform.model.ParticipantRole;
import jakarta.validation.constraints.NotNull;

public class JoinSessionRequest {

    @NotNull(message = "Session role is required (INTERVIEWER or CANDIDATE)")
    private ParticipantRole sessionRole;

    // Constructors
    public JoinSessionRequest() {
    }

    public JoinSessionRequest(ParticipantRole sessionRole) {
        this.sessionRole = sessionRole;
    }

    // Getters and Setters
    public ParticipantRole getSessionRole() {
        return sessionRole;
    }

    public void setSessionRole(ParticipantRole sessionRole) {
        this.sessionRole = sessionRole;
    }
}
