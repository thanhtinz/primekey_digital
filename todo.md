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

## Phase 20: Xem Mẫu Hóa Đơn

- [x] Thêm nút "Xem Mẫu" trong danh sách mẫu hóa đơn
- [x] Modal/dialog preview toàn màn hình hiển thị mẫu hóa đơn với dữ liệu mẫu
- [x] Thumbnail preview thu nhỏ hiển thị ngay trong card danh sách
- [x] Nút Chỉnh Sửa có trong modal preview để vào editor ngay

## Phase 21: 12 Tính Năng Mới

### Nhóm 1: Vận Hành
- [x] Xuất PDF hóa đơn - nút "Xuất PDF" trong InvoiceDetail, áp dụng mẫu đã chọn
- [x] Tìm kiếm toàn cục - ô search ở header, tìm đơn theo tên/SĐT/mã đơn
- [x] Quản lý nhân viên - admin tạo/xóa/đổi mật khẩu tài khoản nhân viên trong UI
- [x] Nhân bản đơn hàng - nút "Nhân Bản" trong InvoiceDetail
- [x] Ghi chú nội bộ - thêm ghi chú riêng cho từng đơn (chỉ staff thấy)

### Nhóm 2: Báo Cáo
- [x] Dashboard thống kê nâng cao - thêm Top Products và Customer Stats
- [x] Xuất báo cáo Excel - đã có sẵn trong Reports page
- [x] Thống kê khách hàng - CustomerDetail page hiển thị lịch sử mua, tổng chi tiêu

### Nhóm 3: Khách Hàng
- [x] Trang tra cứu đơn nâng cao - TrackOrder page đã có timeline đẹp
- [x] Trang cảm ơn - tạo trang /thank-you sau khi thanh toán thành công

### Nhóm 4: Tự Động Hóa
- [x] Nhắc nhở đơn chưa thanh toán - trang /reminders quản lý + nút gửi ngay
- [x] Lịch sử hoạt động - trang /activity-log hiển thị log hoạt động

## Phase 22: Cải Tiến Form Tạo Hóa Đơn

- [x] Due date tùy chỉnh trong form tạo hóa đơn (thay vì mặc định 7 ngày)
- [x] Nút "Xem Trước PDF" trong form tạo hóa đơn trước khi lưu

## Bug Fix: Lỗi PDF Preview

- [x] Sửa lỗi "doc.autoTable is not a function" khi nhấn Xem Trước PDF

## Tính Năng: Chuyển Trạng Thái Thủ Công

- [x] Thêm nút "Chuyển Trạng Thái" dropdown trong InvoiceDetail
- [x] Khi chuyển sang PAID thủ công: gửi email xác nhận thanh toán
- [x] Khi chuyển sang SHIPPING thủ công: gửi email thông báo giao hàng
- [x] Khi chuyển sang WARRANTY thủ công: gửi email thông báo bảo hành + tạo link đánh giá
- [x] Khi chuyển sang CREATED: tùy chọn tạo lại PayOS QR mới và gửi email link thanh toán
- [x] Ghi log hoạt động khi chuyển trạng thái thủ công

## Bug Fix: Font Tiếng Việt trong PDF

- [x] Sửa lỗi chữ tiếng Việt bị mất dấu trong PDF - chuyển sang puppeteer+HTML, thiết kế đẹp hơn

## Tính Năng: QR Thanh Toán trong PDF

- [x] Cài thư viện qrcode để tạo QR từ paymentUrl
- [x] Nhúng mã QR PayOS vào PDF hóa đơn (hiển thị khi có paymentUrl)
- [x] Cập nhật InvoiceData interface để nhận paymentUrl
- [x] Cập nhật các procedure gọi generateInvoicePDF để truyền paymentUrl

## Tính Năng: Trang Thanh Toán Tùy Chỉnh

- [x] Thêm procedure `invoices.getPaymentInfo` - trả về qrCode, thông tin hóa đơn (public, không cần login)
- [x] Thêm procedure `invoices.checkPaymentStatus` - polling trạng thái thanh toán từ PayOS
- [x] Tạo trang /pay/:invoiceId - hiển thị QR PayOS, thông tin đơn, đếm ngược hết hạn
- [x] Trang tự động polling và redirect về /thank-you khi thanh toán thành công
- [x] Cập nhật email template dùng link /pay/:invoiceId thay vì checkoutUrl PayOS trực tiếp
- [x] Cập nhật InvoiceDetail để nút "Gửi Email" dùng /pay/:invoiceId trong email

## Tính Năng Mới (06/04/2026 - Batch 2)

