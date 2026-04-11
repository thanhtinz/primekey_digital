# PrimeShop — Nền Tảng Bán Hàng Số Tích Hợp PayOS

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square&logo=trpc&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-MySQL-C5F74F?style=flat-square&logo=drizzle&logoColor=black" />
  <img src="https://img.shields.io/badge/PayOS-Tích_hợp-0066FF?style=flat-square" />
</p>

Hệ thống bán hàng số toàn diện được xây dựng trên nền tảng React 19 + Express 4 + tRPC 11, tích hợp cổng thanh toán **PayOS** và đầy đủ các tính năng quản lý cần thiết cho một shop bán hàng số chuyên nghiệp.

---

## Tính Năng Nổi Bật

### Thanh Toán & Tài Chính
- **Tích hợp PayOS** — thanh toán QR, webhook tự động xác nhận đơn hàng
- **Ví điện tử nội bộ** — nạp tiền, rút tiền, lịch sử giao dịch
- **Hóa đơn VAT** — xuất hóa đơn PDF tự động theo thông tin khách hàng
- **Hoàn tiền** — quy trình hoàn tiền vào ví hoặc tài khoản ngân hàng
- **Affiliate & Referral** — hệ thống hoa hồng, rút tiền affiliate

### Quản Lý Sản Phẩm & Đơn Hàng
- **Sản phẩm số** — quản lý key, tài khoản, file download theo đơn hàng
- **Danh mục & Tag** — phân loại sản phẩm đa cấp
- **Mã giảm giá** — coupon theo %, theo số tiền, giới hạn lượt dùng
- **Giỏ hàng & Checkout** — luồng mua hàng đầy đủ với xác nhận OTP
- **Theo dõi đơn hàng** — tra cứu trạng thái đơn hàng công khai

### Quản Lý Khách Hàng
- **Đăng ký / Đăng nhập** — mật khẩu mạnh, giới hạn đăng ký theo IP
- **Xác thực 2 bước (2FA)** — TOTP với cảnh báo bảo mật qua Telegram/Email
- **Liên kết Telegram** — nhận thông báo đơn hàng, cảnh báo đăng nhập
- **Điểm thưởng & Spin Wheel** — gamification tăng tương tác
- **Wishlist & Đánh giá** — yêu thích sản phẩm, review có kiểm duyệt

### Hỗ Trợ Khách Hàng
- **Ticket hỗ trợ** — hệ thống ticket nội bộ với phân loại và ưu tiên
- **Bảo hành** — quản lý yêu cầu bảo hành, tra cứu công khai
- **Blog** — viết bài, phân loại, SEO-friendly

### Quản Trị Hệ Thống
- **Dashboard** — thống kê doanh thu, đơn hàng, khách hàng theo thời gian thực
- **Báo cáo** — xuất Excel báo cáo doanh thu, đơn hàng
- **Quản lý nhân viên** — phân quyền admin/staff
- **Cài đặt toàn diện** — 10+ nhóm cài đặt: PayOS, SMTP, Telegram, bảo mật, giao diện
- **Chế độ bảo trì** — bật/tắt bảo trì không ảnh hưởng admin
- **Block IP** — chặn IP đáng ngờ
- **Auto-update** — tự động cập nhật phiên bản mới
- **Giấy phép** — hệ thống license key bảo vệ bản quyền

### Banner & Giao Diện
- **Banner slideshow** — carousel ảnh trang chủ với upload S3
- **Side Banner** — banner trái/phải với upload ảnh trực tiếp
- **Mini Banner** — 4 ô banner nhỏ dưới slideshow
- **Thông báo hệ thống** — announcement banner toàn trang

---

## Công Nghệ Sử Dụng

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Wouter |
| Backend | Express 4, tRPC 11, Superjson |
| Database | MySQL / TiDB + Drizzle ORM |
| Auth | JWT, OAuth, TOTP 2FA |
| Storage | AWS S3 (upload ảnh, file) |
| Payment | PayOS (QR code, webhook) |
| Notification | Telegram Bot, SMTP Email |
| PDF/Excel | jsPDF, ExcelJS |

---

## Cài Đặt Nhanh

```bash
# 1. Clone repository
git clone https://github.com/thanhtinz/primekey_digital.git
cd primekey_digital

# 2. Cài đặt dependencies
pnpm install

# 3. Cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env với DATABASE_URL, JWT_SECRET, ...

# 4. Khởi tạo database
pnpm db:push

# 5. Chạy development server
pnpm dev
```

Xem hướng dẫn cài đặt chi tiết tại [INSTALL.md](./INSTALL.md).

---

## Cấu Hình Môi Trường

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret key cho session cookie |
| `PAYOS_CLIENT_ID` | Client ID từ PayOS dashboard |
| `PAYOS_API_KEY` | API Key từ PayOS dashboard |
| `PAYOS_CHECKSUM_KEY` | Checksum Key để xác thực webhook |
| `SMTP_HOST` | SMTP server gửi email |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram |

---

## Cấu Trúc Dự Án

```
client/src/
  pages/          ← 115+ trang (admin + client)
  components/     ← UI components tái sử dụng
  hooks/          ← Custom React hooks
server/
  routers.ts      ← tRPC procedures (~9000 dòng)
  db.ts           ← Database query helpers
  payos.ts        ← PayOS integration
  telegram.ts     ← Telegram bot
  email.ts        ← SMTP email
drizzle/
  schema.ts       ← Database schema
  *.sql           ← Migration files
```

---

## License

Dự án này được bảo vệ bởi hệ thống license key. Liên hệ để được cấp phép sử dụng.
