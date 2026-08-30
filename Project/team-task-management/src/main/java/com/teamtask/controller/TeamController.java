package com.teamtask.controller;

import com.teamtask.model.Team;
import com.teamtask.model.User;
import com.teamtask.service.TeamService;
import com.teamtask.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

/**
 * Controller xử lý Team
 * Theo mô hình MVC2
 */
@Controller
@RequestMapping("/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @Autowired
    private UserService userService;

    /**
     * Hiển thị danh sách teams
     */
    @GetMapping
    public String listTeams(HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        List<Team> teams = teamService.findByUserParticipation(user.getUserId());
        model.addAttribute("teams", teams);
        return "teams/list";
    }

    /**
     * Hiển thị form tạo team mới
     */
    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("team", new Team());
        List<User> users = userService.findActiveUsers();
        model.addAttribute("users", users);
        return "teams/form";
    }

    /**
     * Xử lý tạo team mới
     */
    @PostMapping("/create")
    public String createTeam(
            @ModelAttribute Team team,
            @RequestParam(value = "memberIds", required = false) List<Long> memberIds,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        team.setLeader(user);
        
        Team savedTeam = teamService.save(team);

        // Thêm members nếu có
        if (memberIds != null && !memberIds.isEmpty()) {
            for (Long memberId : memberIds) {
                try {
                    teamService.addMember(savedTeam.getTeamId(), memberId);
                } catch (Exception e) {
                    redirectAttributes.addFlashAttribute("error", "Lỗi khi thêm thành viên: " + e.getMessage());
                }
            }
        }

        redirectAttributes.addFlashAttribute("success", "Tạo team thành công!");
        return "redirect:/teams";
    }

    /**
     * Hiển thị chi tiết team
     */
    @GetMapping("/{id}")
    public String viewTeam(@PathVariable Long id, HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        Optional<Team> teamOpt = teamService.findById(id);
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            model.addAttribute("team", team);
            return "teams/detail";
        }

        return "redirect:/teams";
    }

    /**
     * Xử lý xóa team
     */
    @PostMapping("/{id}/delete")
    public String deleteTeam(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        teamService.deleteById(id);
        redirectAttributes.addFlashAttribute("success", "Xóa team thành công!");
        return "redirect:/teams";
    }
}