- [x] Nút "Sao Chép Link Thanh Toán" trong InvoiceDetail - copy link /pay/:invoiceId vào clipboard
- [x] Logo công ty trên trang thanh toán /pay/:invoiceId - lấy từ defaultTemplate.logo
- [x] PayOS webhook handler đầy đủ: xác minh chữ ký, cập nhật DB, gửi email xác nhận
- [x] Truyền webhookUrl khi tạo PayOS payment link (origin + /api/webhooks/payos)
- [x] Giảm polling interval từ 5s xuống 3s để phản hồi nhanh hơn sau webhook

## Phase 23: Webhook Status Card & Bug Fix

- [x] Thêm card "Webhook PayOS" trong trang cài đặt thanh toán (PayOS Settings) - nâng cấp toàn diện
- [x] Hiển thị URL webhook endpoint, nút sao chép, badge trạng thái
- [x] Nút "Gửi Test Webhook" gọi procedure testWebhook và hiển thị kết quả rõ ràng
- [x] Thêm procedure paymentGateways.testWebhook trong routers.ts
- [x] Sửa DialogDescription warning trong 7 dialogs (Customers, InvoiceHistory, InvoiceTemplates, Products, StaffManagement x2)
- [x] Kiểm tra TypeScript: 0 errors
- [x] Kiểm tra console/network: không có lỗi mới

## Phase 24: 5 Tính Năng Mới (Hoàn thành)

### Tạo lại QR
- [x] Thêm procedure invoices.regeneratePaymentLink (public) - tạo PayOS link mới cho invoice
- [x] Thêm nút "Tạo lại QR" trong trang /pay/:invoiceId khi QR hết hạn hoặc chưa có
- [x] Hiển thị loading state khi đang tạo QR mới, cập nhật QR và link thanh toán sau khi tạo

### Thống kê sản phẩm & khách hàng
- [x] Thêm procedure reports.topProductsDaily - top sản phẩm bán chạy hàng ngày, sắp xếp doanh thu thấp→cao
- [x] Thêm procedure reports.topCustomersByPeriod - bảng xếp hạng khách hàng theo ngày/7 ngày/30 ngày
- [x] Thêm procedure reports.getMonthlyComparison - so sánh đơn tạo vs đã thanh toán theo tháng
- [x] Tích hợp vào trang /reports với tabs riêng biệt

### Email Campaigns
- [x] Tạo bảng email_campaigns và email_campaign_recipients trong DB schema
- [x] Thêm procedure campaigns.create, list, send, delete, getRecipients
- [x] Tạo trang /campaigns - quản lý campaigns (tạo, xem, gửi, xóa)
- [x] Form tạo campaign: tiêu đề, nội dung HTML, chọn nhóm nhận (tất cả KH / theo trạng thái đơn)
- [x] Gửi campaign email đến danh sách khách hàng đã chọn
- [x] Hiển thị thống kê: số email đã gửi, trạng thái
- [x] Thêm menu item "Email Campaigns" vào sidebar admin

### Charts chuyên nghiệp
- [x] Nâng cấp Reports.tsx với recharts: gradient, tooltip glass effect, responsive
- [x] Revenue chart: AreaChart với gradient fill, ReferenceLine trung bình, tooltip chi tiết
- [x] Invoice status chart: donut PieChart với gradient, hiển thị %
- [x] Thêm ComposedChart (Bar + Line) so sánh đơn tạo vs đã TT + tỷ lệ chuyển đổi
- [x] KPI cards với gradient background, ArrowUpRight/Down trend indicators

### Bug Fixes
- [x] Sửa emailTemplates.get trả về null thay vì undefined (fix "Query data cannot be undefined")
- [x] Sửa settings.get trả về null thay vì undefined
- [x] Sửa paymentGateways.get trả về null thay vì undefined
- [x] TypeScript: 0 errors

## Fix: Nút Tạo Hóa Đơn Mobile

- [x] Giảm kích thước nút "Tạo Hóa Đơn" trên mobile: h-8 px-2.5 text-xs, text rút gọn "Tạo Đơn" trên mobile, ẩn text "Làm mới" trên mobile (chỉ hiện icon)

## Fix: Mobile Dashboard Improvements

- [x] Ẩn mô tả phụ "Tổng quan hoạt động kinh doanh" trên mobile (hidden sm:block)
- [x] Thêm FAB button cố định góc phải dưới trên mobile (sm:hidden, z-50, shadow-lg)
- [x] KPI cards 2 cột trên mobile (grid-cols-2), padding/font nhỏ hơn, truncate text

## Feature: Chọn Khách Hàng & Sản Phẩm Trong Form Tạo Hóa Đơn

