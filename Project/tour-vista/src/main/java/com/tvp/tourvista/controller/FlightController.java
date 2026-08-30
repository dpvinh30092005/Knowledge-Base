package com.tvp.tourvista.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping
public class FlightController {
    @GetMapping("/flights")
    public String flight(){
        return "flight";
    }
}
