package com.platform.controller;

import com.platform.dto.CreateSessionRequest;
import com.platform.dto.JoinSessionRequest;
import com.platform.dto.SessionResponse;
import com.platform.security.UserPrincipal;
import com.platform.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SessionResponse response = sessionService.createSession(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<SessionResponse> joinSession(
            @PathVariable String id,
            @Valid @RequestBody JoinSessionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SessionResponse response = sessionService.joinSession(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionDetails(@PathVariable String id) {
        SessionResponse response = sessionService.getSessionDetails(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> getMySessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<SessionResponse> response = sessionService.getMySessions(currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        sessionService.deleteSession(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<SessionResponse> closeSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SessionResponse response = sessionService.closeSession(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        sessionService.leaveSession(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/participants/{userId}/control")
    public ResponseEntity<SessionResponse> updateParticipantControl(
            @PathVariable String id,
            @PathVariable Long userId,
            @RequestParam boolean hasControl,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SessionResponse response = sessionService.updateParticipantControl(id, userId, hasControl, currentUser);
        return ResponseEntity.ok(response);
    }
}
