package com.teamtask.service;

import com.teamtask.model.Project;
import com.teamtask.model.ProjectStatus;
import com.teamtask.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service layer cho Project
 */
@Service
@Transactional
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    /**
     * Tìm tất cả projects
     */
    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    /**
     * Tìm project theo ID
     */
    public Optional<Project> findById(Long id) {
        return projectRepository.findById(id);
    }

    /**
     * Tìm project theo project code
     */
    public Optional<Project> findByProjectCode(String projectCode) {
        return projectRepository.findByProjectCode(projectCode);
    }

    /**
     * Tạo mới project
     */
    public Project save(Project project) {
        return projectRepository.save(project);
    }

    /**
     * Cập nhật project
     */
    public Project update(Project project) {
        return projectRepository.save(project);
    }

    /**
     * Xóa project
     */
    public void deleteById(Long id) {
        projectRepository.deleteById(id);
    }

    /**
     * Tìm projects theo status
     */
    public List<Project> findByStatus(ProjectStatus status) {
        return projectRepository.findByStatus(status);
    }

    /**
     * Tìm projects được tạo bởi user
     */
    public List<Project> findByCreatedBy(Long userId) {
        return projectRepository.findByCreatedByUserId(userId);
    }

    /**
     * Tìm projects mà user tham gia (qua team)
     */
    public List<Project> findByUserParticipation(Long userId) {
        return projectRepository.findByUserParticipation(userId);
    }
}

