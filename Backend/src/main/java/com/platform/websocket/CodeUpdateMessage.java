package com.platform.websocket;

public class CodeUpdateMessage {
    private String sessionId;
    private Long userId;
    private Long timestamp;
    private String code;
    private String language;

    // Constructors
    public CodeUpdateMessage() {
    }

    public CodeUpdateMessage(String sessionId, Long userId, Long timestamp, String code, String language) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.timestamp = timestamp;
        this.code = code;
        this.language = language;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public String toString() {
        return "CodeUpdateMessage{" +
                "sessionId='" + sessionId + '\'' +
                ", userId=" + userId +
                ", timestamp=" + timestamp +
                ", code='" + (code != null && code.length() > 50 ? code.substring(0, 50) + "..." : code) + '\'' +
                ", language='" + language + '\'' +
                '}';
    }
}
