# Hệ Thống Quản Lý Phòng Khám Tư Nhân

## 📌 Mô Tả Dự Án

Đây là một hệ thống quản lý toàn diện dành cho phòng khám tư nhân, giúp tối ưu hóa quy trình quản lý lịch hẹn, hồ sơ bệnh nhân, khám bệnh, kê đơn thuốc, thanh toán và báo cáo thống kê. Hệ thống hỗ trợ nhiều vai trò người dùng với giao diện thân thiện và bảo mật cao.

---

## ✨ Tính Năng Chính

### 1. Đăng ký & Đăng nhập

* Cho phép người dùng đăng ký tài khoản mới với vai trò cụ thể (Quản trị viên, Bác sĩ, Lễ tân).
* Xác thực thông tin đăng nhập bằng JWT.
* Giao diện người dùng thân thiện cho form đăng nhập/đăng ký.
* Gửi thông báo lỗi khi sai thông tin.

### 2. Quản lý Bệnh nhân

* Thêm/Sửa/Xóa bệnh nhân
* Tìm kiếm bệnh nhân theo tên, mã số
* Lưu trữ lịch sử khám bệnh đầy đủ

### 3. Quản lý Lịch hẹn

* Đặt lịch theo ngày/tuần/tháng
* Gửi thông báo nhắc nhở qua email/SMS
* Xác nhận, chỉnh sửa hoặc hủy lịch hẹn

### 4. Khám bệnh & Hồ sơ y tế

* Ghi nhận triệu chứng, chẩn đoán, chỉ định
* Lưu trữ chi tiết từng lần khám bệnh
* Gắn kết thông tin lịch hẹn và đơn thuốc

### 5. Quản lý Thuốc & Kê đơn

* Quản lý danh mục thuốc: tên thuốc, tồn kho, đơn vị tính
* Kê đơn điện tử với liều lượng, hướng dẫn
* Theo dõi lượng thuốc sử dụng và tồn kho

### 6. Thanh toán & Hóa đơn

* Tạo, in và lưu trữ hóa đơn
* Quản lý phương thức thanh toán (tiền mặt, chuyển khoản, thẻ)
* Tính toán tự động chi phí dựa theo dịch vụ

### 7. Phân quyền người dùng

* Tài khoản Quản trị viên: toàn quyền hệ thống
* Bác sĩ: quản lý khám bệnh, đơn thuốc
* Lễ tân: quản lý lịch hẹn, thông tin bệnh nhân

### 8. Thống kê & Báo cáo

* Doanh thu theo ngày/tháng/năm
* Số lượt khám, bệnh nhân mới
* Hiệu suất bác sĩ/lễ tân

---

## 🚀 Công Nghệ Sử Dụng

### Backend (API)

* **Node.js** + **Express.js**
* **MongoDB** + **Mongoose**
* **JWT** cho xác thực
* **Joi** hoặc **express-validator** cho kiểm tra dữ liệu
* **Swagger** để tài liệu hóa API

### Frontend (Client)

* **ReactJS** + **Redux Toolkit**
* **React Router**
* **Material-UI** hoặc **Ant Design**
* **Axios** để gọi API

---

## 🛠️ Hướng Dẫn Cài Đặt và Chạy Dự Án

### Điều kiện tiên quyết

* Node.js >= 16.x
* npm hoặc yarn
* MongoDB đang hoạt động cục bộ hoặc cloud (Atlas)

### 1. Backend

```bash
git clone https://github.com/your-username/clinic-management-system.git
cd clinic-management-system/server
npm install
```

Tạo file `.env`:

```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/clinic_management_db
JWT_SECRET=your_jwt_secret_key
```

Chạy server:

```bash
npm start
```

API sẽ chạy tại: `http://localhost:8080`

### 2. Frontend

```bash
cd ../client
npm install
```

Tạo file `.env`:

```
REACT_APP_API_URL=http://localhost:8080/api
```

Chạy client:

```bash
npm start
```

Truy cập ứng dụng tại: `http://localhost:3000`

---

## 📦 Cấu Trúc CSDL (MongoDB)

* **Users**: Tài khoản người dùng
* **Patients**: Thông tin cá nhân và tiền sử bệnh
* **Appointments**: Lịch hẹn khám
* **MedicalRecords**: Chi tiết lần khám bệnh
* **Prescriptions**: Đơn thuốc
* **Medicines**: Danh sách thuốc

---

## 📘 Tài Liệu API (Swagger đề xuất tích hợp)

| Method | Endpoint               | Mô tả               | Auth |
| ------ | ---------------------- | ------------------- | ---- |
| POST   | /api/auth/register     | Đăng ký             | ❌    |
| POST   | /api/auth/login        | Đăng nhập           | ❌    |
| GET    | /api/patients          | Danh sách bệnh nhân | ✅    |
| POST   | /api/patients          | Thêm mới bệnh nhân  | ✅    |
| GET    | /api/appointments      | Danh sách lịch hẹn  | ✅    |
| POST   | /api/appointments      | Đặt lịch hẹn        | ✅    |
| PUT    | /api/appointments/\:id | Cập nhật lịch hẹn   | ✅    |

---

## ✅ Các Tính Năng Đề Xuất Mở Rộng

* Tích hợp Google Calendar hoặc Zalo Notification API để nhắc lịch hẹn
* Tích hợp thanh toán trực tuyến (Momo, VNPay)
* Giao diện in báo cáo cho quản trị
* Dashboard biểu đồ realtime (Chart.js, Recharts)
* Hệ thống backup và khôi phục dữ liệu tự động

---

## 🤝 Đóng Góp

* Fork dự án
* Tạo nhánh (`git checkout -b feature/AmazingFeature`)
* Commit (`git commit -m 'Add AmazingFeature'`)
* Push (`git push origin feature/AmazingFeature`)
* Mở Pull Request để xem xét

---

## 📬 Liên Hệ & Hỗ Trợ

Nếu bạn cần hỗ trợ hoặc có ý tưởng để cải thiện hệ thống, hãy mở issue trên GitHub hoặc liên hệ qua email: `support@clinicsoft.vn`

> "Chăm sóc sức khỏe hiệu quả bắt đầu từ quản lý thông minh."
