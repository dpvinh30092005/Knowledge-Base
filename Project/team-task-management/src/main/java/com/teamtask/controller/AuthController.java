package com.teamtask.controller;

import com.teamtask.model.User;
import com.teamtask.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Optional;

/**
 * Controller xử lý authentication (Login/Logout)
 * Theo mô hình MVC2
 */
@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * Hiển thị trang login (GET)
     */
    @GetMapping("/login")
    public String showLoginPage(Model model) {
        return "auth/login";
    }

    /**
     * Xử lý đăng nhập (POST)
     */
    @PostMapping("/login")
    public String processLogin(
            @RequestParam("txtEmail") String email,
            @RequestParam("txtUsername") String username,
            @RequestParam("txtPassword") String password,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        Optional<User> userOpt = userService.authenticate(email, username, password);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Lưu thông tin user vào session
            session.setAttribute("user", user);
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("username", user.getUsername());
            session.setAttribute("role", user.getRole());
            
            // Redirect đến trang dashboard
            return "redirect:/dashboard";
        } else {
            redirectAttributes.addFlashAttribute("error", "Email/Username hoặc Password không đúng!");
            return "redirect:/login";
        }
    }

    /**
     * Xử lý đăng xuất
     */
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}

