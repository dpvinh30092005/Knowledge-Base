package com.fptu.ecommerce.service.impl;

import com.fptu.ecommerce.dto.user.UserCreateRequest;
import com.fptu.ecommerce.dto.user.UserResponse;
import com.fptu.ecommerce.entity.User;
import com.fptu.ecommerce.repository.UserRepository;
import com.fptu.ecommerce.service.UserService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * Service implementation:
 * - Xu ly business logic cho User
 * - Controller chi goi service, khong viet logic truc tiep
 * */
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        /*
         * Rule nghiep vu:
         * Email phai unique trong he thong
         * */
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());

        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        /*
         * map Entity -> Response DTO de bao ve du lieu nhay cam
         * */
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        /*
         * Khong tim thay thi throw loi nghiep vu ro rang
         * */
        return userRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /*
     * Mapper noi bo:
     * Convert Entity -> DTO theo 1 diem duy nhat de de maintain
     * */
    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
