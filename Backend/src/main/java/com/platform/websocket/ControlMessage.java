package com.platform.websocket;

public class ControlMessage {
    private String sessionId;
    private Long userId;
    private boolean hasControl;
    private Long timestamp;

    // Constructors
    public ControlMessage() {
    }

    public ControlMessage(String sessionId, Long userId, boolean hasControl, Long timestamp) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.hasControl = hasControl;
        this.timestamp = timestamp;
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

    public boolean isHasControl() {
        return hasControl;
    }

    public void setHasControl(boolean hasControl) {
        this.hasControl = hasControl;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