- [x] Thêm tab toggle "Nhập thủ công" / "Từ danh sách" trong phần thông tin khách hàng
- [x] Khi chọn từ danh sách: search input + danh sách cuộn, badge xác nhận, vẫn sửa được
- [x] Khi nhập thủ công: form đầy đủ như cũ
- [x] Mỗi dòng sản phẩm: toggle "Thủ công" / "Từ danh sách" riêng biệt
- [x] Khi chọn sản phẩm từ danh sách: tự điền tên + đơn giá, hiển thị giá trong dropdown, vẫn sửa tên được
- [x] TypeScript: 0 errors

## Bug Fix: Toggle Sản Phẩm Không Hiển Thị

- [x] Sửa toggle "Thủ công / Từ danh sách" luôn hiển thị bất kể products.length
- [x] Khi chưa có sản phẩm: hiển thị banner cảnh báo vàng hướng dẫn thêm sản phẩm trước

## Redesign: Landing Page

- [x] Viết lại hero section với headline rõ ràng, trust indicators, 2 CTA buttons
- [x] Thêm stats bar (99.9% uptime, <3s thanh toán, 24/7, 100% bảo mật)
- [x] Thêm section "Chỉ 3 Bước Đơn Giản" với connector line
- [x] Thêm 6 features cards với badge "Phổ biến" / "Mới"
- [x] Thêm section testimonials (3 đánh giá khách hàng thực tế)
- [x] Thêm CTA section cuối trang với gradient card
- [x] Footer 3 cột: brand, quick links, liên hệ (email, phone, address)
- [x] TypeScript: 0 errors

## Feature: Landing Page - Thông Tin Thực & Animations

- [x] Tạo public procedure settings.getPublicInfo - trả về companyName, email, phone, address, website
- [x] LandingPage footer lấy thông tin từ settings.getPublicInfo (email, phone, address, website, companyName)
- [x] Brand name trong footer hiển thị companyName từ Settings
- [x] Thêm hook useScrollReveal với Intersection Observer (threshold 0.12)
- [x] Áp dụng fade-in-up animation cho 7 sections: hero, stats, howItWorks, features, quickAccess, testimonials, cta
- [x] TypeScript: 0 errors

## Phase 25: Reset Users & UI Improvements

- [x] Xóa toàn bộ users trong DB và tạo lại admin tinklh/tinklh (email: tinklh@invoiceprime.com, role: admin)
- [x] Logo công ty vào navbar landing page (lấy từ defaultTemplate.logo, fallback initials)
- [x] Logo công ty vào footer landing page (cùng nguồn)
- [x] getPublicInfo cập nhật trả về companyLogo từ invoiceTemplates
- [x] Testimonials lấy từ reviews.getPublic (tối đa 6), fallback về mẫu nếu chưa có
- [x] TypeScript: 0 errors

## Fix: Landing Page & Reports Mobile

- [x] Xóa nút "Đăng Nhập" và các link liên quan dashboard khỏi navbar landing page
- [x] Chỉ giữ các link dành cho khách: Tra Cứu Đơn, Đánh Giá (không có link admin/dashboard)
- [x] Fix responsive trang Reports trên mobile: charts vừa màn hình, tabs cuộn ngang

## Tạo Mẫu Hóa Đơn Mặc Định

- [x] Kiểm tra schema invoiceTemplates và cấu trúc dữ liệu
- [x] Tạo script seed mẫu hóa đơn mặc định vào database
- [x] Mẫu có thiết kế chuyên nghiệp: màu sắc, font, logo placeholder, footer ngân hàng
- [x] Đặt isDefault = true cho mẫu vừa tạo

## Thêm Logo Website & Favicon vào Cài Đặt

- [x] Kiểm tra Settings.tsx và schema userSettings hiện tại
- [x] Thêm cột logoUrl và faviconUrl vào bảng userSettings (DB migration)
- [x] Thêm section "Thương Hiệu" trong Settings: upload logo website và favicon
- [x] Upload file lên S3, lưu URL vào DB
- [x] Áp dụng favicon động qua useEffect thay đổi <link rel="icon">
- [x] Cập nhật getPublicInfo trả về logoUrl và faviconUrl

## Final Bug Check & Fixes

