package com.teamtask.service;

import com.teamtask.model.Team;
import com.teamtask.model.TeamStatus;
import com.teamtask.model.User;
import com.teamtask.repository.TeamRepository;
import com.teamtask.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Service layer cho Team
 */
@Service
@Transactional
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tìm tất cả teams
     */
    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    /**
     * Tìm team theo ID
     */
    public Optional<Team> findById(Long id) {
        return teamRepository.findById(id);
    }

    /**
     * Tìm team theo team code
     */
    public Optional<Team> findByTeamCode(String teamCode) {
        return teamRepository.findByTeamCode(teamCode);
    }

    /**
     * Tạo mới team
     */
    public Team save(Team team) {
        return teamRepository.save(team);
    }

    /**
     * Cập nhật team
     */
    public Team update(Team team) {
        return teamRepository.save(team);
    }

    /**
     * Xóa team
     */
    public void deleteById(Long id) {
        teamRepository.deleteById(id);
    }

    /**
     * Tìm teams theo leader
     */
    public List<Team> findByLeader(Long leaderId) {
        return teamRepository.findByLeaderUserId(leaderId);
    }

    /**
     * Tìm teams theo project
     */
    public List<Team> findByProject(Long projectId) {
        return teamRepository.findByProjectProjectId(projectId);
    }

    /**
     * Tìm teams theo status
     */
    public List<Team> findByStatus(TeamStatus status) {
        return teamRepository.findByStatus(status);
    }

    /**
     * Tìm teams mà user là thành viên
     */
    public List<Team> findByMember(Long userId) {
        return teamRepository.findByMemberUserId(userId);
    }

    /**
     * Tìm teams mà user tham gia (leader hoặc member)
     */
    public List<Team> findByUserParticipation(Long userId) {
        return teamRepository.findByLeaderOrMemberUserId(userId);
    }

    /**
     * Thêm member vào team
     */
    public Team addMember(Long teamId, Long userId) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (teamOpt.isPresent() && userOpt.isPresent()) {
            Team team = teamOpt.get();
            User user = userOpt.get();
            team.getMembers().add(user);
            return teamRepository.save(team);
        }
        throw new RuntimeException("Team hoặc User không tồn tại");
    }

    /**
     * Xóa member khỏi team
     */
    public Team removeMember(Long teamId, Long userId) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            team.getMembers().removeIf(member -> member.getUserId().equals(userId));
            return teamRepository.save(team);
        }
        throw new RuntimeException("Team không tồn tại");
    }
}

