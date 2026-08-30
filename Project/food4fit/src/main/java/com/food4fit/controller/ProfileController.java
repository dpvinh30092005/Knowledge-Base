package com.food4fit.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

    @GetMapping("/setup-profile")
    public String setupProfile() {
        return "setup-profile";
    }
}
