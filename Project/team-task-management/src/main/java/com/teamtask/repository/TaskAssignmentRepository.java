package com.teamtask.repository;

import com.teamtask.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface cho TaskAssignment entity
 */
@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    /**
     * Tìm tất cả assignment theo task
     */
    List<TaskAssignment> findByTaskTaskId(Long taskId);

    /**
     * Tìm tất cả assignment theo user
     */
    List<TaskAssignment> findByAssignedUserUserId(Long userId);

    /**
     * Tìm assignment theo task và user
     */
    Optional<TaskAssignment> findByTaskTaskIdAndAssignedUserUserId(Long taskId, Long userId);

    /**
     * Kiểm tra user đã được giao task chưa
     */
    boolean existsByTaskTaskIdAndAssignedUserUserId(Long taskId, Long userId);

    /**
     * Xóa assignment theo task
     */
    void deleteByTaskTaskId(Long taskId);

    /**
     * Xóa assignment theo task và user
     */
    void deleteByTaskTaskIdAndAssignedUserUserId(Long taskId, Long userId);
}

