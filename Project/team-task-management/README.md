# Team Task Management System

Hệ thống quản lý công việc nhóm cho sinh viên được xây dựng bằng **Spring Boot**, **JPA/Hibernate**, **SQL Server** và tuân theo mô hình **MVC2**.

## Công nghệ sử dụng

- **Spring Boot 3.2.0**
- **Spring Data JPA** (ORM)
- **SQL Server** (Database)
- **JSP** (View)
- **Maven** (Build tool)
- **Java 17**

## Cấu trúc dự án

```
src/
├── main/
│   ├── java/com/teamtask/
│   │   ├── controller/      # Controllers (MVC2)
│   │   ├── service/          # Service layer
│   │   ├── repository/       # JPA Repositories
│   │   ├── model/            # Entity models
│   │   ├── config/           # Configuration classes
│   │   └── TeamTaskManagementApplication.java
│   ├── resources/
│   │   └── application.properties
│   └── webapp/
│       └── WEB-INF/
│           ├── views/        # JSP views
│           └── resources/    # CSS, JS, images
```

## Cài đặt và chạy

### Yêu cầu

1. **Java 17** hoặc cao hơn
2. **Maven 3.6+**
3. **SQL Server** (2012 trở lên)
4. **IDE** (IntelliJ IDEA, Eclipse, VS Code)

### Các bước cài đặt

1. **Clone hoặc tải dự án**

2. **Cấu hình SQL Server**

   - Tạo database mới: `TeamTaskManagement`
   - Cập nhật thông tin kết nối trong `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=TeamTaskManagement;encrypt=true;trustServerCertificate=true
   spring.datasource.username=sa
   spring.datasource.password=YourPassword123
   ```

3. **Build và chạy dự án**

   ```bash
   # Build project
   mvn clean install
   
   # Chạy ứng dụng
   mvn spring-boot:run
   ```

   Hoặc chạy trực tiếp class `TeamTaskManagementApplication`

4. **Truy cập ứng dụng**

   - Mở trình duyệt: `http://localhost:8080`
   - Ứng dụng sẽ tự động chuyển đến trang đăng nhập

## Cấu trúc Database

### Các bảng chính:

- **users**: Thông tin người dùng (sinh viên, leader, admin)
- **teams**: Thông tin nhóm
- **projects**: Thông tin dự án
- **tasks**: Thông tin công việc
- **task_assignments**: Gán công việc cho người dùng
- **team_members**: Quan hệ nhiều-nhiều giữa teams và users

Hibernate sẽ tự động tạo các bảng khi chạy ứng dụng lần đầu (do cấu hình `spring.jpa.hibernate.ddl-auto=update`).

## Tính năng

### Đã triển khai:

- ✅ Đăng nhập/Đăng xuất
- ✅ Quản lý Teams (Tạo, Xem, Xóa)
- ✅ Quản lý Tasks (Tạo, Xem, Cập nhật trạng thái, Xóa)
- ✅ Dashboard hiển thị thống kê
- ✅ Gán task cho user
- ✅ Quản lý thành viên team

### Các Entity Models:

- **User**: Quản lý thông tin người dùng
- **Team**: Quản lý nhóm
- **Project**: Quản lý dự án
- **Task**: Quản lý công việc
- **TaskAssignment**: Gán công việc

## Mô hình MVC2

Dự án tuân theo mô hình **MVC2** (Model-View-Controller 2):

- **Model**: Các Entity classes trong package `model`
- **View**: Các JSP files trong `WEB-INF/views`
- **Controller**: Các Controller classes trong package `controller`
- **Service Layer**: Xử lý business logic trong package `service`
- **Repository Layer**: Truy cập database qua JPA Repositories

## API Endpoints

### Authentication
- `GET /login` - Hiển thị trang đăng nhập
- `POST /login` - Xử lý đăng nhập
- `GET /logout` - Đăng xuất

### Dashboard
- `GET /dashboard` - Trang chủ với thống kê

### Teams
- `GET /teams` - Danh sách teams
- `GET /teams/new` - Form tạo team mới
- `POST /teams/create` - Tạo team mới
- `GET /teams/{id}` - Chi tiết team
- `POST /teams/{id}/delete` - Xóa team

### Tasks
- `GET /tasks` - Danh sách tasks
- `GET /tasks/new` - Form tạo task mới
- `POST /tasks/create` - Tạo task mới
- `GET /tasks/{id}` - Chi tiết task
- `POST /tasks/{id}/status` - Cập nhật trạng thái task
- `POST /tasks/{id}/delete` - Xóa task

## Lưu ý

1. **Bảo mật**: Hiện tại password được lưu dạng plain text. Trong môi trường production, nên sử dụng BCrypt để mã hóa password.

2. **Session Management**: Ứng dụng sử dụng HttpSession để quản lý phiên đăng nhập.

3. **Validation**: Đã có một số validation cơ bản, có thể mở rộng thêm.

4. **Error Handling**: Cần thêm xử lý lỗi toàn cục (Global Exception Handler).

## Phát triển tiếp

Các tính năng có thể mở rộng:

- [ ] Phân quyền chi tiết (Role-based access control)
- [ ] Upload file đính kèm cho task
- [ ] Thông báo (Notifications)
- [ ] Bình luận trên task
- [ ] Lịch sử hoạt động (Activity log)
- [ ] Export báo cáo
- [ ] API RESTful cho mobile app

## Tác giả

Team Task Management System

## License

MIT License

