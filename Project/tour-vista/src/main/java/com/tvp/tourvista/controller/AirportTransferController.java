package com.tvp.tourvista.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AirportTransferController {

    @GetMapping("/airport-transfer")
    public String airportTransfer() {
        return "airport-transfer";
    }
}
