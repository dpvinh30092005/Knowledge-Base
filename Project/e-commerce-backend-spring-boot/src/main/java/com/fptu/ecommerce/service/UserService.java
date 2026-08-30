package com.fptu.ecommerce.service;

import com.fptu.ecommerce.dto.user.UserCreateRequest;
import com.fptu.ecommerce.dto.user.UserResponse;
import java.util.List;

/*
 * Service contract cho User:
 * - Dat business rule o day (khong dat trong controller)
 * - Giup de test va thay doi implementation de dang hon
 * */
public interface UserService {

    /*
     * Tao moi user theo request dau vao
     * */
    UserResponse create(UserCreateRequest request);

    /*
     * Lay danh sach user
     * */
    List<UserResponse> findAll();

    /*
     * Lay chi tiet user theo id
     * */
    UserResponse findById(Long id);
}