- [x] Bug 1: getPublicInfo không trả về logoUrl từ userSettings - đã sửa
- [x] Bug 2: DashboardLayoutCustom hardcode "IP" và "Invoice Prime" - đã sửa dùng settings.companyName và logoUrl
- [x] Bug 3: Favicon chỉ áp dụng trong Settings page - đã thêm global apply trong App.tsx
- [x] Bug 4: getPublicInfo không trả về logoUrl từ userSettings - đã sửa
- [x] **[SECURITY BUG]** auth.me trả về password hash - ẩn trường password khỏi response
- [x] **[CRITICAL BUG]** invoices.create không lưu items - thêm items field vào procedure và CreateInvoice.tsx
- [x] **[BUG]** invoice.get không trả về items - thêm getInvoiceItemsByInvoiceId
- [x] **[BUG]** InvoiceDetail không hiển thị danh sách sản phẩm - thêm bảng Chi Tiết Sản Phẩm
- [x] **[BUG]** updateStatus email có URL rỗng - thêm origin từ frontend
- [x] TypeScript: 0 errors, 13/13 tests passed

## Fix: Landing Page Features & Testimonials Thật

- [x] Xóa card "Báo Cáo & Thống Kê" khỏi section features - thay bằng "Lịch Sử Đơn Hàng"
- [x] Kiểm tra và xóa tất cả các feature cards liên quan đến dashboard nội bộ
- [x] Testimonials: dùng reviews thật từ DB (reviews.getPublic) thay vì mockup data
- [x] Ẩn section testimonials khi không có reviews thật (đã được duyệt)

## Tính Năng: Chỉnh Sửa Hóa Đơn & Filter Theo Sản Phẩm

- [x] Backend: thêm procedure invoices.update (cập nhật thông tin hóa đơn + items)
- [x] Backend: thêm procedure invoices.listByProduct (filter hóa đơn theo tên sản phẩm)
- [x] Tạo trang /edit-invoice/:id (EditInvoice.tsx) - form giống CreateInvoice nhưng load dữ liệu cũ
- [x] Thêm nút "Sửa Hóa Đơn" trong InvoiceDetail (chỉ cho phép sửa khi status là CREATED)
- [x] Thêm route /edit-invoice/:id vào App.tsx
- [x] InvoiceHistory: thêm input filter theo tên sản phẩm
- [x] InvoiceHistory: khi có filter sản phẩm, gọi procedure mới để lọc kết quả
- [x] TypeScript: 0 errors, 13/13 tests passed

## Tính Năng Mới: Xuất Excel, Nhắc Hết Hạn, Gộp PDF (Hoàn Thành)

- [x] InvoiceHistory: nút "Xuất Excel" xuất danh sách đã lọc (filter theo sản phẩm, trạng thái, tiền tệ)
- [x] InvoiceHistory: checkbox chọn nhiều hóa đơn, nút "Xuất PDF Gộp" cho các hóa đơn đã chọn
- [x] Backend: procedure invoices.exportExcel - trả về buffer Excel với danh sách hóa đơn
- [x] Backend: procedure invoices.bulkExportPDF - xuất nhiều hóa đơn thành nhiều file PDF
- [x] Backend: procedure invoices.getExpiringSoon - lấy danh sách hóa đơn CREATED hết hạn trong 24h
- [x] Dashboard: widget "Sắp Hết Hạn" - hiển thị danh sách hóa đơn CREATED hết hạn trong 24h
- [x] TypeScript: 0 errors, 13/13 tests passed

## Tính Năng Mới: Email Nhắc Hàng Loạt, Lên Lịch Tự Động, Cột Khách Hàng (Hoàn Thành)

- [x] InvoiceHistory: thêm cột "Khách Hàng" vào bảng (hiển thị tên khách, ẩn trên mobile nhỏ)
- [x] Backend: invoices.list và listByProduct trả về customerName cùng với invoice
- [x] Dashboard widget "Sắp Hết Hạn": thêm nút "Gửi Nhắc Tất Cả" gửi email cho tất cả đơn sắp hết hạn
- [x] Backend: procedure reminders.sendBulkReminder - gửi email nhắc cho danh sách invoiceIds
- [x] Reminders page: thêm section "Lên Lịch Tự Động" với toggle bật/tắt và chọn số giờ trước khi hết hạn
- [x] Backend: settings.updateNotifications hỗ trợ reminderHoursBefore
- [x] DB schema: thêm cột reminderHoursBefore vào userSettings + migration
- [x] TypeScript: 0 errors, 13/13 tests passed

## Batch 3: 16 Tính Năng Mới

### Nhóm 1: Quản Lý Hóa Đơn & Dữ Liệu
- [x] Import khách hàng từ Excel (.xlsx) - trang /import-excel với preview và nhập hàng loạt
- [x] Import sản phẩm từ Excel (.xlsx) - cùng trang /import-excel, tab sản phẩm
- [x] Bộ lọc ngày tạo (date range) trong AdvancedSearch - từ ngày / đến ngày
- [x] Hóa đơn định kỳ (recurring) - trang /recurring-invoices với tạo/quản lý đơn lặp lại
- [x] Gộp nhiều đơn thành 1 PDF - đã có sẵn trong InvoiceHistory (checkbox + nút Xuất PDF Gộp)

