# Đề xuất đồ án môn học: Mật mã và ứng dụng (NT2205)

**Họ tên:** Nguyễn Phúc Hải  
**MSHV:** 240202021  
**Giảng viên hướng dẫn:** TS Nguyễn Ngọc Tự  

---

## 1. Tên đề tài
**Triển khai và bảo mật hệ thống DevSecOps với Kubernetes và Helm Charts**

## 2. Mục tiêu đề tài
- Xây dựng quy trình DevSecOps tự động hóa triển khai ứng dụng trên Kubernetes.
- Ứng dụng các kỹ thuật mã hóa, bảo mật thông tin trong pipeline CI/CD.
- Sử dụng Helm Charts để quản lý cấu hình và triển khai bảo mật cho các dịch vụ.
- Đảm bảo an toàn dữ liệu, bảo vệ thông tin nhạy cảm trong quá trình phát triển và vận hành.

## 3. Nội dung thực hiện
### 3.1. Khảo sát và phân tích
- Tìm hiểu tổng quan về DevSecOps, Kubernetes, Helm, CI/CD và các kỹ thuật bảo mật ứng dụng.
- Phân tích các rủi ro bảo mật thường gặp trong quá trình phát triển và vận hành ứng dụng.

### 3.2. Thiết kế hệ thống
- Thiết kế kiến trúc hệ thống DevSecOps mẫu, xác định các thành phần chính: CI/CD pipeline, Kubernetes cluster, Helm Charts, reverse proxy (Nginx), các công cụ bảo mật.
- Lựa chọn công cụ kiểm tra bảo mật mã nguồn mở phù hợp (Trivy, Snyk, v.v.).

### 3.3. Triển khai và cấu hình
- Xây dựng pipeline CI/CD tích hợp các bước kiểm tra bảo mật (Security Scanning, Secret Management).
- Cấu hình và triển khai ứng dụng mẫu lên Kubernetes sử dụng Helm Charts.
- Áp dụng mã hóa cho dữ liệu nhạy cảm trong file cấu hình (secrets, configmap).
- Thiết lập reverse proxy bảo mật với Nginx.

### 3.4. Kiểm thử và đánh giá
- Thực hiện kiểm thử bảo mật cho hệ thống (quét lỗ hổng, kiểm tra rò rỉ thông tin, kiểm tra quản lý secrets).
- Đánh giá hiệu quả các biện pháp bảo mật đã áp dụng.

### 3.5. Báo cáo và tài liệu hóa
- Viết báo cáo tổng kết quá trình thực hiện, phân tích kết quả kiểm thử, đề xuất cải tiến.
- Soạn thảo tài liệu hướng dẫn triển khai, vận hành và kiểm thử hệ thống.

## 4. Kết quả mong đợi
- Một hệ thống DevSecOps mẫu hoàn chỉnh, tích hợp các bước kiểm tra bảo mật.
- Bộ Helm Charts mẫu cho triển khai ứng dụng bảo mật trên Kubernetes.
- Báo cáo phân tích các rủi ro bảo mật và cách khắc phục.
- Tài liệu hướng dẫn triển khai, vận hành và kiểm thử hệ thống.

## 5. Công nghệ sử dụng
- Kubernetes, Helm, ArgoCD, Docker, Nginx
- Các công cụ kiểm tra bảo mật mã nguồn mở: Trivy, Snyk
- GitLab CI/CD hoặc GitHub Actions

## 6. Kế hoạch thực hiện (dự kiến)
| Tuần | Nội dung |
|------|---------|
| 1-2  | Khảo sát, phân tích yêu cầu, tìm hiểu công nghệ |
| 3-4  | Thiết kế kiến trúc hệ thống, lựa chọn công cụ |
| 5-7  | Xây dựng pipeline CI/CD, tích hợp kiểm tra bảo mật |
| 8-9  | Cấu hình, triển khai ứng dụng mẫu với Helm Charts |
| 10   | Áp dụng mã hóa, bảo mật thông tin nhạy cảm |
| 11   | Thiết lập reverse proxy bảo mật với Nginx |
| 12   | Kiểm thử, đánh giá hệ thống |
| 13   | Viết báo cáo, tài liệu hướng dẫn |
| 14   | Hoàn thiện, nộp báo cáo và demo |

## 7. Tài liệu tham khảo
- Tài liệu chính thức của Kubernetes, Helm, ArgoCD
- OWASP DevSecOps Guideline
- Sách, bài báo về bảo mật ứng dụng và DevSecOps
- Các nguồn mở về kiểm tra bảo mật: Trivy, Snyk

---

*Người thực hiện: Nguyễn Phúc Hải*
