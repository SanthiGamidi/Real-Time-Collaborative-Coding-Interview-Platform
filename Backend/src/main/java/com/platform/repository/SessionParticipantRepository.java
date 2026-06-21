package com.platform.repository;

import com.platform.model.SessionParticipant;
import com.platform.model.SessionParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, SessionParticipantId> {
    List<SessionParticipant> findByIdSessionId(String sessionId);
    boolean existsByIdSessionIdAndIdUserId(String sessionId, Long userId);
    void deleteByIdSessionId(String sessionId);
}
