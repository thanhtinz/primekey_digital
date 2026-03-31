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
- [ ] Tạo router invoices (create, read, update, delete, list)
- [ ] Tạo router customers (create, read, update, delete, list)
- [ ] Tạo router products (create, read, update, delete, list)
- [ ] Tạo router invoice_templates (create, read, update, delete, list)
- [ ] Tạo router taxes (create, read, update, delete, list)
- [ ] Tạo router discount_codes (create, read, update, delete, list)
- [ ] Tạo router payment_gateways (get, update, test connection)
- [ ] Tạo router reports (get revenue, get invoice stats, get customer stats, get product stats)
- [ ] Tạo router auth (me, logout)
- [ ] Viết unit tests cho tất cả routers

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
- [ ] Fix responsive design mobile (spacing, padding, font size, layout)

## Phase 4: Frontend - Create Invoice
- [ ] Tạo form tạo hóa đơn
- [ ] Tạo component chọn khách hàng
- [ ] Tạo component thêm sản phẩm/dịch vụ
- [ ] Tạo component tính toán realtime (subtotal, tax, discount, total)
- [ ] Tạo component chọn loại tiền tệ (VND/USD)
- [ ] Tạo component preview hóa đơn
- [ ] Tạo component chọn mẫu hóa đơn
- [ ] Tạo component ghi chú

## Phase 5: Frontend - Invoice Details
- [ ] Tạo trang chi tiết hóa đơn
- [ ] Tạo component hiển thị thông tin hóa đơn
- [ ] Tạo component QR code thanh toán
- [ ] Tạo component countdown hết hạn
- [ ] Tạo component trạng thái thanh toán
- [ ] Tạo nút xuất PDF
- [ ] Tạo nút gửi email
- [ ] Tạo nút chỉnh sửa/hủy

## Phase 6: Frontend - Invoice History, Customers, Products
- [ ] Tạo trang lịch sử hóa đơn với bảng, filter, tìm kiếm
- [ ] Tạo trang quản lý khách hàng với CRUD
- [ ] Tạo trang chi tiết khách hàng (lịch sử giao dịch)
- [ ] Tạo trang quản lý sản phẩm/dịch vụ với CRUD
- [ ] Tạo dialog thêm/sửa khách hàng
- [ ] Tạo dialog thêm/sửa sản phẩm

## Phase 7: Frontend - Templates, Reports, Settings
- [ ] Tạo trang quản lý mẫu hóa đơn
- [ ] Tạo dialog chỉnh sửa mẫu hóa đơn
- [ ] Tạo trang báo cáo & thống kê
- [ ] Tạo các biểu đồ báo cáo (doanh thu, top khách hàng, top sản phẩm)
- [ ] Tạo nút xuất báo cáo (Excel, PDF)
- [ ] Tạo trang cài đặt chung (dark mode, ngôn ngữ, thông báo, email)

## Phase 8: Frontend - Payment Gateway Configuration
- [ ] Tạo trang cấu hình PayOS
- [ ] Tạo form nhập API Key, Client ID, Checksum Key
- [ ] Tạo nút kiểm tra kết nối PayOS
- [ ] Tạo trang cấu hình PayPal
- [ ] Tạo form nhập Client ID, Secret Key
- [ ] Tạo nút kiểm tra kết nối PayPal
- [ ] Tạo component hiển thị trạng thái kết nối

## Phase 9: Backend - Payment Integration
- [ ] Tích hợp PayOS API (tạo payment link, QR code)
- [ ] Tích hợp PayPal API (tạo payment link)
- [ ] Tạo webhook handler cho PayOS
- [ ] Tạo webhook handler cho PayPal
- [ ] Tạo logic cập nhật trạng thái hóa đơn khi thanh toán
- [ ] Tạo logic xử lý thanh toán lặp (idempotent)
- [ ] Tạo logic auto-expire hóa đơn

## Phase 10: Backend - Email, PDF, Dark Mode, Notifications
- [ ] Tạo service gửi email (xác nhận hóa đơn, thanh toán thành công)
- [ ] Tạo service xuất PDF hóa đơn
- [ ] Tạo service xuất báo cáo Excel
- [ ] Tạo notification system (toast)
- [ ] Tạo dark mode toggle
- [ ] Tạo auto-backup dữ liệu
- [ ] Tạo auto-restore dữ liệu

## Phase 11: Testing, Optimization & Deployment
- [ ] Viết unit tests cho tất cả components
- [ ] Viết integration tests cho payment flow
- [ ] Kiểm tra responsive design (mobile, tablet, desktop)
- [ ] Kiểm tra accessibility (keyboard navigation, screen reader)
- [ ] Tối ưu hóa performance (lazy loading, code splitting)
- [ ] Tối ưu hóa SEO
- [ ] Kiểm tra security (XSS, CSRF, SQL injection)
- [ ] Kiểm tra error handling
- [ ] Tạo checkpoint trước khi deploy
- [ ] Deploy website

## Phase 12: Delivery
- [ ] Kiểm tra tất cả tính năng hoạt động đúng
- [ ] Viết hướng dẫn sử dụng
- [ ] Bàn giao cho người dùng
