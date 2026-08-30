package com.teamtask.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình Session và Interceptors
 */
@Configuration
public class SessionConfig implements WebMvcConfigurer {

    // Có thể thêm interceptors ở đây nếu cần
    // Ví dụ: AuthenticationInterceptor để kiểm tra đăng nhập
}

