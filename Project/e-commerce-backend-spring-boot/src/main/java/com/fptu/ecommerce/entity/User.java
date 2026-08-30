package com.fptu.ecommerce.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

/*
 * Entity User:
 * - Dai dien bang users trong database
 * - Chi giu du lieu "domain core", khong truyen thang ra API response
 * */
@Entity
@Table(name = "users")
public class User {

    /*
     * Khoa chinh cua bang
     * GenerationType.IDENTITY -> DB tu tang id
     * */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Email dang nhap:
     * - unique = true  -> khong cho trung email
     * - nullable = false -> bat buoc phai co gia tri
     * */
    @Column(nullable = false, unique = true)
    private String email;

    /*
     * Mat khau da hash
     * Luu y: khong bao gio luu plain text
     * */
    @Column(nullable = false)
    private String password;

    /*
     * Vai tro nguoi dung (USER, ADMIN, ...)
     * */
    @Column(nullable = false)
    private String role;

    /*
     * Thoi diem tao ban ghi:
     * - @CreationTimestamp: Hibernate set luc insert
     * - updatable = false: khong cho update ve sau
     * */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public User() {
    }

    public User(Long id, String email, String password, String role, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
