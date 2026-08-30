package com.food4fit.service;

import org.springframework.stereotype.Service;

@Service
public class HealthCalculatorService {

    public int calculateBMR(int age, int height, int weight, String gender) {
        if ("MALE".equals(gender)) {
            return (int) (10 * weight + 6.25 * height - 5 * age + 5);
        }
        return (int) (10 * weight + 6.25 * height - 5 * age - 161);
    }
}
