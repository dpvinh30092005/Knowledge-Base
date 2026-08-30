package com.teamtask.controller;

import com.teamtask.model.Task;
import com.teamtask.model.TaskStatus;
import com.teamtask.model.User;
import com.teamtask.service.TaskService;
import com.teamtask.service.TeamService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Controller xử lý Task
 * Theo mô hình MVC2
 */
@Controller
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TeamService teamService;

    /**
     * Hiển thị danh sách tasks
     */
    @GetMapping
    public String listTasks(
            @RequestParam(value = "teamId", required = false) Long teamId,
            HttpSession session,
            Model model) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        List<Task> tasks;
        if (teamId != null) {
            tasks = taskService.findByTeam(teamId);
            model.addAttribute("teamId", teamId);
        } else {
            tasks = taskService.findByAssignedUser(user.getUserId());
        }

        model.addAttribute("tasks", tasks);
        return "tasks/list";
    }

    /**
     * Hiển thị form tạo task mới
     */
    @GetMapping("/new")
    public String showCreateForm(
            @RequestParam(value = "teamId", required = false) Long teamId,
            HttpSession session,
            Model model) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        Task task = new Task();
        if (teamId != null) {
            teamService.findById(teamId).ifPresent(task::setTeam);
        }

        model.addAttribute("task", task);
        model.addAttribute("teams", teamService.findByUserParticipation(user.getUserId()));
        return "tasks/form";
    }

    /**
     * Xử lý tạo task mới
     */
    @PostMapping("/create")
    public String createTask(
            @ModelAttribute Task task,
            @RequestParam("teamId") Long teamId,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        teamService.findById(teamId).ifPresent(task::setTeam);
        task.setCreatedBy(user);
        task.setStartDate(LocalDateTime.now());

        taskService.save(task);
        redirectAttributes.addFlashAttribute("success", "Tạo task thành công!");
        return "redirect:/tasks?teamId=" + teamId;
    }

    /**
     * Hiển thị chi tiết task
     */
    @GetMapping("/{id}")
    public String viewTask(@PathVariable Long id, HttpSession session, Model model) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            model.addAttribute("task", task);
            return "tasks/detail";
        }

        return "redirect:/tasks";
    }

    /**
     * Cập nhật status của task
     */
    @PostMapping("/{id}/status")
    public String updateStatus(
            @PathVariable Long id,
            @RequestParam("status") TaskStatus status,
            RedirectAttributes redirectAttributes) {

        try {
            taskService.updateStatus(id, status);
            redirectAttributes.addFlashAttribute("success", "Cập nhật trạng thái thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Lỗi: " + e.getMessage());
        }

        return "redirect:/tasks/" + id;
    }

    /**
     * Xử lý xóa task
     */
    @PostMapping("/{id}/delete")
    public String deleteTask(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        taskService.deleteById(id);
        redirectAttributes.addFlashAttribute("success", "Xóa task thành công!");
        return "redirect:/tasks";
    }
}

