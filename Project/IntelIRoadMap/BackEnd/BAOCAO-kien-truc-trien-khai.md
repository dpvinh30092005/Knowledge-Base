# Lựa chọn kiến trúc triển khai: Docker Compose vs. Kubernetes

*(Đoạn viết sẵn cho báo cáo — có thể copy trực tiếp.)*

## 1. Bối cảnh

Hệ thống InteliPath gồm bốn thành phần chạy đồng thời: cơ sở dữ liệu PostgreSQL
(có pgvector), dịch vụ AI (Python/FastAPI), backend (Spring Boot) và frontend
(React SPA). Bài toán triển khai đặt ra là: đóng gói, khởi chạy và kết nối các
thành phần này với nhau, đưa ra Internet qua HTTPS, trên hạ tầng phù hợp với quy
mô và nguồn lực của một đồ án.

Có hai hướng công nghệ phổ biến để điều phối (orchestrate) nhiều container:
**Docker Compose** và **Kubernetes (K8s)**. Nhóm đã cân nhắc cả hai và lựa chọn
Docker Compose. Mục này trình bày so sánh và lý do.

## 2. So sánh Docker Compose và Kubernetes

| Tiêu chí | Docker Compose | Kubernetes |
|---|---|---|
| Mô hình | Chạy nhiều container trên **một máy chủ** | Điều phối container trên **một cụm nhiều máy (cluster)** |
| Cấu hình | Một file `docker-compose.yml` | Nhiều manifest YAML (Deployment, Service, Ingress, ConfigMap, HPA…) |
| Đường cong học tập | Thấp — nắm trong vài giờ | Cao — nhiều khái niệm (Pod, Node, Ingress, kubelet…) |
| Tự phục hồi (self-healing) | Cơ bản (`restart: unless-stopped`) | Mạnh (tự thay Pod chết, dời tải sang Node khác) |
| Auto-scaling | Không có sẵn | Có (HPA — tự tăng/giảm số Pod theo tải) |
| Cân bằng tải nhiều node | Không | Có (built-in) |
| Reverse proxy / TLS | Nginx cấu hình bằng file `nginx.conf` | Ingress (nginx-ingress) khai báo bằng YAML |
| Chi phí hạ tầng | Một VPS (rẻ) | Cụm nhiều node + control plane (đắt, phức tạp) |
| Phù hợp quy mô | Nhỏ → vừa, một máy chủ | Vừa → lớn, cần co giãn và độ sẵn sàng cao |

Điểm cần nhấn mạnh: **vai trò của Nginx là như nhau ở cả hai hướng** — làm reverse
proxy gộp frontend và API về một origin, phục vụ file tĩnh của SPA (kèm fallback
cho client-side routing) và làm cổng vào HTTPS. Khác biệt chỉ là cách khai báo:
Docker Compose dùng một file `nginx.conf` đặt trên máy chủ, còn Kubernetes dùng một
tài nguyên `Ingress` (nginx-ingress controller) viết dưới dạng manifest.

## 3. Lý do lựa chọn Docker Compose

1. **Phù hợp quy mô bài toán.** Kubernetes sinh ra để giải quyết auto-scaling và
   độ sẵn sàng cao trên nhiều máy chủ — những nhu cầu chỉ xuất hiện ở hệ thống lưu
   lượng lớn. Với một đồ án chạy trên một máy chủ, các năng lực đó là dư thừa, đổi
   lại sự phức tạp không tương xứng ("dùng búa tạ đập ruồi").

2. **Chi phí và vận hành hợp lý.** Toàn hệ thống chạy gọn trên một VPS Hostinger
   KVM (1 vCPU / 4 GB) giá thấp. Một cụm Kubernetes cần tối thiểu vài node cộng
   control plane, chi phí và công sức vận hành cao hơn nhiều lần.

3. **Dễ hiểu, dễ trình bày, dễ bàn giao.** Toàn bộ hạ tầng gói trong một file
   `docker-compose.yml` và một file `nginx.conf` — người đọc nắm được kiến trúc
   triển khai chỉ trong vài phút, thuận lợi cho báo cáo và bảo vệ đồ án.

4. **Vẫn có các thuộc tính sản xuất cần thiết.** Docker Compose đáp ứng đủ yêu cầu
   thực tế của hệ thống: tự khởi động lại khi lỗi hoặc khi máy chủ reboot
   (`restart: unless-stopped`), cô lập các dịch vụ nội bộ (chỉ Nginx expose ra
   Internet, PostgreSQL/backend không mở cổng), và HTTPS qua Let's Encrypt.

Tóm lại, Docker Compose là lựa chọn **cân bằng nhất giữa độ phức tạp và lợi ích**
cho quy mô hiện tại của InteliPath.

## 4. Hướng mở rộng (nếu cần scale)

Kiến trúc hiện tại không loại trừ Kubernetes trong tương lai. Khi hệ thống cần
phục vụ lượng người dùng lớn, cần chạy trên nhiều node và tự co giãn, có thể chuyển
sang Kubernetes: mỗi dịch vụ trong `docker-compose.yml` ánh xạ thành một
Deployment + Service, `nginx.conf` ánh xạ thành một Ingress, và bổ sung HPA cho
auto-scaling. Việc đã container-hoá toàn bộ dịch vụ từ đầu giúp quá trình chuyển
đổi này thuận lợi.
