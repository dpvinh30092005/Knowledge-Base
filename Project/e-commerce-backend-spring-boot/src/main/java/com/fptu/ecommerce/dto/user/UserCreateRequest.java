package com.fptu.ecommerce.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/*
 * DTO nhan du lieu tu client khi tao user
 * Tach rieng khoi Entity de tranh expose structure DB
 * */
public class UserCreateRequest {

    /*
     * @Email + @NotBlank:
     * Validate ngay tu layer API de fail fast
     * */
    @Email
    @NotBlank
    private String email;

    /*
     * Password dau vao (raw) se duoc xu ly o service/security layer
     * */
    @NotBlank
    private String password;

    /*
     * Role dau vao, vi du: USER / ADMIN
     * */
    @NotBlank
    private String role;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
