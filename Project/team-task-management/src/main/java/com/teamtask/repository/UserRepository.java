package com.teamtask.repository;

import com.teamtask.model.User;
import com.teamtask.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface cho User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm user theo email
     */
    Optional<User> findByEmail(String email);

    /**
     * Tìm user theo username
     */
    Optional<User> findByUsername(String username);

    /**
     * Tìm user theo email hoặc username
     */
    Optional<User> findByEmailOrUsername(String email, String username);

    /**
     * Kiểm tra email đã tồn tại chưa
     */
    boolean existsByEmail(String email);

    /**
     * Kiểm tra username đã tồn tại chưa
     */
    boolean existsByUsername(String username);

    /**
     * Tìm user theo student code
     */
    Optional<User> findByStudentCode(String studentCode);

    /**
     * Tìm tất cả user theo role
     */
    List<User> findByRole(UserRole role);

    /**
     * Tìm tất cả user đang active
     */
    List<User> findByIsActiveTrue();

    /**
     * Tìm user theo team
     */
    @Query("SELECT u FROM User u JOIN u.teams t WHERE t.teamId = :teamId")
    List<User> findByTeamId(@Param("teamId") Long teamId);
}

