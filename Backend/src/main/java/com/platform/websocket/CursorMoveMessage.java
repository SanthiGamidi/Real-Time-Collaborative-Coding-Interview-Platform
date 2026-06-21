package com.platform.websocket;

public class CursorMoveMessage {
    private String sessionId;
    private Long userId;
    private Long timestamp;
    private int line;
    private int ch;

    // Constructors
    public CursorMoveMessage() {
    }

    public CursorMoveMessage(String sessionId, Long userId, Long timestamp, int line, int ch) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.timestamp = timestamp;
        this.line = line;
        this.ch = ch;
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

    public int getLine() {
        return line;
    }

    public void setLine(int line) {
        this.line = line;
    }

    public int getCh() {
        return ch;
    }

    public void setCh(int ch) {
        this.ch = ch;
    }

    @Override
    public String toString() {
        return "CursorMoveMessage{" +
                "sessionId='" + sessionId + '\'' +
                ", userId=" + userId +
                ", timestamp=" + timestamp +
                ", line=" + line +
                ", ch=" + ch +
                '}';
    }
}
