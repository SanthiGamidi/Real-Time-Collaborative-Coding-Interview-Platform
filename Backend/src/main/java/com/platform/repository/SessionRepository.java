package com.platform.repository;

import com.platform.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    @Query("SELECT DISTINCT s FROM Session s " +
           "LEFT JOIN SessionParticipant sp ON s.id = sp.id.sessionId " +
           "WHERE s.createdBy.id = :userId OR sp.id.userId = :userId " +
           "ORDER BY s.createdAt DESC")
    List<Session> findMySessions(@Param("userId") Long userId);
}