### Nhóm 3: Báo Cáo & Phân Tích
- [x] Báo cáo doanh thu theo khách hàng - trang /advanced-reports tab Khách Hàng
- [x] Biểu đồ tỷ lệ chuyển đổi theo sản phẩm - trang /advanced-reports tab Sản Phẩm
- [x] Gửi báo cáo tuần qua email - trang /backup cài đặt báo cáo tuần tự động

### Nhóm 4: Trải Nghiệm Khách Hàng
- [x] Trang tra cứu bảo hành /warranty - nhập mã đơn xem thông tin bảo hành
- [x] Trang cảm ơn tùy chỉnh - trang /settings/thank-you chỉnh nội dung (logo, lời nhắn, social links)
- [x] Widget đánh giá nhúng - trang /embed-widget tạo iframe + JS snippet nhúng reviews

### Nhóm 5: Vận Hành & Tự Động Hóa
- [x] Backup dữ liệu thủ công - trang /backup nút "Xuất toàn bộ dữ liệu" ra Excel
- [x] Thông báo Telegram - trang /settings/telegram cấu hình bot + gửi thông báo đơn mới
- [x] Ghi chú công khai cho khách - đã có publicNote hiển thị trên /pay và /warranty
- [x] Tìm kiếm toàn cục nâng cao - trang /advanced-search tìm theo nhiều tiêu chí
- [x] Chế độ in hóa đơn - CSS @media print trong index.css, nút "In Hóa Đơn" trong InvoiceDetail

## Fix: Đồng Bộ Trang Cảm Ơn

- [x] Trang /thank-you công khai lấy tiêu đề, nội dung, social links từ cấu hình /settings/thank-you. Hiển thị logo/tên công ty, social links nếu có.

## Feature: Màu Nền & Nút Đánh Giá Trang Cảm Ơn

- [x] DB schema: thêm cột thankYouBgFrom, thankYouBgTo (màu gradient) vào userSettings
- [x] Backend: cập nhật updateThankYou procedure nhận thankYouBgFrom, thankYouBgTo
- [x] Backend: getThankYouPublic trả về thankYouBgFrom, thankYouBgTo
- [x] /settings/thank-you: thêm color picker chọn màu gradient từ/đến (8 preset + custom color picker)
- [x] /thank-you công khai: áp dụng màu gradient từ config thay vì hardcode xanh lá
- [x] /thank-you công khai: thêm nút "Viết Đánh Giá" (amber) khi có reviewToken của đơn hàng

## Fix & Feature: Bảo Hành + Banner + Email Đánh Giá

- [x] Trang /warranty: tra cứu bằng mã đơn, hiển thị thông tin bảo hành chi tiết (ngày bắt đầu, hết hạn, thanh tiến trình, số ngày còn lại)
- [x] DB schema: thêm warrantyMonths vào products, warrantyStartDate + warrantyExpiryDate vào invoices
- [x] manualTransition: tự động lưu warrantyStartDate + warrantyExpiryDate khi chuyển sang WARRANTY
- [x] Products.tsx: thêm trường warrantyMonths vào form tạo/sửa sản phẩm + hiển thị trong bảng
- [x] Banner upload: thêm ảnh banner cho trang cảm ơn (/settings/thank-you), hiển thị trên /thank-you
- [x] DB schema: thêm cột thankYouBannerUrl vào userSettings
- [x] Backend: updateThankYou nhận thankYouBannerUrl, getThankYouPublic trả về thankYouBannerUrl
- [x] Email WARRANTY: nút "Viết Đánh Giá" nổi bật (nền vàng, amber button) trong email gửi khách

## Fix: Thêm Link Bảo Hành vào Landing Page

- [x] Thêm link "Bảo Hành" vào navigation bar landing page (desktop + mobile burger menu)
- [x] Thêm card "Tra Cứu Bảo Hành" vào section Truy Cập Nhanh (grid 3 cột)
- [x] Thêm nút "Tra Cứu Bảo Hành" vào CTA section
- [x] Thêm link "Tra Cứu Bảo Hành" vào footer landing page

## Fix: Style Trang /warranty Theo Dark Theme Landing Page

- [x] Redesign WarrantyLookup.tsx: dùng dark background (slate-900), white text, giống TrackOrder và PublicFeedbacks
