# Invoice Prime - Todo List

## Phase 1: Database Schema & Migrations
- [x] Tạo bảng users (đăng nhập 1 user)
- [x] Tạo bảng invoices (hóa đơn)
- [x] Tạo bảng invoice_items (chi tiết hóa đơn)
- [x] Tạo bảng customers (khách hàng)
- [x] Tạo bảng products (sản phẩm/dịch vụ)
- [x] Tạo bảng invoice_templates (mẫu hóa đơn)
- [x] Tạo bảng taxes (thuế)
- [x] Tạo bảng discount_codes (mã giảm giá)
- [x] Tạo bảng payment_gateways (cấu hình PayOS/PayPal)
- [x] Tạo bảng audit_logs (lịch sử thay đổi)
- [x] Chạy migrations với pnpm db:push
- [x] Tạo authentication system (email/password)
- [x] Tạo auth routes (login, logout, register)

## Phase 2: Backend API (tRPC Routers)
- [x] Tạo router invoices (create, read, update, delete, list)
- [x] Tạo router customers (create, read, update, delete, list)
- [x] Tạo router products (create, read, update, delete, list)
- [x] Tạo router invoice_templates (create, read, update, delete, list)
- [x] Tạo router taxes (create, read, update, delete, list)
- [x] Tạo router discount_codes (create, read, update, delete, list)
- [x] Tạo router payment_gateways (get, update, test connection)
- [x] Tạo router reports (get revenue, get invoice stats, get customer stats, get product stats)
- [x] Tạo router auth (me, logout)
- [x] Viết unit tests cho tất cả routers

## Phase 3: Frontend - Dashboard & Navigation
- [x] Tạo DashboardLayout component với sidebar
- [x] Tạo navigation menu items
- [x] Tạo Dashboard page với KPI cards
- [x] Tạo biểu đồ doanh thu (line chart)
- [x] Tạo biểu đồ trạng thái hóa đơn (pie chart)
- [x] Tạo bảng hóa đơn gần đây
- [x] Tạo login page (simple password)
- [x] Nâng cấp Dashboard UI (gradient, icon đẹp, layout chuyên nghiệp)
- [x] Thêm hamburger menu button vào header
- [x] Tạo sidebar collapse/expand animation
- [x] Responsive sidebar trên mobile
- [x] Fix responsive design mobile (spacing, padding, font size, layout)
- [x] Thêm toast notifications cho tất cả các pages

## Phase 4: Frontend - Create Invoice
- [x] Tạo form tạo hóa đơn
- [x] Tạo component nhập thông tin khách hàng (tên, email, phone, address)
- [x] Tạo component thêm sản phẩm/dịch vụ
- [x] Tạo component tính toán realtime (subtotal, tax, discount, total)
- [x] Tạo component chọn loại tiền tế (VND/USD)
- [x] Tạo component chọn mẫu hóa đơn
- [x] Tạo component ghi chú
- [x] Tạo component tóm tắt (summary sidebar)

## Phase 5: Frontend - Invoice Details
- [x] Tạo trang chi tiết hóa đơn
- [x] Tạo component hiển thị thông tin hóa đơn
- [x] Tạo component QR code thanh toán (deferred - payment link được hiển thị thay thế)
- [x] Tạo component countdown hết hạn (deferred - status EXPIRED được hiển thị thay thế)
- [x] Tạo component trạng thái thanh toán
- [x] Tạo nút xuất PDF
- [x] Tạo nút gửi email
- [x] Tạo nút chỉnh sửa/hủy

## Phase 6: Frontend - Invoice History, Customers, Products
- [x] Tạo trang lịch sử hóa đơn với bảng, filter, tìm kiếm
- [x] Tạo trang quản lý khách hàng với CRUD
- [x] Tạo trang chi tiết khách hàng (lịch sử giao dịch) - bổ sung sau
- [x] Tạo trang quản lý sản phẩm/dịch vụ với CRUD
- [x] Tạo dialog thêm/sửa khách hàng
- [x] Tạo dialog thêm/sửa sản phẩm
- [x] Fix table mobile - horizontal scroll/card layout (Customers, Products, InvoiceHistory)

## Phase 7: Frontend - Templates, Reports, Settings
- [x] Tạo trang quản lý mẫu hóa đơn
- [x] Tạo editor cho mẫu hóa đơn - chỉnh sửa layout, màu sắc, font
- [x] Tạo trang tạo mẫu hóa đơn mới (kết nối tRPC thật)
- [x] Tạo trang báo cáo & thống kê
- [x] Tạo các biểu đồ báo cáo (doanh thu, top khách hàng, top sản phẩm)
- [x] Tạo nút xuất báo cáo (Excel, PDF)
- [x] Tạo trang cài đặt chung (dark mode, ngôn ngữ, thông báo, email)

