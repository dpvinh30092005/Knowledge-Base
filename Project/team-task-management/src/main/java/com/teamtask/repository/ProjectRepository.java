package com.teamtask.repository;

import com.teamtask.model.Project;
import com.teamtask.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface cho Project entity
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * Tìm project theo project code
     */
    Optional<Project> findByProjectCode(String projectCode);

    /**
     * Tìm tất cả project theo status
     */
    List<Project> findByStatus(ProjectStatus status);

    /**
     * Tìm tất cả project được tạo bởi user
     */
    List<Project> findByCreatedByUserId(Long userId);

    /**
     * Tìm project mà user tham gia (qua team)
     */
    @Query("SELECT DISTINCT p FROM Project p JOIN p.teams t JOIN t.members m WHERE m.userId = :userId")
    List<Project> findByUserParticipation(@Param("userId") Long userId);
}

