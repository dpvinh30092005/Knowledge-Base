package com.teamtask.service;

import com.teamtask.model.User;
import com.teamtask.model.UserRole;
import com.teamtask.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service layer cho User
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Tìm tất cả users
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }

    /**
     * Tìm user theo ID
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Tìm user theo email
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Tìm user theo username
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Tìm user theo email hoặc username (dùng cho login)
     */
    public Optional<User> findByEmailOrUsername(String email, String username) {
        return userRepository.findByEmailOrUsername(email, username);
    }

    /**
     * Tạo mới user
     */
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * Cập nhật user
     */
    public User update(User user) {
        return userRepository.save(user);
    }

    /**
     * Xóa user
     */
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Kiểm tra email đã tồn tại chưa
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Kiểm tra username đã tồn tại chưa
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Xác thực đăng nhập
     */
    public Optional<User> authenticate(String email, String username, String password) {
        Optional<User> userOpt = userRepository.findByEmailOrUsername(email, username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // TODO: Nên sử dụng password encoder (BCrypt) trong thực tế
            if (user.getPassword().equals(password) && user.getIsActive()) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    /**
     * Tìm users theo role
     */
    public List<User> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    /**
     * Tìm active users
     */
    public List<User> findActiveUsers() {
        return userRepository.findByIsActiveTrue();
    }
}