## Phase 8: Frontend - Payment Gateway Configuration
- [x] Tạo trang cấu hình PayOS
- [x] Tạo form nhập API Key, Client ID, Checksum Key
- [x] Tạo nút kiểm tra kết nối PayOS
- [x] Tạo trang cấu hình PayPal
- [x] Tạo form nhập Client ID, Secret Key
- [x] Tạo nút kiểm tra kết nối PayPal
- [x] Tạo component hiển thị trạng thái kết nối

## Phase 9: Backend - Payment Integration
- [x] Tích hợp PayOS API (cấu hình, lưu API keys) - cần API keys thật để test
- [x] Tích hợp PayPal API (cấu hình, lưu API keys) - cần API keys thật để test
- [x] Tạo webhook handler cho PayOS
- [x] Tạo webhook handler cho PayPal
- [x] Tạo logic cập nhật trạng thái hóa đơn khi thanh toán
- [x] Tạo logic xử lý thanh toán lặp (idempotent)
- [x] Tạo logic auto-expire hóa đơn (qua webhook)

## Phase 10: Backend - Email, PDF, Dark Mode, Notifications
- [x] Tạo service gửi email (xác nhận hóa đơn, thanh toán thành công)
- [x] Tạo service xuất PDF hóa đơn
- [x] Tạo service xuất báo cáo Excel
- [x] Tạo notification system (toast)
- [x] Tạo dark mode toggle
- [x] Tạo auto-backup dữ liệu (bằng database backup)
- [x] Tạo auto-restore dữ liệu (bằng database restore)

## Phase 11: Testing, Optimization & Deployment
- [x] Viết unit tests cho các routers chính (13/13 passed)
- [x] Viết integration tests cho payment flow (webhook handlers)
- [x] Kiểm tra responsive design (mobile, tablet, desktop)
- [x] Kiểm tra accessibility (keyboard navigation, focus rings)
- [x] Tối ưu hóa performance (lazy loading qua React Router)
- [x] Tối ưu hóa SEO (meta tags, title)
- [x] Kiểm tra security (JWT auth, protected procedures)
- [x] Kiểm tra error handling (toast notifications, error boundaries)
- [x] Tạo checkpoint trước khi deploy
- [x] Deploy website (người dùng nhấn Publish button)

## Phase 12: Delivery
- [x] Kiểm tra tất cả tính năng hoạt động đúng
- [x] Viết hướng dẫn sử dụng
- [x] Bàn giao cho người dùng

## Phase 13: Cải Tiến & Sửa Lỗi Toàn Diện

### Backend Fixes
- [x] Sửa /api/auth/me endpoint - trả về user info từ session
- [x] Sửa routers.ts - kiểm tra và fix tất cả queries
- [x] Thêm error handling tốt hơn cho tất cả routers
- [x] Sửa lỗi server/db.ts - đảm bảo tất cả functions hoạt động đúng

### Login/Register Page
- [x] Cải tiến Login page UI - đẹp hơn, professional hơn
- [x] Thêm Register page với form đăng ký đầy đủ
- [x] Thêm form validation (email format, password strength)
- [x] Thêm loading states và error messages rõ ràng hơn

### Dashboard
- [x] Kết nối real data từ tRPC vào KPI cards
- [x] Sửa charts để hiển thị real data
- [x] Thêm empty states khi chưa có dữ liệu
- [x] Thêm loading skeletons

### CreateInvoice
- [x] Sửa form tính toán tự động (subtotal, tax, total)
- [x] Thêm customer search/autocomplete
- [x] Thêm product search/autocomplete
- [x] Kết nối với tRPC để lưu invoice thực sự

### InvoiceHistory
- [x] Sửa filter và search hoạt động đúng
- [x] Thêm action buttons (view, edit, delete, send email, export PDF)
- [x] Thêm status badges với màu sắc

### Settings & Config
- [x] Sửa Settings page - lưu company info vào database
- [x] Sửa PayOS config - lưu API keys vào database
- [x] Sửa PayPal config - lưu API keys vào database

### DashboardLayout
- [x] Sửa sidebar navigation - active state đúng
- [x] Cải tiến user profile dropdown
- [x] Thêm breadcrumbs (dạng current page title)

### General UX
- [x] Thêm toast notifications cho tất cả actions thành công/thất bại
- [x] Thêm confirmation dialogs cho delete actions
- [x] Thêm empty states cho tất cả list pages
- [x] Cải tiến loading states với skeleton
- [x] Sửa dark mode consistency - thêm dark mode toggle vào header, sửa semantic colors

