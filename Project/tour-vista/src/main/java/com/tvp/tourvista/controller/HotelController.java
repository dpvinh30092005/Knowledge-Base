package com.tvp.tourvista.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HotelController {

    @GetMapping("/hotels")
    public String hotels() {
        return "hotels";
    }
}
