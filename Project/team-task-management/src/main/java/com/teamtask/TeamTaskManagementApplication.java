package com.teamtask;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main Spring Boot Application
 * 
 * @author Team Task Management
 */
@SpringBootApplication
@EnableJpaAuditing
public class TeamTaskManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(TeamTaskManagementApplication.class, args);
    }
}

