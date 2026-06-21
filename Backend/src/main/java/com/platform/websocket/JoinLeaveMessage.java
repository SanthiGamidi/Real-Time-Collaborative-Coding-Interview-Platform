package com.platform.websocket;

public class JoinLeaveMessage {
    private String sessionId;
    private Long userId;
    private Long timestamp;
    private String userName;
    private String action; // "JOIN" or "LEAVE"

    // Constructors
    public JoinLeaveMessage() {
    }

    public JoinLeaveMessage(String sessionId, Long userId, Long timestamp, String userName, String action) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.timestamp = timestamp;
        this.userName = userName;
        this.action = action;
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

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    @Override
    public String toString() {
        return "JoinLeaveMessage{" +
                "sessionId='" + sessionId + '\'' +
                ", userId=" + userId +
                ", timestamp=" + timestamp +
                ", userName='" + userName + '\'' +
                ", action='" + action + '\'' +
                '}';
    }
}
