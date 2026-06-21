package com.platform.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @MessageMapping("/session/{sessionId}/code")
    @SendTo("/topic/session/{sessionId}")
    public CodeUpdateMessage handleCodeUpdate(
            @DestinationVariable String sessionId,
            @Payload CodeUpdateMessage message) {
        message.setSessionId(sessionId);
        return message;
    }

    @MessageMapping("/session/{sessionId}/chat")
    @SendTo("/topic/session/{sessionId}")
    public ChatMessage handleChat(
            @DestinationVariable String sessionId,
            @Payload ChatMessage message) {
        message.setSessionId(sessionId);
        return message;
    }

    @MessageMapping("/session/{sessionId}/cursor")
    @SendTo("/topic/session/{sessionId}")
    public CursorMoveMessage handleCursorMove(
            @DestinationVariable String sessionId,
            @Payload CursorMoveMessage message) {
        message.setSessionId(sessionId);
        return message;
    }

    @MessageMapping("/session/{sessionId}/join-leave")
    @SendTo("/topic/session/{sessionId}")
    public JoinLeaveMessage handleJoinLeave(
            @DestinationVariable String sessionId,
            @Payload JoinLeaveMessage message) {
        message.setSessionId(sessionId);
        return message;
    }

    @MessageMapping("/session/{sessionId}/control")
    @SendTo("/topic/session/{sessionId}")
    public ControlMessage handleControlChange(
            @DestinationVariable String sessionId,
            @Payload ControlMessage message) {
        message.setSessionId(sessionId);
        return message;
    }
}
