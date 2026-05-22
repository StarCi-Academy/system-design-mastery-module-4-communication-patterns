# Module 3: Communication Patterns in Microservices

Chào mừng bạn đến với Module 3 của khóa học **System Design Mastery**. Module này tập trung vào các mô hình giao tiếp giữa các dịch vụ trong kiến trúc Microservices.

## Danh sách bài học

### 0. API Gateway Pattern
- **Mục tiêu:** Tập trung hóa routing, bảo mật và giới hạn băng thông.
- **Công nghệ:** Kong API Gateway, PostgreSQL, Konga, NestJS.
- **Thư mục:** `0-api-gateway`

### 1. Synchronous Communication — REST vs gRPC
- **Mục tiêu:** So sánh và áp dụng mô hình Hybrid (REST bên ngoài, gRPC bên trong).
- **Công nghệ:** NestJS, gRPC, Protocol Buffers.
- **Thư mục:** `1-synchronous-communication-rest-grpc`

### 2. Asynchronous Event-Driven — Kafka
- **Mục tiêu:** Tách rời dịch vụ và tăng khả năng chịu lỗi bằng hướng sự kiện.
- **Công nghệ:** Apache Kafka (KRaft), NestJS.
- **Thư mục:** `2-asynchronous-event-driven`

### 3. Publish-Subscribe Pattern — NATS
- **Mục tiêu:** Phát tin nhắn tốc độ siêu cao theo mô hình Fire-and-forget.
- **Công nghệ:** NATS Server, NestJS.
- **Thư mục:** `3-publish-subscribe-pattern`

---
**Hướng dẫn chung:**
1. Khóa học sử dụng **Kubernetes** (Minikube) làm môi trường thực hành chính.
2. Hạ tầng được triển khai qua **Helm** (như Kafka, Database) và **Kubernetes Manifests**.
3. Chi tiết triển khai và kiểm thử nằm trong file `vi.md` (Tiếng Việt) hoặc `en.md` (English) tại từng thư mục bài học.
4. Sử dụng script `build_and_push.ps1` để tự động đóng gói và đẩy image lên Docker Hub (nếu cần).

## Comment & cấu trúc (strict §4)
- `compose.yaml`: header + comment từng service (VI + EN).
- `*.service.ts` / `*.controller.ts`: mọi method có JSDoc **Logic —** + **Code —** + EN Logic/Code.
- Regenerate: `node scratch/comment_system_design_modules_1_11.mjs`

