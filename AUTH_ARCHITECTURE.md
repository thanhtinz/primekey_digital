# Kiến trúc Authentication

## Quan trọng: Hệ thống KHÔNG dùng Manus OAuth

Hệ thống này sử dụng email/password authentication thuần túy, không tích hợp Manus OAuth.

## Hai luồng Auth song song

### 1. Admin Auth (JWT Cookie)
- **Trang đăng nhập**: `/login` (Login.tsx)
- **API**: `POST /api/auth/login` (authRoutes.ts)
- **Cơ chế**: Server set JWT cookie (`COOKIE_NAME`) sau khi xác thực
- **Context**: `protectedProcedure` đọc cookie → `ctx.user` có giá trị
- **Dùng cho**: Toàn bộ admin panel (Dashboard, Invoices, Products, Settings, Announcements, v.v.)
- **Bảng DB**: `users` (có `role` field: `admin` | `user`)

### 2. Customer Auth (Token in localStorage)
- **Trang đăng nhập**: `/client-login` (ClientLogin.tsx)
- **API**: `trpc.customer.loginWithPassword` (publicProcedure)
- **Cơ chế**: Server trả về `token`, client lưu vào `localStorage("customerToken")`
- **Context**: `CustomerAuthContext` lưu token, truyền vào query input `{ token }`
- **Dùng cho**: Trang khách hàng (MyAccount, Cart, Wallet, TrackOrder, v.v.)
- **Bảng DB**: `customers` + `customerSessions`

## Lưu ý quan trọng

- `protectedProcedure` = yêu cầu JWT cookie (admin login) — KHÔNG phải Manus OAuth
- Khi admin đăng nhập qua `/login`, server set JWT cookie → `ctx.user` có giá trị
- `AnnouncementManagement` dùng `protectedProcedure` là ĐÚNG
- Các trang admin KHÔNG cần truyền token vào query input
- Các trang customer CẦN truyền `{ token }` vào query input

## Files quan trọng

- `server/_core/authRoutes.ts` — Admin login/logout routes
- `server/_core/context.ts` — Đọc JWT cookie → set `ctx.user`
- `server/_core/trpc.ts` — `protectedProcedure`, `adminProcedure`
- `client/src/pages/Login.tsx` — Admin login UI
- `client/src/pages/ClientLogin.tsx` — Customer login UI
- `client/src/contexts/CustomerAuthContext.tsx` — Customer session management