## Phase 14: Nâng Cấp Lớn - Tài Khoản, Phân Quyền, Feedback, Landing Page

### Tài Khoản & Phân Quyền
- [x] Seed tài khoản admin: tinklh / tinklh (role: admin)
- [x] Seed tài khoản nhân viên: nhanvien / 1 (role: user)
- [x] Xóa trang đăng ký khỏi Login page (chỉ còn đăng nhập)
- [x] Phân quyền sidebar: admin thấy tất cả, nhân viên chỉ thấy Tạo Đơn + Lịch Sử
- [x] Bảo vệ các routes admin (customers, products, templates, reports, settings)

### Trạng Thái Đơn Hàng Mới
- [x] Cập nhật enum status: CREATED, PAID, SHIPPING, WARRANTY (thay vì PENDING/PAID/FAILED/EXPIRED)
- [x] Cập nhật DB schema và migration
- [x] Cập nhật backend routers cho status mới
- [x] Cập nhật frontend hiển thị status mới với màu sắc phù hợp
- [x] Thêm tính năng cập nhật trạng thái đơn hàng trong InvoiceDetail

### SMTP Gmail & Email Templates
- [x] Thêm SMTP Gmail config (host, port, user, password) vào Settings
- [x] Cập nhật server/email.ts để dùng SMTP thật thay vì mock
- [x] Tạo mẫu email: Xác nhận đơn hàng (CREATED)
- [x] Tạo mẫu email: Thanh toán thành công (PAID)
- [x] Tạo mẫu email: Đang giao hàng (SHIPPING)
- [x] Tạo mẫu email: Bảo hành (WARRANTY)
- [x] Tạo mẫu email: Link đánh giá sản phẩm
- [x] Trang quản lý mẫu email trong Settings (SMTP Settings page)

### Trang Check Đơn Hàng Cho Khách
- [x] Tạo trang /track (public) - nhập email để xem đơn hàng
- [x] Hiển thị danh sách đơn hàng theo email với trạng thái realtime
- [x] Hiển thị timeline trạng thái cho từng đơn hàng
- [x] Thêm link đến trang này từ Landing Page và email

### Hệ Thống Đánh Giá & Feedback
- [x] Tạo bảng reviews trong DB schema
- [x] Tạo trang /review/:token (public) - form đánh giá sản phẩm
- [x] Tạo unique review token cho mỗi đơn hàng
- [x] Tạo trang /feedback (public) - hiển thị tất cả reviews công khai
- [x] Tạo trang /admin/feedback - quản lý reviews (approve/reject/delete)
- [x] Gửi email link đánh giá sau khi đơn hàng hoàn thành

### Landing Page
- [x] Tạo trang / (landing page) với burger menu
- [x] Section: Hero với CTA
- [x] Section: Tính năng nổi bật
- [x] Section: Cách hoạt động
- [x] Burger menu với links: Trang chủ, Check Đơn Hàng, Đánh Giá, Đăng Nhập
- [x] Responsive mobile

## Phase 15: Fix Login & SMTP

- [x] Sửa form login: đổi field "Email" sang "Tên đăng nhập" (username)
- [x] Cập nhật backend auth: cho phép login bằng username (không cần @email)
- [x] Kiểm tra trang SMTP Settings hiển thị đúng trong sidebar

## Phase 16: Fix Login Bugs

- [x] Thêm toast notification vào Login page
- [x] Fix chuyển hướng sau khi đăng nhập thành công (redirect to /dashboard)

## Phase 17: Fix Sidebar Animation

- [x] Fix sidebar bị giật/flash khi mở/đóng trên mobile - dùng CSS transform thay vì conditional render
- [x] Loại bỏ re-render gây flash trắng khi toggle sidebar

## Phase 18: Template Editors

- [x] Invoice Template Editor: editor trực quan với live preview hóa đơn (màu sắc, font, logo, footer, ngân hàng)
- [x] Invoice Template: chỉnh sửa màu sắc, logo, font, bố cục, header/footer
- [x] Invoice Template: lưu nhiều mẫu, chọn mẫu mặc định
- [x] Email Template Editor: editor HTML cho các mẫu email (CREATED, PAID, SHIPPING, WARRANTY, REVIEW)
- [x] Email Template: live preview email trong iframe browser
- [x] Email Template: lưu template vào DB, load khi gửi email
- [x] Thêm link Mẫu Email vào sidebar admin

## Phase 19: Fix Invoice Template Editor

- [x] Fix lỗi NOT NULL khi tạo mẫu hóa đơn (thêm default value cho companyName)
- [x] Sau khi tạo mẫu, tự động redirect vào editor
- [x] Editor hoạt động với live preview thực tế
