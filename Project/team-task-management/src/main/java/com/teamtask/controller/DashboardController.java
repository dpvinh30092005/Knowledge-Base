package com.teamtask.controller;

import com.teamtask.model.User;
import com.teamtask.service.TaskService;
import com.teamtask.service.TeamService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Controller xử lý Dashboard
 * Theo mô hình MVC2
 */
@Controller
public class DashboardController {

    @Autowired
    private TeamService teamService;

    @Autowired
    private TaskService taskService;

    /**
     * Hiển thị trang dashboard
     */
    @GetMapping("/dashboard")
    public String showDashboard(HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            return "redirect:/login";
        }

        Long userId = user.getUserId();

        // Lấy danh sách teams mà user tham gia
        List<com.teamtask.model.Team> teams = teamService.findByUserParticipation(userId);
        
        // Lấy danh sách tasks được giao cho user
        List<com.teamtask.model.Task> myTasks = taskService.findByAssignedUser(userId);

        model.addAttribute("user", user);
        model.addAttribute("teams", teams);
        model.addAttribute("myTasks", myTasks);
        model.addAttribute("taskCount", myTasks.size());
        model.addAttribute("teamCount", teams.size());

        return "dashboard";
    }
}

