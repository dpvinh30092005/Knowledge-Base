package com.fptu.ecommerce.repository;

import com.fptu.ecommerce.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/*
 * Repository:
 * - Chiu trach nhiem truy cap du lieu User
 * - Spring Data JPA tu sinh implementation luc runtime
 * */
public interface UserRepository extends JpaRepository<User, Long> {

    /*
     * Tim user theo email (dung cho login/check ton tai)
     * */
    Optional<User> findByEmail(String email);

    /*
     * Check ton tai email nhanh, tranh query lay full object
     * */
    boolean existsByEmail(String email);
}
