# Docker Troubleshooting Guide

## Vấn đề thường gặp và cách khắc phục

### 1. Lỗi khi build Docker image

**Lỗi:** `Cannot connect to Docker daemon`
```bash
# Kiểm tra Docker đang chạy
docker ps

# Khởi động Docker Desktop (Windows/Mac) hoặc Docker service (Linux)
```

**Lỗi:** `Build failed`
```bash
# Xóa cache và build lại
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### 2. Container không khởi động được

**Kiểm tra logs:**
```bash
# Xem logs của app
docker-compose logs app

# Xem logs của postgres
docker-compose logs postgres

# Xem tất cả logs
docker-compose logs
```

**Lỗi kết nối database:**
```bash
# Kiểm tra postgres đã sẵn sàng chưa
docker-compose ps

# Kiểm tra postgres logs
docker-compose logs postgres | grep -i error
```

### 3. Port đã được sử dụng

**Lỗi:** `port is already allocated`

**Giải pháp 1:** Dừng service đang dùng port
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

**Giải pháp 2:** Đổi port trong docker-compose.yml
```yaml
ports:
  - "8081:8080"  # Thay đổi port bên ngoài
```

### 4. Ứng dụng không truy cập được

**Kiểm tra:**
```bash
# 1. Kiểm tra container đang chạy
docker-compose ps

# 2. Kiểm tra logs
docker-compose logs app

# 3. Kiểm tra network
docker network ls
docker network inspect food4fit_default

# 4. Test kết nối từ container
docker-compose exec app curl http://localhost:8080/auth/login
```

### 5. Database connection errors

**Lỗi:** `Connection refused` hoặc `Connection timeout`

**Giải pháp:**
```bash
# 1. Đảm bảo postgres đang chạy
docker-compose ps postgres

# 2. Kiểm tra environment variables
docker-compose exec app env | grep SPRING

# 3. Test kết nối từ app container đến postgres
docker-compose exec app ping postgres
```

### 6. Build chậm hoặc timeout

**Giải pháp:**
```bash
# Sử dụng build cache
docker-compose build

# Hoặc build không cache (nếu có vấn đề)
docker-compose build --no-cache --pull
```

### 7. Xóa và khởi động lại hoàn toàn

```bash
# Dừng và xóa containers, networks
docker-compose down

# Xóa volumes (cảnh báo: mất dữ liệu)
docker-compose down -v

# Xóa images
docker-compose down --rmi all

# Khởi động lại từ đầu
docker-compose up -d --build
```

### 8. Kiểm tra ứng dụng đang chạy

```bash
# Xem tất cả containers
docker ps -a

# Xem resource usage
docker stats

# Vào trong container
docker-compose exec app sh
```

### 9. Lỗi permission (Linux/Mac)

```bash
# Sửa quyền cho mvnw (nếu cần)
chmod +x mvnw

# Hoặc rebuild
docker-compose build --no-cache
```

### 10. Lệnh hữu ích

```bash
# Xem logs real-time
docker-compose logs -f app

# Restart một service
docker-compose restart app

# Rebuild và restart
docker-compose up -d --build app

# Xem cấu hình
docker-compose config

# Kiểm tra health
docker-compose ps
```

## Các bước debug cơ bản

1. **Kiểm tra Docker đang chạy:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Kiểm tra containers:**
   ```bash
   docker-compose ps
   ```

3. **Xem logs:**
   ```bash
   docker-compose logs app
   docker-compose logs postgres
   ```

4. **Kiểm tra network:**
   ```bash
   docker network inspect food4fit_default
   ```

5. **Test kết nối:**
   ```bash
   curl http://localhost:8080/auth/login
   ```

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp:
- Output của `docker-compose logs app`
- Output của `docker-compose ps`
- Lỗi cụ thể bạn gặp phải

