# Hướng Dẫn Cài Đặt PayOS Invoice Tool

## Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu |
|---|---|
| Node.js | 18.x trở lên |
| pnpm | 8.x trở lên |
| MySQL / TiDB | 8.0 trở lên |
| Git | 2.x trở lên |

---

## Bước 1: Clone Repository

```bash
git clone https://github.com/<your-org>/payos-invoice-tool.git
cd payos-invoice-tool
```

---

## Bước 2: Cài Đặt Dependencies

```bash
pnpm install
```

---

## Bước 3: Cấu Hình Biến Môi Trường

Tạo file `.env` tại thư mục gốc của project:

```env
# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:3306/database_name

# ─── Authentication ───────────────────────────────────────────────────────────
JWT_SECRET=your_very_long_random_secret_here

# ─── Manus OAuth (nếu dùng Manus platform) ───────────────────────────────────
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# ─── Manus Built-in APIs ──────────────────────────────────────────────────────
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_built_in_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# ─── PayOS Payment Gateway ────────────────────────────────────────────────────
# Cấu hình trong Admin → Cài Đặt → PayOS sau khi cài đặt
```

> **Lưu ý bảo mật:** Không commit file `.env` lên Git. File này đã được thêm vào `.gitignore`.

---

## Bước 4: Khởi Tạo Database

### 4a. Tạo Database

Tạo database MySQL trống:

```sql
CREATE DATABASE payos_invoice_tool CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4b. Import Schema

Sử dụng file `data.sql` để tạo tất cả các bảng:

```bash
mysql -u user -p payos_invoice_tool < data.sql
```

Hoặc dùng Drizzle để migrate tự động:

```bash
pnpm db:push
```

---

## Bước 5: Chạy Ứng Dụng

### Development Mode

```bash
pnpm dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### Production Mode

```bash
pnpm build
pnpm start
```

---

## Bước 6: Thiết Lập Ban Đầu (First-Run Setup)

Khi truy cập lần đầu, hệ thống sẽ yêu cầu nhập **License Key**:

1. Truy cập `http://localhost:3000`
2. Hệ thống chuyển hướng đến trang **License Setup**
3. Nhập email và license key được cấp
4. Nhấn **Kích Hoạt**

> **Tạo License Key (dành cho developer):**
> ```bash
> node scripts/generate-license.mjs --email=admin@example.com --domain=yourdomain.com --plan=pro
> ```

---

## Bước 7: Cấu Hình Admin Đầu Tiên

Sau khi kích hoạt license, đăng nhập bằng tài khoản Manus OAuth và:

1. Vào **Admin → Cài Đặt → Thông Tin Cửa Hàng**: Điền tên, logo, thông tin liên hệ
2. Vào **Admin → Cài Đặt → PayOS**: Nhập Client ID và API Key từ PayOS
3. Vào **Admin → Cài Đặt → Email**: Cấu hình SMTP để gửi email tự động
4. Vào **Admin → Cài Đặt → Tính Năng**: Bật/tắt các tính năng theo nhu cầu

---

## Cấu Hình PayOS

1. Đăng ký tài khoản tại [payos.vn](https://payos.vn)
2. Tạo ứng dụng và lấy **Client ID**, **API Key**, **Checksum Key**
3. Nhập vào Admin → Cài Đặt → PayOS
4. Cấu hình **Webhook URL**: `https://yourdomain.com/api/payos/webhook`

---

## Cấu Hình Telegram Bot (Tùy Chọn)

### Bot Admin (nhận thông báo đơn hàng)

1. Tạo bot mới qua [@BotFather](https://t.me/BotFather) trên Telegram
2. Lấy **Bot Token**
3. Vào Admin → Cài Đặt → Telegram → Tab "Bot Admin"
4. Nhập token và nhấn **Kết Nối**

### Bot Khách Hàng (gửi thông báo cho khách)

1. Tạo bot riêng cho khách hàng qua [@BotFather](https://t.me/BotFather)
2. Vào Admin → Cài Đặt → Telegram → Tab "Bot Khách Hàng"
3. Nhập token và nhấn **Kết Nối**

---

## Cấu Hình Email SMTP

Hỗ trợ các nhà cung cấp SMTP phổ biến:

| Nhà cung cấp | Host | Port | Ghi chú |
|---|---|---|---|
| Gmail | smtp.gmail.com | 587 | Cần bật "App Password" |
| Outlook | smtp.office365.com | 587 | Dùng tài khoản Microsoft |
| SendGrid | smtp.sendgrid.net | 587 | Dùng API Key làm password |
| Mailgun | smtp.mailgun.org | 587 | Cần domain đã verify |

Cấu hình tại: Admin → Cài Đặt → Email → Tab "SMTP"

---

## Cấu Trúc Thư Mục

```
payos-invoice-tool/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/          # Các trang
│       ├── components/     # Components dùng chung
│       ├── hooks/          # Custom hooks
│       └── contexts/       # React contexts
├── server/                 # Backend Express + tRPC
│   ├── routers.ts          # tRPC procedures
│   ├── db.ts               # Database helpers
│   └── _core/              # Framework core (không chỉnh sửa)
├── drizzle/                # Database schema & migrations
│   └── schema.ts           # Schema definition
├── scripts/                # Utility scripts
│   ├── generate-license.mjs    # Tạo license key
│   └── generate-data-sql.py    # Tạo file data.sql
├── data.sql                # Database schema export
└── INSTALL.md              # File này
```

---

## Xử Lý Sự Cố

### Lỗi kết nối Database

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Kiểm tra:
- MySQL đang chạy: `sudo systemctl status mysql`
- `DATABASE_URL` trong `.env` đúng định dạng
- User có quyền truy cập database

### Lỗi License Key không hợp lệ

- Kiểm tra email nhập đúng với email đã đăng ký license
- Kiểm tra domain đúng với domain đã đăng ký
- Liên hệ nhà cung cấp để cấp lại license

### Lỗi PayOS Webhook

- Đảm bảo server có thể truy cập từ internet (không phải localhost)
- Kiểm tra Checksum Key đúng trong cài đặt
- Xem logs tại Admin → Hệ Thống → Trạng Thái

---

## Cập Nhật Hệ Thống

### Cập Nhật Thủ Công

```bash
git pull origin main
pnpm install
pnpm db:push
pnpm build
pnpm start
```

### Cập Nhật Tự Động

Bật tính năng **Auto-Update** tại Admin → Hệ Thống → Giấy Phép → Tab "Cập Nhật".

Hệ thống sẽ tự động kiểm tra và cập nhật khi có phiên bản mới.

---

## Hỗ Trợ

- **Email:** support@primeshop.vn
- **Telegram:** [@primeshop_support](https://t.me/primeshop_support)
- **Tài liệu:** Xem tại Admin → Hệ Thống → Tính Năng MR
