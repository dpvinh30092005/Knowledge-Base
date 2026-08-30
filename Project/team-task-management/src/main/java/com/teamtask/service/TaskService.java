package com.teamtask.service;

import com.teamtask.model.Task;
import com.teamtask.model.TaskAssignment;
import com.teamtask.model.TaskStatus;
import com.teamtask.model.User;
import com.teamtask.repository.TaskRepository;
import com.teamtask.repository.TaskAssignmentRepository;
import com.teamtask.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service layer cho Task
 */
@Service
@Transactional
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tìm tất cả tasks
     */
    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    /**
     * Tìm task theo ID
     */
    public Optional<Task> findById(Long id) {
        return taskRepository.findById(id);
    }

    /**
     * Tạo mới task
     */
    public Task save(Task task) {
        return taskRepository.save(task);
    }

    /**
     * Cập nhật task
     */
    public Task update(Task task) {
        return taskRepository.save(task);
    }

    /**
     * Xóa task
     */
    public void deleteById(Long id) {
        taskRepository.deleteById(id);
    }

    /**
     * Tìm tasks theo team
     */
    public List<Task> findByTeam(Long teamId) {
        return taskRepository.findByTeamTeamId(teamId);
    }

    /**
     * Tìm tasks theo team và status
     */
    public List<Task> findByTeamAndStatus(Long teamId, TaskStatus status) {
        return taskRepository.findByTeamTeamIdAndStatus(teamId, status);
    }

    /**
     * Tìm tasks được giao cho user
     */
    public List<Task> findByAssignedUser(Long userId) {
        return taskRepository.findByAssignedUserId(userId);
    }

    /**
     * Tìm tasks được giao cho user với status cụ thể
     */
    public List<Task> findByAssignedUserAndStatus(Long userId, TaskStatus status) {
        return taskRepository.findByAssignedUserIdAndStatus(userId, status);
    }

    /**
     * Gán task cho user
     */
    public TaskAssignment assignTask(Long taskId, Long userId, String notes) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        Optional<User> userOpt = userRepository.findById(userId);

        if (taskOpt.isPresent() && userOpt.isPresent()) {
            // Kiểm tra đã được gán chưa
            if (taskAssignmentRepository.existsByTaskTaskIdAndAssignedUserUserId(taskId, userId)) {
                throw new RuntimeException("Task đã được gán cho user này");
            }

            TaskAssignment assignment = new TaskAssignment(taskOpt.get(), userOpt.get());
            assignment.setNotes(notes);
            return taskAssignmentRepository.save(assignment);
        }
        throw new RuntimeException("Task hoặc User không tồn tại");
    }

    /**
     * Hủy gán task cho user
     */
    public void unassignTask(Long taskId, Long userId) {
        taskAssignmentRepository.deleteByTaskTaskIdAndAssignedUserUserId(taskId, userId);
    }

    /**
     * Cập nhật status của task
     */
    public Task updateStatus(Long taskId, TaskStatus status) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setStatus(status);
            if (status == TaskStatus.DONE) {
                task.setCompletedDate(LocalDateTime.now());
            }
            return taskRepository.save(task);
        }
        throw new RuntimeException("Task không tồn tại");
    }

    /**
     * Đếm số task theo team và status
     */
    public long countByTeamAndStatus(Long teamId, TaskStatus status) {
        return taskRepository.countByTeamTeamIdAndStatus(teamId, status);
    }
}

