package com.platform.websocket;

public class ChatMessage {
    private String sessionId;
    private Long userId;
    private Long timestamp;
    private String senderName;
    private String content;

    // Constructors
    public ChatMessage() {
    }

    public ChatMessage(String sessionId, Long userId, Long timestamp, String senderName, String content) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.timestamp = timestamp;
        this.senderName = senderName;
        this.content = content;
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

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "ChatMessage{" +
                "sessionId='" + sessionId + '\'' +
                ", userId=" + userId +
                ", timestamp=" + timestamp +
                ", senderName='" + senderName + '\'' +
                ", content='" + content + '\'' +
                '}';
    }
}
