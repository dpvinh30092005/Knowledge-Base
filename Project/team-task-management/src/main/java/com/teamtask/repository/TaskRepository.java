package com.teamtask.repository;

import com.teamtask.model.Task;
import com.teamtask.model.TaskPriority;
import com.teamtask.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface cho Task entity
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Tìm tất cả task theo team
     */
    List<Task> findByTeamTeamId(Long teamId);

    /**
     * Tìm tất cả task theo người tạo
     */
    List<Task> findByCreatedByUserId(Long userId);

    /**
     * Tìm tất cả task theo status
     */
    List<Task> findByStatus(TaskStatus status);

    /**
     * Tìm tất cả task theo priority
     */
    List<Task> findByPriority(TaskPriority priority);

    /**
     * Tìm tất cả task theo team và status
     */
    List<Task> findByTeamTeamIdAndStatus(Long teamId, TaskStatus status);

    /**
     * Tìm task được giao cho user
     */
    @Query("SELECT t FROM Task t JOIN t.assignments a WHERE a.assignedUser.userId = :userId")
    List<Task> findByAssignedUserId(@Param("userId") Long userId);

    /**
     * Tìm task được giao cho user với status cụ thể
     */
    @Query("SELECT t FROM Task t JOIN t.assignments a WHERE a.assignedUser.userId = :userId AND t.status = :status")
    List<Task> findByAssignedUserIdAndStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);

    /**
     * Tìm task sắp đến hạn
     */
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :startDate AND :endDate AND t.status != 'DONE'")
    List<Task> findUpcomingTasks(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Đếm task theo team và status
     */
    long countByTeamTeamIdAndStatus(Long teamId, TaskStatus status);
}

