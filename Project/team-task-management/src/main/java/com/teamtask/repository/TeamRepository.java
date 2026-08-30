package com.teamtask.repository;

import com.teamtask.model.Team;
import com.teamtask.model.TeamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface cho Team entity
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /**
     * Tìm team theo team code
     */
    Optional<Team> findByTeamCode(String teamCode);

    /**
     * Tìm tất cả team theo leader
     */
    List<Team> findByLeaderUserId(Long leaderId);

    /**
     * Tìm tất cả team theo project
     */
    List<Team> findByProjectProjectId(Long projectId);

    /**
     * Tìm tất cả team theo status
     */
    List<Team> findByStatus(TeamStatus status);

    /**
     * Tìm team mà user là thành viên
     */
    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.userId = :userId")
    List<Team> findByMemberUserId(@Param("userId") Long userId);

    /**
     * Tìm team mà user là leader hoặc thành viên
     */
    @Query("SELECT DISTINCT t FROM Team t LEFT JOIN t.members m WHERE t.leader.userId = :userId OR m.userId = :userId")
    List<Team> findByLeaderOrMemberUserId(@Param("userId") Long userId);
}

