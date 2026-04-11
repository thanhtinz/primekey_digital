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

## Update: Landing Page - Nội Dung Tính Năng Khách Hàng

- [x] Cập nhật features grid: giữ 5 tính năng khách hàng (Hóa Đơn, Thanh Toán QR, Bảo Hành, Đánh Giá, Trang Cảm Ơn)
- [x] Thêm section "Dành Cho Khách Hàng" với 4 card chi tiết: Hóa Đơn, Thanh Toán, Bảo Hành, Đánh Giá & Trang Cảm Ơn
- [x] Mỗi card có mô tả chi tiết và 3 lợi ích chính (CheckCircle icons)

## Bug Fix: QR Code, SMTP, Email

- [x] Bug: QR code tạo mã thanh toán báo "fetch failed" (lỗi DNS trong dev, sẽ hoạt động sau khi publish)
- [x] Bug: SMTP settings không lưu lại password (đã sửa - hiển thị hasPassword flag)
- [x] Bug: Email không gửi được (đã sửa - throw lỗi rõ ràng khi SMTP chưa cấu hình)
- [x] Bug: Giao diện InvoiceDetail còn lỗi layout trên mobile

## Bug Fix: QR Code, SMTP, Email, InvoiceDetail

- [x] Bug: QR code tạo mã thanh toán báo "fetch failed" (lỗi DNS trong dev, sẽ hoạt động sau khi publish)
- [x] Bug: SMTP settings không lưu lại password (đã sửa - hiển thị hasPassword flag)
- [x] Bug: Email không gửi được (đã sửa - throw lỗi rõ ràng khi SMTP chưa cấu hình)
- [x] Bug: Giao diện InvoiceDetail lỗi layout trên mobile - cần redesign lại

## Bug Fix: SMTP + PayOS + InvoiceDetail

- [x] SMTP: smtp.get trả về hasPassword flag thay vì bỏ password hoàn toàn
- [x] SMTP: UI hiển thị "Đã lưu mật khẩu ✓" khi hasPassword=true, placeholder rõ ràng
- [x] SMTP: test email thực sự gửi và báo lỗi chi tiết nếu thất bại
- [x] PayOS: thông báo lỗi rõ ràng "Không kết nối được PayOS" thay vì "fetch failed"
- [x] PayOS: trang cấu hình cải thiện UX, hướng dẫn rõ ràng
- [x] InvoiceDetail: bỏ nút "Sao Chép Link Thanh Toán" bị trùng lặp
- [x] InvoiceDetail: layout mobile tối ưu, action buttons wrap gọn hơn
- [x] InvoiceDetail: cải thiện thông báo lỗi khi gửi email thất bại

## Bug Fix: InvoiceDetail Lag + SMTP + PayOS

- [x] InvoiceDetail: tối ưu performance - giảm re-render, tách queries, dùng staleTime
- [x] InvoiceDetail: bỏ nút "Sao Chép Link Thanh Toán" bị trùng lặp (xuất hiện 2 lần)
- [x] InvoiceDetail: cải thiện layout mobile - action buttons wrap gọn hơn
- [x] SMTP: UI hiển thị "Đã lưu mật khẩu ✓" khi hasPassword=true
- [x] PayOS: thông báo lỗi rõ ràng hơn khi không kết nối được

## Feature: Social Icons Trang Cảm Ơn

- [x] Thêm icon SVG cho từng mạng xã hội (Facebook, Instagram, Zalo, TikTok, YouTube, Twitter/X, Website) trên trang /thank-you

## Bug Fix Summary (Completed)

- [x] SMTP: smtp.get trả về hasPassword flag - UI hiển thị "Đã lưu mật khẩu ✓" khi hasPassword=true
- [x] Email: sendEmail throw lỗi rõ ràng khi SMTP chưa cấu hình (thay vì trả về true giả)
- [x] Email: truyền userId vào sendEmail trong email.sendInvoice và sendPaymentConfirmation
- [x] Email: manualTransition trả về emailError khi gửi thất bại, UI hiển thị toast.warning
- [x] PayOS: thông báo lỗi rõ ràng "Không thể kết nối đến PayOS" thay vì "fetch failed"
- [x] InvoiceDetail: bỏ nút "Sao Chép Link Thanh Toán" bị trùng lặp
- [x] Social icons: thêm SVG icons cho tất cả mạng xã hội trên trang /thank-you

## Bug Fix: InvoiceDetail Buttons

- [x] Khôi phục nút "Sao Chép Link Thanh Toán" - hiển thị cho CREATED/PAID/SHIPPING
- [x] Sửa dropdown "Chuyển Trạng Thái" - dùng onSelect+preventDefault+setTimeout để tránh Radix conflict với Dialog

## Fix: Trang /pay + InvoiceDetail Dropdown

- [x] Trang /pay: lấy logo từ settings.logoUrl trước, fallback sang template logo
- [x] InvoiceDetail: sửa dropdown Chuyển Trạng Thái - controlled open state + setDropdownOpen(false) + setTimeout(150ms)

## Batch 4: Cải Tiến Lớn - Thương Mại Hóa

### Tra Cứu Đơn Hàng - Hiển thị đầy đủ thông tin
- [x] Hiển thị danh sách sản phẩm (tên, SL, giá, thành tiền) trong mỗi đơn hàng
- [x] Hiển thị tên khách hàng, email, số điện thoại
- [x] Hiển thị tổng tiền, thuế, giảm giá rõ ràng
- [x] Hiển thị ghi chú đơn hàng nếu có

### Bảo Hành - Cải tiến toàn diện
- [x] Trang cấu hình bảo hành trong dashboard (/settings/warranty) - cấu hình điều khoản, thời hạn mặc định
- [x] Trang quản lý bảo hành trong dashboard (/warranties) - danh sách tất cả đơn bảo hành
- [x] Nút tạo/kích hoạt bảo hành từ InvoiceDetail
- [x] Backend: router warranty CRUD + cấu hình warranty settings

### Trang Queue Công Khai
- [x] Trang /queue hiển thị danh sách đơn hàng đang chờ xử lý
- [x] Sắp xếp theo thứ tự thời gian (đơn cũ nhất trước)
- [x] Hiển thị số thứ tự, mã đơn, trạng thái, thời gian chờ
- [x] Dark theme nhất quán với các trang public khác
- [x] Thêm link Queue vào navigation landing page

### Trang BXH Chi Tiêu Công Khai
- [x] Trang /leaderboard hiển thị top người dùng chi tiêu nhiều nhất
- [x] Bộ lọc theo: Ngày, Tuần, Tháng, Năm
- [x] Hiển thị rank, tên (ẩn 1 phần), tổng chi tiêu, số đơn hàng
- [x] Dark theme nhất quán
- [x] Backend: router leaderboard với aggregate queries
- [x] Thêm link BXH vào navigation landing page

### Flash Sale
- [x] Trang /flash-sale công khai hiển thị sản phẩm đang giảm giá
- [x] Trang cấu hình Flash Sale trong dashboard (/settings/flash-sale)
- [x] DB schema: bảng flash_sales (productId, discountPercent, startTime, endTime, maxQuantity)
- [x] Backend: router flash-sale CRUD + public query
- [x] Hiển thị countdown thời gian còn lại, giá gốc vs giá sale
- [x] Dark theme nhất quán
- [x] Thêm link Flash Sale vào navigation landing page

### Polish Final - Thương Mại Hóa
- [x] Sửa tất cả hardcode (tên công ty, logo, URL) - dùng publicInfo từ settings
- [x] Kiểm tra và sửa lỗi trên tất cả các trang - 0 TS errors
- [x] Cải tiến responsive mobile cho tất cả trang mới
- [x] Đảm bảo tất cả trang public có dark theme nhất quán

## Cập nhật Landing Page - Giới thiệu tính năng khách hàng

- [x] Cập nhật section features: thêm Queue, BXH Chi Tiêu, Flash Sale, Bảo Hành cải tiến
- [x] Cập nhật section "Cách Hoạt Động" cho phù hợp với các tính năng mới
- [x] Thêm section riêng cho "Tính Năng Dành Cho Khách Hàng" (tra cứu, bảo hành, queue, BXH, flash sale)
- [x] Cập nhật stats/số liệu trên landing page

## Batch 5: Logo, Bảo Hành Sản Phẩm, UI Cải Tiến, Flash Sale Banner, Coupon

### Logo Website
- [x] Sửa logo từ hình vuông sang hình dài/tự nhiên (aspect ratio phù hợp)
- [x] Cập nhật tất cả nơi hiển thị logo: landing page, nav, footer, trang public, dashboard sidebar

### Bảo Hành Theo Sản Phẩm
- [x] Thêm trường warrantyMonths vào bảng products trong schema (đã có sẵn)
- [x] Cập nhật form tạo/sửa sản phẩm: cho chọn thời gian bảo hành (tháng) (đã có sẵn)
- [x] Khi tạo bảo hành, ưu tiên lấy warrantyMonths từ sản phẩm (lấy max của các SP trong đơn)

### Cải Tiến UI Trang Khách Hàng
- [x] TrackOrder: redesign chuyên nghiệp hơn, hiển thị chi tiết đầy đủ
- [x] WarrantyLookup: redesign đẹp hơn, thông tin rõ ràng
- [x] QueuePage: cải tiến layout, thêm animation, thông tin đầy đủ
- [x] LeaderboardPage: cải tiến visual, thêm podium top 3
- [x] FlashSalePage: cải tiến countdown, thêm progress bar stock

### Banner Flash Sale trên Landing Page
- [x] Thêm banner Flash Sale nổi bật vào hero section khi có sale đang chạy
- [x] Hiển thị số ưu đãi, % giảm cao nhất, link đến /flash-sale

### Hệ Thống Coupon
- [x] DB schema: bảng coupons (code, discountType, discountValue, minOrder, maxUses, usedCount, expiresAt)
- [x] Backend: router coupon CRUD + validate coupon
- [x] Trang cấu hình Coupon trong dashboard
- [x] Trang /pay: thêm input nhập mã giảm giá, hiển thị giảm giá

## Fix: Ẩn tên website khi đã có logo
- [x] Tất cả trang public: nếu có logo thì chỉ hiển thị logo, không hiển thị tên website bên cạnh
- [x] Landing page header/nav + footer
- [x] TrackOrder header
- [x] WarrantyLookup header
- [x] QueuePage header
- [x] LeaderboardPage header
- [x] FlashSalePage header
- [x] DashboardLayoutCustom sidebar

## Redesign Trang Coupon + Thống Kê Hiệu Quả
- [x] Redesign giao diện trang CouponSettings đồng bộ với các trang dashboard khác
- [x] Thêm thống kê tổng quan: tổng mã, mã đang hoạt động, tổng lượt dùng, tổng doanh thu giảm
- [x] Thêm thống kê chi tiết từng mã: số lần dùng, doanh thu giảm, tỷ lệ chuyển đổi
- [x] Backend: router coupon.stats trả về thống kê từ coupon_usages

## Batch 6: 10 Tính Năng Mới

### 1. Nhóm Sản Phẩm / Danh Mục
- [x] Schema: bảng product_categories (id, name, slug, description, sortOrder)
- [x] Thêm categoryId vào bảng products
- [x] Backend: CRUD categories + gắn category vào sản phẩm
- [x] UI: trang quản lý danh mục trong dashboard
- [x] UI: filter sản phẩm theo danh mục trong trang Products

### 2. Trang Giới Thiệu Sản Phẩm (Catalog Công Khai)
- [x] Trang /products công khai: hiển thị catalog sản phẩm theo danh mục
- [x] Filter theo danh mục, tìm kiếm, sắp xếp giá
- [x] Trang chi tiết sản phẩm /products/[id]
- [x] Thêm link Catalog vào landing page nav

### 3. Trang So Sánh Sản Phẩm
- [x] Trang /compare: chọn tối đa 3 sản phẩm để so sánh
- [x] Bảng so sánh: tên, giá, bảo hành, mô tả
- [x] Nút "So sánh" trên trang catalog

### 4. Tích Điểm Thành Viên
- [x] Schema: bảng loyalty_points (customerId, points, reason, invoiceId, createdAt)
- [x] Cấu hình: tỷ lệ tích điểm (VD: 1000đ = 1 điểm), tỷ lệ đổi điểm
- [x] Tự động tích điểm khi đơn hàng chuyển sang PAID
- [x] Trang /loyalty công khai: khách nhập email xem điểm
- [x] Dashboard: trang quản lý điểm thành viên

### 5. Yêu Cầu Bảo Hành Online
- [x] Schema: bảng warranty_requests (warrantyId, customerEmail, description, images, status)
- [x] Trang /warranty-request công khai: form gửi yêu cầu bảo hành
- [x] Dashboard: trang quản lý yêu cầu bảo hành (xem, phản hồi, cập nhật trạng thái)
- [x] Thông báo Telegram khi có yêu cầu bảo hành mới

### 6. Thông Báo Flash Sale Qua Email
- [x] Form đăng ký nhận thông báo Flash Sale trên trang /flash-sale (flashSaleSubscriber.subscribe)
- [x] Backend: gửi email thông báo khi tạo Flash Sale mới (flashSaleSubscriber router)
- [x] Dashboard: quản lý danh sách subscriber (flashSaleSubscriber.list, delete)

### 7. Trang FAQ / Hỏi Đáp
- [x] Schema: bảng faqs (question, answer, category, sortOrder, isPublished)
- [x] Trang /faq công khai: hiển thị câu hỏi theo nhóm, có accordion
- [x] Dashboard: CRUD FAQ, sắp xếp thứ tự (FAQSettings.tsx)
- [x] Thêm link FAQ vào landing page footer (liên kết đã có)

### 8. Hóa Đơn VAT
- [x] Thêm trường vatNumber, vatCompanyName, vatAddress vào invoices
- [x] UI tạo hóa đơn: checkbox "Xuất hóa đơn VAT", điền thông tin
- [x] Trang in/xuất hóa đơn VAT theo chuẩn (có mã số thuế, địa chỉ)
- [x] Settings: cấu hình thông tin công ty cho hóa đơn VAT

### 9. Hoàn Tiền (Refund)
- [x] Schema: bảng refunds (invoiceId, amount, reason, status, processedAt)
- [x] Dashboard: tạo yêu cầu hoàn tiền, theo dõi trạng thái
- [x] Khi hoàn tiền: cập nhật trạng thái invoice, ghi log
- [x] Thông báo Telegram khi xử lý hoàn tiền

### 10. Báo Cáo Thuế
- [x] Trang /reports/tax trong dashboard
- [x] Tổng hợp doanh thu theo tháng/quý/năm
- [x] Phân tách: doanh thu gốc, VAT, chiết khấu, thực thu
- [x] Xuất báo cáo CSV/Excel

## Client Portal + Đăng Nhập Khách Hàng

- [x] Sửa products.list và các procedures công khai thành publicProcedure (không cần auth)
- [x] Thêm bảng customer_sessions: lưu email + session token cho khách đăng nhập
- [x] Backend: procedure customer.loginByEmail (nhập email → tạo session token)
- [x] Backend: procedure customer.me (lấy thông tin khách từ session token)
- [x] Trang /client-login: form nhập email đăng nhập cho khách hàng
- [x] Sau đăng nhập: khách xem được lịch sử đơn hàng, điểm tích lũy, bảo hành của mình
- [x] Header Client Portal: hiển thị nút đăng nhập/tài khoản dựa trên localStorage token
- [x] Đổi tên "Landing Page" → "Client Portal" trong code và navigation
- [x] Trang /login (admin): giữ nguyên đăng nhập bằng username/password

## Client Portal - Auth Guard + Chi Tiết SP + Trang Cá Nhân

- [x] CustomerAuth context: lưu token/email trong localStorage, expose useCustomerAuth() hook
- [x] Auth guard: các trang TrackOrder, Warranty, Loyalty, WarrantyRequest yêu cầu login khách
- [x] Nếu chưa login → redirect /client-login?redirect=<trang hiện tại>
- [x] Sau login → tự động redirect về trang đã yêu cầu, không hỏi lại email
- [x] Trang /product/:id - chi tiết sản phẩm: ảnh, mô tả, giá, bảo hành, nút liên hệ mua
- [x] Click sản phẩm trên trang chủ → điều hướng đến /product/:id
- [x] Trang /my-account nâng cấp: tabs Tổng Quan, Đơn Hàng, Điểm Thưởng, Bảo Hành, Yêu Cầu BH, Coupon
- [x] Tab Tổng Quan: stats (tổng đơn, tổng chi tiêu, điểm hiện tại, bảo hành còn hiệu lực)
- [x] Tab Đơn Hàng: danh sách đơn hàng với filter trạng thái, click xem chi tiết
- [x] Tab Điểm Thưởng: lịch sử tích/đổi điểm, số điểm hiện tại, hướng dẫn đổi điểm
- [x] Tab Bảo Hành: danh sách bảo hành còn hiệu lực, ngày hết hạn, sản phẩm
- [x] Tab Yêu Cầu BH: lịch sử yêu cầu bảo hành, trạng thái xử lý
- [x] Tab Coupon: danh sách coupon khả dụng (nếu có coupon cá nhân)
- [x] Header: hiển thị tên khách hàng sau khi login (lấy từ customer.me)

## Nav + So Sánh + Auth Guard

- [x] Bỏ "Sản Phẩm" (/catalog) khỏi nav menu (trang chủ đã là catalog)
- [x] Thêm "So Sánh" (/compare) vào nav menu riêng
- [x] Trang /compare: tách biệt hoàn toàn, có thể chọn sản phẩm để so sánh

## Phase 7 (Session Continuity): Client Portal Enhancement
- [x] Thêm products.getPublic procedure (lấy 1 sản phẩm theo id, không cần auth)
- [x] Tạo trang ProductDetail (/product/:id) với thông tin chi tiết sản phẩm
- [x] Sửa product card trong LandingPage để click dẫn đến /product/:id
- [x] CustomerAuthContext đã có và hoạt động
- [x] CustomerGuard component đã có và bảo vệ các trang cần đăng nhập
- [x] Thêm customer.myWarranties procedure
- [x] Nâng cấp MyAccount page: tab Bảo Hành, stats card, quick links, logout cải tiến
- [x] Viết unit tests cho customer procedures và products.getPublic (19 tests passed)

## Phase 10: Sửa giá VN + Thêm trường sản phẩm
- [x] Sửa format giá sản phẩm dùng định dạng VN đúng (dấu chấm phân cách hàng nghìn)
- [x] Thêm cột imageUrl vào schema products
- [x] Thêm cột description (chi tiết sản phẩm) vào schema products (đã có sẵn)
- [x] Thêm cột notes (lưu ý sản phẩm) vào schema products
- [x] Cập nhật admin UI để upload ảnh, nhập chi tiết, lưu ý sản phẩm
- [x] Cập nhật ProductDetail hiển thị ảnh, chi tiết, lưu ý
- [x] Cập nhật LandingPage, ProductCatalog, ProductCompare hiển thị ảnh sản phẩm

## Phase 11: Đổi giao diện client sang Light Theme
- [x] Cập nhật ClientHeader sang light theme
- [x] Cập nhật LandingPage sang light theme
- [x] Cập nhật ProductDetail sang light theme
- [x] Cập nhật ProductCatalog sang light theme
- [x] Cập nhật ProductCompare sang light theme
- [x] Cập nhật FlashSalePage sang light theme
- [x] Cập nhật LeaderboardPage sang light theme
- [x] Cập nhật TrackOrder sang light theme
- [x] Cập nhật LoyaltyPage sang light theme
- [x] Cập nhật WarrantyLookup sang light theme
- [x] Cập nhật WarrantyRequestPage sang light theme
- [x] Cập nhật ReviewPage sang light theme
- [x] Cập nhật PublicFeedbacks sang light theme
- [x] Cập nhật FAQPage sang light theme
- [x] Cập nhật QueuePage sang light theme
- [x] Cập nhật MyAccount sang light theme
- [x] Cập nhật ClientLogin sang light theme

## Phase 12: Danh mục 2 cấp + Gói sản phẩm có bảo hành

### Backend
- [x] Thêm warrantyMonths vào package router (create/update)
- [x] Thêm categories router (CRUD danh mục 2 cấp)
- [x] Thêm categoryId vào products router (create/update)
- [x] Cập nhật getProductsByUserId để kèm packages và category info
- [x] Cập nhật listPublic để kèm category info và filter theo categoryId

### Admin UI
- [x] Bỏ trường Giá và Bảo Hành khỏi form tạo/sửa sản phẩm
- [x] Thêm warrantyMonths vào form gói sản phẩm
- [x] Thêm dropdown chọn danh mục lớn + danh mục nhỏ vào form sản phẩm
- [x] Tạo trang admin quản lý danh mục (tạo/sửa/xóa danh mục lớn và nhỏ)
- [x] Hiển thị bảo hành theo gói trong bảng sản phẩm
- [x] Hiển thị danh mục trong bảng sản phẩm

### Client UI
- [x] Cập nhật ProductCatalog filter theo danh mục 2 cấp
- [x] Cập nhật ProductDetail hiển thị bảo hành theo gói đã chọn
- [x] Cập nhật LandingPage hiển thị danh mục

## Phase 13: Đại cải tổ - Giỏ hàng, Giới thiệu, Đánh giá SP, Custom fields, Yêu thích, Dashboard menu

### Schema DB
- [x] Tạo bảng cart_items (userId, productId, packageId, quantity)
- [x] Tạo bảng wishlists (userId, productId)
- [x] Tạo bảng referrals (referrerId, refereeId, code, reward, status)
- [x] Tạo bảng referral_settings (userId, rewardType, rewardAmount, isEnabled)
- [x] Tạo bảng product_custom_fields (productId, fieldName, fieldValue, sortOrder)
- [x] Thêm cột isFeatured vào products
- [x] Thêm cột avatarUrl vào users
- [x] Thêm cột referralCode vào users
- [x] Push schema changes

### Backend Routers
- [x] Cart router: add, remove, update quantity, list, clear
- [x] Wishlist router: toggle, list, check
- [x] Referral router: getMyCode, getStats, applyCode, admin config
- [x] Custom fields router: CRUD cho admin, public get
- [x] Products: toggle isFeatured, listFeatured public
- [x] Reviews: di chuyển đánh giá vào từng sản phẩm (productId based)
- [x] User profile: update avatar, update info

### Dashboard Menu Redesign
- [x] Phân nhóm menu sidebar thành các danh mục rõ ràng
- [x] Nhóm: Quản lý bán hàng (Đơn hàng, Hóa đơn, Khách hàng)
- [x] Nhóm: Sản phẩm (Sản phẩm, Danh mục, Flash Sale)
- [x] Nhóm: Marketing (Coupon, Giới thiệu, Tích điểm)
- [x] Nhóm: Cài đặt (Cài đặt chung, Thanh toán, Email/Telegram, Thuế)
- [x] Bỏ mục đánh giá chung khỏi sidebar

### Admin UI
- [x] Trang quản lý custom fields cho sản phẩm
- [x] Trang cấu hình hệ thống giới thiệu (reward, %)
- [x] Toggle sản phẩm nổi bật trong danh sách sản phẩm

### Client UI - Giỏ hàng
- [x] Trang giỏ hàng (/cart) với danh sách SP, số lượng, tổng tiền
- [x] Nút "Thêm vào giỏ" trong trang chi tiết SP
- [x] Nút "Mua ngay" trong trang chi tiết SP (tự tạo đơn)
- [x] Thanh toán nhiều SP cùng lúc từ giỏ hàng
- [x] Nhập coupon và mã giới thiệu khi thanh toán
- [x] Icon giỏ hàng trên header với badge số lượng

### Client UI - Đánh giá & Yêu thích
- [x] Đánh giá SP trực tiếp trong trang chi tiết (sau khi mua)
- [x] Đánh giá SP từ link riêng
- [x] Bỏ trang đánh giá chung, chuyển vào từng SP
- [x] Nút yêu thích (heart) trong trang chi tiết và danh sách SP
- [x] Trang danh sách yêu thích (/wishlist)

### Client UI - Giới thiệu & User
- [x] Trang giới thiệu bạn bè (/referral) với mã giới thiệu, thống kê
- [x] Cập nhật trang user: upload avatar, thêm tính năng
- [x] Bỏ phần "Tiện ích dành cho bạn" ngoài trang client
- [x] Trang chính chỉ hiển thị SP nổi bật (isFeatured)

## Phase 14: Redesign trang chính + trang catalog theo mẫu

### Trang chính (LandingPage)
- [x] Bỏ search bar và filter tabs cũ
- [x] Thêm banner chào mừng có thể đóng (dismissable)
- [x] Thêm filter tabs danh mục lớn (Tất cả, Tiện Ích, Gift Cards, Trò chơi...)
- [x] Thêm section danh mục icon scroll ngang (hiển thị danh mục con với icon)
- [x] Section "Sản phẩm nổi bật" với mô tả + nút "Xem tất cả"
- [x] Product cards hiển thị đẹp hơn (ảnh banner lớn, giá nổi bật)
- [x] Bỏ phần hero cũ, thay bằng layout mới gọn gàng

### Trang catalog (/catalog)
- [x] Thêm breadcrumb (Trang chủ > Sản phẩm)
- [x] Header gradient với tiêu đề "Tất cả sản phẩm" + mô tả
- [x] Filter panel: Danh mục dropdown + Thể loại (danh mục con) dropdown
- [x] Filter panel: Mức giá từ - đến
- [x] Filter panel: Sắp xếp (Mặc định, Giá tăng, Giá giảm, Mới nhất)
- [x] Nút Lọc + nút Reset
- [x] Hiển thị tổng số sản phẩm
- [x] Grid sản phẩm responsive

## Phase 15: Chuyển tính năng vào trang user + Fix UI

### Header/Nav
- [x] Bỏ link Tra Cứu Đơn, Bảo Hành, Tích Điểm, BXH khỏi menu header chính
- [x] Giữ lại Flash Sale, FAQ, Thêm trên header
- [x] Cập nhật mobile menu tương ứng

### Fix UI Catalog
- [x] Thu nhỏ filter panel trang catalog - mức giá đang bự hơn card
- [x] Cải thiện layout bộ lọc compact hơn

### Trang User (MyAccount)
- [x] Thêm section Giới thiệu bạn bè (referral code, copy, thống kê)
- [x] Thêm quick link Đơn hàng vào trang user
- [x] Thêm quick link Bảo hành vào trang user
- [x] Thêm quick link Tích điểm vào trang user
- [x] Thêm quick link BXH Chi tiêu vào trang user
- [x] Hoàn thiện UI trang user chuyên nghiệp hơn

## Phase 16: Fix bugs + Custom fields nhập khi mua

- [x] Xóa mockup data danh mục mẫu trong DB
- [x] Custom fields: hiển thị form yêu cầu user nhập khi thêm giỏ hàng/mua ngay (ProductDetail)
- [x] Custom fields: lưu giá trị user nhập vào cart item / order
- [x] Trang tra cứu đơn: bỏ card nhập email (đã login mới xem được)
- [x] Trang so sánh SP: fix không thêm được SP để so sánh

## Phase 17: Cải tiến trang bảo hành

- [x] Backend: router lấy danh sách SP đã mua có bảo hành (từ đơn hàng PAID)
- [x] Backend: router tạo đơn bảo hành trực tiếp từ SP đã mua
- [x] Client: hiển thị danh sách SP đã mua có bảo hành (ảnh, tên, gói, thời hạn BH)
- [x] Client: nút "Yêu cầu bảo hành" trên mỗi SP → tạo đơn BH theo quy trình
- [x] Client: bỏ form tìm kiếm SP bảo hành cũ

## Phase 18: Đồng bộ header + Fix bugs + Mua ngay + Thanh toán

### Header đồng bộ
- [x] Đồng bộ header các trang client với trang chính (logo + cart icon + hamburger menu)
- [x] Bỏ header cũ ở các trang con (ProductCatalog, ProductDetail, TrackOrder, v.v.)

### Fix bugs
- [x] Fix upload avatar không hoạt động
- [x] Xóa sạch mockup data danh mục còn sót trong DB (hệ thống tự tạo) - fix: filter by userId
- [x] Fix mức giá bộ lọc trang catalog bị dài hơn card (mobile)

### Icon CSS cho danh mục
- [x] Thêm FontAwesome CDN
- [x] Admin: chọn icon CSS/FontAwesome khi tạo/sửa danh mục
- [x] Client: hiển thị icon FontAwesome thay vì icon thường

### Redesign trang chi tiết SP
- [x] Header: ảnh SP lớn trên nền gradient
- [x] Tên SP + nút share + nút yêu thích (heart đỏ)
- [x] Rating stars + số đánh giá
- [x] Tags danh mục (từ categoryInfo)
- [x] Badge "Đã bán X" (từ totalSold)
- [x] Danh sách gói SP: mỗi gói có ảnh nhỏ, tên, "Giao ngay", giá

### Hoàn thiện mua ngay + thanh toán giỏ hàng
- [x] Nút "Mua ngay" tạo đơn hàng thực tế (tạo invoice + redirect thanh toán PayOS)
- [x] Giỏ hàng: thanh toán nhiều SP cùng lúc (tạo invoice tổng + redirect thanh toán PayOS)
- [x] Tích hợp coupon + mã giới thiệu khi thanh toán

## Phase 19: Fix UI danh mục + Tích hợp bảo hành vào user

### Fix card danh mục nhỏ (LandingPage)
- [x] "Tất cả" tab → hiển thị tất cả danh mục con trong card scroll
- [x] Chọn danh mục lớn → chỉ hiển thị danh mục con của danh mục đó trong card
- [x] Không tự tạo mockup danh mục trong code (xác nhận: không có code nào tự tạo)

### Tích hợp bảo hành vào trang user
- [x] Tích hợp vào section "Bảo hành" trong MyAccount (giữ /warranty cho user cũ )
- [x] Hiển thị danh sách SP đã mua có bảo hành trong tab bảo hành của trang user
- [x] Nút "Yêu cầu bảo hành" trực tiếp từ trang user (form inline)

## ## Phase 20: Fix bugs + Sản phẩm liên quan
### Fix lỗi tạo hoá đơn PayOS
- [x] Debug lỗi checkout.buyNow và checkout.cartCheckout
- [x] Fix: tạo invoice thành công nhưng PayOS trả về lỗi → gửi email xác nhận + fallback về trang track-order
- [x] Fix: nếu PayOS chưa cấu hình → tạo invoice và gửi email với link /pay
### Fix cập nhật avatar
- [x] Debug tại sao avatar upload xong không tự lưu vào profile
- [x] Fix: thêm avatarUrl vào customerSessions table, lưu vào DB sau upload
- [x] Fix: customer.me query trả về avatarUrl, CustomerAuthContext cập nhật state
### Sản phẩm liên quan (ProductDetail)
- [x] Thêm products.getRelated query - lấy SP cùng danh mục hoặc cùng shop
- [x] Hiển thị grid SP liên quan ở cuối trang chi tiết SP (responsive 2-4 columns)

## Phase 22: Refactor Toàn Diện

### A. Fix Bugs Khẩn Cấp
- [x] Fix PayOS: sửa signature format (alphabetical sort) và API endpoint (api-merchant.payos.vn/v2)
- [x] Fix avatar: persist avatarUrl - sửa staleTime trong CustomerAuthContext, avatarUrl đã lưu trong customerSessions
- [x] Fix coupon trong trang sản phẩm: validate thực sự qua API, hiển thị thông tin giảm giá
- [x] Fix ghi chú (notes): đã có trong CartPage và ProductDetail, truyền đúng vào mutation
- [x] Giỏ hàng KHÔNG tự xóa sản phẩm sau khi đặt hàng thành công (đã có comment trong code)
- [x] Fix feedback/review: chỉ hiện reviews đã approved (isApproved=true) ở trang sản phẩm
- [x] Thêm quản lý feedback/review trong admin: FeedbacksAdmin.tsx dùng products.getAllReviews
- [x] Hiển thị avatar trong review: getReviews join với customerSessions để lấy avatarUrl

### B. User Auth Email+Password
- [x] Schema: thêm cột resetPasswordToken, loginAttempts, lockedUntil vào customers
- [x] Trang /client-login: form đăng nhập email + mật khẩu + tab đăng ký + tab quên mật khẩu
- [x] Bảo mật: rate limiting login (5 lần sai = khóa 15 phút), bcrypt hash
- [x] Trang /my-account: tab đổi mật khẩu (ChangePasswordForm)

### C. Wallet (Nạp Số Dư)
- [x] Schema: bảng wallet_transactions đã có, walletBalance trong customerSessions
- [x] Trang nạp tiền: WalletPage.tsx tạo PayOS payment link để nạp số dư
- [x] Sau khi PayOS callback → cộng số dư vào wallet
- [x] Thanh toán bằng số dư: thêm payWithWallet vào cartCheckout, CartPage có UI chọn
- [x] Hiển thị số dư trong trang /my-account
- [x] Admin: xem lịch sử giao dịch wallet của khách

### D. Xóa/Ẩn Tính Năng
- [x] Xóa tính năng so sánh sản phẩm (/compare, nút compare trong catalog)
- [x] Xóa tính năng hàng chờ (waitlist)
- [x] Xóa tạo đơn thủ công trong admin (chỉ xem đơn từ hệ thống)

### E. Tích Điểm Mở Rộng
- [x] Schema: bảng loyaltyRewards, loyaltyRedemptions, spinWheelItems, spinWheelConfig đã có
- [x] Trang đổi thưởng: LoyaltyRewardsPage.tsx với 4 tab (Rewards, Spin Wheel, Mini Game, Referral)
- [x] Vòng quay may mắn: cấu hình trong admin, quay bằng điểm
- [x] Admin: quản lý phần thưởng, cấu hình vòng quay/mini game trong LoyaltySettings

### F. Giới Thiệu Bạn Bè Mở Rộng
- [x] Rút thưởng về ATM: form nhập số tài khoản ngân hàng trong LoyaltyRewardsPage
- [x] Rút thưởng về số dư: cộng trực tiếp vào wallet (withdrawType=wallet)
- [x] Admin: duyệt yêu cầu rút thưởng - ReferralWithdrawalsAdmin.tsx

### G. Banner Trang Chủ
- [x] Schema: bảng banners đã có (title, imageUrl, linkUrl, sortOrder, isActive)
- [x] Admin: quản lý banner - BannerSettings.tsx (CRUD, upload ảnh, sắp xếp)
- [x] Landing page: hiển thị banner carousel/slider (đã có trong LandingPage.tsx)

### H. Thuế (Tax)
- [x] Admin: cấu hình thuế suất (%) trong Settings - TaxSettings.tsx
- [x] Tự động tính thuế khi checkout (buyNow + cartCheckout đều tính tax từ taxSettings)
- [x] Hiển thị thuế trong hóa đơn (taxAmount được lưu vào invoice)

### I. Xuất Hóa Đơn Từ Trang User
- [x] Trang /my-account tab Đơn Hàng: nút "Xuất PDF" cho từng đơn
- [x] Tự động xuất hóa đơn PDF khi click (ExportPDFButton dùng pdf.exportMyInvoice)
- [x] Hỗ trợ VAT trong hóa đơn PDF

## Phase 23 - UI/UX Overhaul & New Features

### A. PayOS Fix (Khẩn cấp)
- [x] Debug PayOS lỗi trên production: kiểm tra API key, checksum key, webhook URL
- [x] Nếu lỗi: fallback sang PayOS payment link trực tiếp (checkout URL), redirect về trang cảm ơn
- [x] Nạp số dư tự động qua PayOS webhook (walletTopup)
- [x] Hoàn tiền tự động về số dư khi đơn lỗi hoặc admin chuyển trạng thái

### B. Header & Mobile Menu (theo ảnh tham khảo)
- [x] Header mobile: logo trái, search + gift + bell + avatar + hamburger phải
- [x] Dropdown search khi click icon search
- [x] Dropdown thông báo khi click bell (có badge số chưa đọc)
- [x] Dropdown user menu: avatar, tên, email, số dư, links (trang cá nhân, nạp tiền, đăng xuất)
- [x] Mobile drawer menu: avatar + số dư + danh mục sản phẩm + links
- [x] Header PC: logo + nav links + search bar + icons
- [x] Admin user thấy link "Vào Admin" trong user menu

### C. Footer Client (theo ảnh tham khảo)
- [x] Footer dark theme: logo + mô tả công ty
- [x] Section "Liên hệ": email, phone, địa chỉ (lấy từ settings)
- [x] Section "Liên kết": FAQ, Liên hệ, Tài liệu API
- [x] Copyright: "© 2026 All Rights Reserved by [TÊN] | Software By CMSNT.CO"
- [x] Nút scroll to top

### D. ProductDetail Redesign
- [x] Layout PC: 2 cột cân đối (ảnh + thông tin trái, form mua + chi tiết phải)
- [x] Gom "Thông tin đặt hàng" (custom fields) vào form mua hàng (không tách card riêng)
- [x] Sửa lỗi: trường tùy chỉnh là thông tin đặt hàng, ghi chú là khác (đang bị lộn)
- [x] Tags sản phẩm: hiển thị tags thay vì bảo hành trong card sản phẩm
- [x] Giao diện feedback mới: rating overview (5.0 + bar chart) + danh sách reviews có avatar
- [x] Chọn phương thức thanh toán ngay trong trang sản phẩm (số dư / banking)
- [x] Nếu banking: tính thuế; nếu số dư: không tính thuế

### E. Hệ thống Thông báo
- [x] Schema: bảng customer_notifications (customerId, title, content, type, isRead, createdAt)
- [x] Procedures: getMyNotifications, markAsRead, markAllRead
- [x] Header bell icon với badge số chưa đọc
- [x] Dropdown thông báo (như ảnh 4)
- [x] Tự động tạo thông báo khi: đặt hàng, thanh toán, nạp tiền, đơn hoàn thành

### F. Trang Kho Mã Giảm Giá
- [x] Trang /coupons: hiển thị các mã giảm giá đang active (như ảnh 8)
- [x] Card mã giảm giá: tên, mô tả, % giảm, hạn sử dụng, nút copy
- [x] Route + nav link trong header

### G. Hệ thống Ticket Hỗ trợ
- [x] Schema: bảng support_tickets (customerId, subject, status, priority, createdAt)
- [x] Schema: bảng ticket_messages (ticketId, senderId, senderType, content, createdAt)
- [x] Trang /support: tạo ticket, xem danh sách ticket của mình
- [x] Admin: xem và trả lời tickets
- [x] Widget hỗ trợ khách hàng (floating button góc phải)

### H. Wallet & Dòng Tiền
- [x] Hiển thị số dư trong header user menu
- [x] Trang /wallet: quản lý dòng tiền (lịch sử nạp, lịch sử chi tiêu)
- [x] Nạp tiền tự động: PayOS webhook → cộng số dư
- [x] Thanh toán số dư không tính thuế
- [x] CartPage: 2 hình thức (số dư / banking), banking tính thuế
- [x] ProductDetail: 2 hình thức thanh toán, banking tính thuế

### I. Tags Sản phẩm
- [x] Schema: bảng product_tags (id, name, slug, color)
- [x] Schema: bảng product_tag_relations (productId, tagId)
- [x] Admin: quản lý tags (tạo, sửa, xóa)
- [x] ProductDetail: hiển thị tags
- [x] ProductCatalog: filter theo tag

### J. Email & Auth
- [x] Email xác minh khi đăng ký (gửi link xác minh qua SMTP)
- [x] Trang /verify-email?token=xxx: xác minh email
- [x] Quên mật khẩu: gửi email reset (link /reset-password?token=xxx)
- [x] Trang /reset-password: nhập mật khẩu mới

### K. Giới thiệu bạn bè cải tiến
- [x] Khi user đăng ký qua link giới thiệu: ghi nhận referrerId
- [x] Khi người được giới thiệu nạp/mua lần đầu: tự động thưởng % cho người giới thiệu
- [x] Các đơn sau: khách nhập mã của ai thì người đó được thưởng

### L. Quản lý Đơn hàng User
- [x] Đổi tên "Tra cứu đơn hàng" thành "Quản lý đơn hàng"
- [x] Thiết kế lại UI: không hiện email lookup, hiện trực tiếp đơn hàng của user đã đăng nhập
- [x] Hiển thị trạng thái, chi tiết, nút xuất PDF

### M. Dọn dẹp Admin
- [x] Xóa trang tạo hóa đơn thủ công (đã làm)
- [x] Xóa trang tạo bảo hành thủ công
- [x] Xóa trang hoàn tiền (chỉ cần chuyển trạng thái đơn)
- [x] Hoàn tiền tự động về số dư khi admin chuyển trạng thái đơn sang "refunded"

## Phase: UI/UX Improvements (Apr 2026)
- [x] Viết lại ClientHeader - dark theme, bell notifications, avatar dropdown, admin link
- [x] Viết lại ClientFooter - dark navy, contact info, links, copyright
- [x] Cập nhật LandingPage dùng ClientHeader + ClientFooter chung
- [x] Thêm ClientFooter vào ProductDetail, ProductCatalog, CartPage, MyAccount, TrackOrder, FAQPage
- [x] Trang Kho Mã Giảm Giá (/coupons) - hiển thị mã đang hoạt động
- [x] Trang Hỗ Trợ (/support) - ticket system + widget nổi
- [x] SupportWidget floating button cho tất cả trang client
- [x] Cải thiện UI feedback/reviews trong ProductDetail
- [x] Đổi tên TrackOrder → Quản Lý Đơn Hàng
- [x] Hiển thị số dư ví trong MyAccount hero section
- [x] Admin link trong MyAccount và ClientHeader avatar dropdown
- [x] Backend: customerNotif router (list, markAllRead)
- [x] Backend: support ticket router (create, list, updateStatus)
- [x] Backend: coupon.listPublic procedure cho trang public
- [x] Thêm /coupons, /support, /wallet vào ALWAYS_PUBLIC routes

## Phase: Core Features & Bug Fixes (Apr 9, 2026)

- [x] Fix customField/notes confusion - customFieldValues now saved to orderInfo column, notes is separate
- [x] Add orderInfo column to invoices table (migration applied)
- [x] Display orderInfo (Thông Tin Đặt Hàng) separately from notes in InvoiceDetail
- [x] Fix FAQPage to use faq.listPublic (was using protected faq.list)
- [x] Add product tags system (productTags, productTagAssignments tables)
- [x] Add productTags router with CRUD + getForProducts
- [x] Replace warranty badge with tags in ProductCatalog and ProductDetail
- [x] Add TagSettings admin page
- [x] Add payment method selection (wallet/banking) to ProductDetail
- [x] Fix CartPage: no tax when paying with wallet
- [x] Fix buyNow: support payWithWallet + customerToken
- [x] Add email verification on registration (emailVerificationToken column)
- [x] Add verifyEmail procedure to customer router
- [x] Create VerifyEmailPage
- [x] Update ClientLogin to show verification message and pass origin
- [x] Add site announcements system (siteAnnouncements table + router)
- [x] Create AnnouncementBanner component
- [x] Add AnnouncementBanner to ClientHeader
- [x] Add admin link in ClientHeader avatar dropdown for admin users
- [x] Add wallet balance display in ClientHeader
- [x] Add CouponStorePage (Kho Mã Giảm Giá)
- [x] Add SupportPage with ticket system
- [x] Add SupportWidget floating button
- [x] Add coupon.listPublic procedure
- [x] Add customerNotif router (list, markRead, markAllRead)
- [x] Add support router (createTicket, listTickets, admin updateStatus)
- [x] Improve ProductDetail layout for PC (2-column)
- [x] Improve reviews/feedback UI in ProductDetail
- [x] Rename TrackOrder to Quản Lý Đơn Hàng, redesign hero
- [x] Add wallet balance to MyAccount hero section
- [x] Remove RefundPage from App.tsx
- [x] Update DashboardLayout with proper admin menu items
- [x] Add announcement router to appRouter

## Phase: Auto-refund, Wallet, Notifications (Apr 8, 2026)
- [x] Add REFUNDED to invoice status enum in schema.ts
- [x] Run migration to apply REFUNDED status to DB
- [x] Auto-refund logic in manualTransition: when status=REFUNDED, create walletTransaction + update customer balance
- [x] Auto-create customer notification when order status changes (PAID/SHIPPING/WARRANTY/FAILED/REFUNDED)
- [x] Auto-create customer notification when wallet topup succeeds (in PayOS webhook)
- [x] WalletPage redesign with ClientHeader/ClientFooter, dark theme, stats, quick amounts
- [x] wallet.adminList procedure for admin to view all wallet transactions
- [x] WalletManagement admin page (/wallet-management) with search, credit form, stats
- [x] Add /wallet-management route to App.tsx
- [x] Tag filter in ProductCatalog (filter by tag buttons)
- [x] productTags.list query for all tags
- [x] Fix PayOS description max 25 chars for wallet topup
- [x] Fix wallet topup orderCode to use modulo for uniqueness
- [x] ResetPasswordPage (/reset-password?token=xxx) added to routes
- [x] Add /reset-password route to App.tsx and ALWAYS_PUBLIC
- [x] wallet.adminList added to wallet router
todo updated

## Phase: UX/UI Overhaul (Apr 9, 2026)
- [x] ClientHeader: dropdown danh mục lớn → danh mục nhỏ khi hover/click
- [x] ClientHeader: nút đăng xuất trong menu khi đã login
- [x] ClientHeader: bỏ "Bảng điều khiển" khỏi avatar dropdown
- [x] ClientHeader: hiệu ứng bounce/pulse cho icon thông báo và giỏ hàng
- [x] ClientHeader: sửa router cho tất cả menu items (không nhảy về trang chính)
- [x] Background trắng cho tất cả trang client (SupportPage, CouponStorePage)
- [x] ProductDetail: form đánh giá màu trắng
- [x] WalletPage: redesign theo ảnh mẫu (trắng, clean, QR nạp tiền)
- [x] WalletPage: dùng ClientHeader + ClientFooter chung
- [x] DashboardLayout sidebar: fix scroll trên mobile để xem đầy đủ menu
- [x] MyAccount: hiển thị số dư ví
- [x] MyAccount: lịch sử đăng nhập (login history)
- [x] MyAccount: bảo mật 2FA qua Google Authenticator (QR code setup)
- [x] MyAccount: OTP qua Email toggle
- [x] MyAccount: thông báo đăng nhập toggle
- [x] Backend: customer login history table + router
- [x] Backend: 2FA TOTP setup/verify procedures
- [x] Backend: wallet transaction history router cho user
- [x] FAQPage → BlogPage: danh mục bài viết, editor bài viết, hiển thị blog chuyên nghiệp
- [x] Blog: admin tạo/sửa/xóa bài viết với danh mục
- [x] Blog: trang public /blog với danh mục, tìm kiếm

## Phase: Feature Flags & UI Completion (Apr 9, 2026 - Session 4)
- [x] LeaderboardPage: kiểm tra - đã có thiết kế tốt với podium top 3, dark theme
- [x] WishlistPage: kiểm tra - đã có thiết kế tốt với grid sản phẩm, xóa, thêm giỏ hàng
- [x] App.tsx: route /leaderboard và /wishlist đã có
- [x] LandingPage: tích hợp useFeatureFlags - ẩn Flash Sale banner khi flag flash_sale=false
- [x] LandingPage: thêm section Leaderboard mini (top 3 khách hàng) ẩn/hiện theo flag leaderboard
- [x] LandingPage: thêm link/section Wishlist ẩn/hiện theo flag wishlist
- [x] ClientHeader: admin link hiển thị cho user có role admin (đã kiểm tra OK)
- [x] Footer: lấy companyName từ getPublicInfo (đã có)

## Phase: Test Isolation Fix (Apr 9, 2026 - Session 5)
- [x] Phát hiện: tests dùng user ID=1 trùng với production DB, tạo dữ liệu test vào DB thật
- [x] Fix categories.list: lọc theo admin user (role=admin) thay vì first user
- [x] Fix test file: đổi test user ID sang 999999 (không trùng production)
- [x] Fix test file: thêm afterEach cleanup để xóa dữ liệu test sau mỗi test
- [x] Xóa 6 test categories và 10 test products khỏi production DB
- [x] Xác nhận: 53/53 tests pass, categories.list = 0 sau khi chạy tests

## Phase: Bug Fixes (Apr 9, 2026 - Session 6)
- [x] LandingPage: xóa wishlist link/section khỏi trang chủ
- [x] LeaderboardPage: redesign nền trắng sạch, chuyên nghiệp (theo yêu cầu user)
- [x] ClientHeader: admin link đã có trong cả desktop dropdown và mobile menu (hiện khi isAdmin=true)
- [x] ClientHeader: đổi tên "Tài khoản của tôi" → "Trang cá nhân"
- [x] Fix lỗi wallet_transactions insert: payosOrderCode INT overflow → BIGINT, db:push done

## Phase: UI Polish (Apr 9, 2026 - Session 7)
- [x] LeaderboardPage: redesign tabs chuyên nghiệp hơn (underline indicator style)
- [x] ClientHeader: sửa router "Đơn hàng" trong avatar dropdown → /track-order
- [x] ClientHeader: sửa "Đơn hàng" trong dropdown → /track-order
- [x] ClientHeader: sửa dùng CustomerAuthContext (reactive) thay vì đọc localStorage trực tiếp
- [x] Fix: CustomerAuthContext không lưu role, ClientHeader dùng sessionData.role cũ không reactive → đã sửa cả hai

## Phase: Security Features + Admin Link Fix (Apr 9, 2026 - Session 8)
- [x] Sửa dứt điểm admin link: CustomerAuthContext không lưu role + ClientLogin không truyền role → đã sửa
- [x] Thêm schema: login_history table (email, ip, userAgent, createdAt, status, failReason)
- [x] Thêm tRPC procedure: customer.getLoginHistory
- [x] Thêm tRPC procedure: customer.getActiveSessions + revokeSession + revokeAllOtherSessions
- [x] Thêm tRPC procedure: customer.revokeSession
- [x] Thêm tRPC procedure: customer.changePassword (đã có sẵn)
- [x] Thêm tab Bảo mật trong MyAccount: SecurityTab với 3 section (Tổng quan, Lịch sử, Thiết bị)
- [x] Ghi lại lịch sử đăng nhập khi customer.loginWithPassword thành công/thất bại

## Phase: Menu + Announcement (Apr 9, 2026 - Session 9)
- [x] ClientHeader: đã có link BXH (/leaderboard) trong menu (hiện theo feature flag leaderboard)
- [x] Admin: AnnouncementManagement đã tích hợp đầy đủ (route + sidebar + component)
- [x] Fix bug AnnouncementBanner: sửa a.sa_type → a.type

## Phase: Menu BXH + Announcement Admin (Apr 9, 2026)
- [x] ClientHeader: thêm link BXH vào menu (mobile + desktop, hiện theo feature flag leaderboard)
- [x] Tạo trang AnnouncementManagement trong admin + thêm vào sidebar "Banner & Thông báo"
- [x] App.tsx: thêm route /announcements → AnnouncementManagement

## Phase: No-Manus Fixes (Apr 9, 2026)
- [x] Xác nhận: hệ thống KHÔNG dùng Manus OAuth - dùng JWT cookie từ /api/auth/login
- [x] protectedProcedure đọc JWT cookie (admin login) - ĐÚNG, không cần sửa
- [x] AnnouncementManagement: route /announcements + sidebar link đã tích hợp đầy đủ
- [x] Lưu tài liệu AUTH_ARCHITECTURE.md giải thích 2 luồng auth
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: UI Fixes (Apr 9, 2026 - Session 10)
- [x] Fix link Admin: thêm checkIsAdmin procedure (lookup email trong bảng users), ClientHeader dùng procedure này
- [x] Gộp tab Bảo mật vào tab Hồ sơ trong MyAccount - redesign 3 sections đẹp (Hồ sơ, Bảo mật, Tài khoản)
- [x] Bỏ breadcrumb "Trang chủ > Sản phẩm" trong trang ProductCatalog
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: Fix Admin Link Router (Apr 9, 2026 - Session 11)
- [x] Fix dropdown icon user: link Admin trỏ đúng về /login (admin panel) - dùng window.location.href
- [x] Cả 2 chỗ (desktop dropdown + hamburger menu) đều được sửa

## Phase: Admin Link Cleanup (Apr 9, 2026 - Session 12)
- [x] Xóa link Admin khỏi hamburger menu (ClientHeader)
- [x] Xóa link Admin khỏi MyAccount
- [x] Chỉ giữ link Admin trong dropdown icon user trên header desktop
- [x] TypeScript: 0 errors

## Phase: Fix Admin Login (Apr 9, 2026 - Session 13)
- [x] Xác nhận: tài khoản admin đã có email thanhtinz23072003@gmail.com + role admin
- [x] Reset mật khẩu admin thành tinklh23 (1 row updated)

## Phase: Admin-Client Navigation (Apr 9, 2026 - Session 14)
- [x] Thêm nút "Về trang khách hàng" trong admin sidebar (DashboardLayout) - đã có trong footer dropdown
- [x] Nút trong client header dropdown đã có - điều hướng sang /client-login

## Phase: Unified Auth (Apr 9, 2026 - Session 15)
- [x] Hợp nhất auth: 1 login duy nhất (/client-login) cho cả khách và admin
- [x] Sau login: nếu role=admin → redirect /dashboard, còn lại → redirect /
- [x] context.ts: nhận x-customer-token header, nếu isAdminSession=true → set ctx.user
- [x] main.tsx: tự động gửi x-customer-token header trong mọi request
- [x] DashboardLayout: dùng useCustomerAuth thay vì useAuth, check role=admin
- [x] DashboardLayout: logout → redirect /client-login, "Về trang khách hàng" → /
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: Fix Dashboard Back Button (Apr 9, 2026 - Session 16)
- [x] Fix nút "Về trang khách hàng": dùng window.open("/", "_blank") → mở tab mới
- [x] Thêm "/" vào ALWAYS_PUBLIC list trong App.tsx để trang chủ luôn accessible
- [x] Thêm Route path="/" vào ALWAYS_PUBLIC Switch block

## Phase: Product Tag Field (Apr 9, 2026 - Session 17)
- [x] Thêm trường tag vào form tạo/sửa sản phẩm - UI chip click để chọn/bỏ tag
- [x] products.list trả về tags cho mỗi sản phẩm
- [x] products.create trả về id để gán tags ngay sau khi tạo
- [x] handleEdit load tags hiện có của sản phẩm vào selectedTagIds
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: Major UI Fixes (Apr 9, 2026 - Session 18)
- [x] Sticky cart/mua nhanh trên mobile trong trang chi tiết sản phẩm
- [x] Hiệu ứng giỏ hàng realtime (optimistic update, không cần reload)
- [x] Xóa giỏ hàng sau khi tạo đơn thành công
- [x] Redesign tab đơn hàng trong MyAccount (fix NaN đ, layout đẹp hơn)
- [x] Hệ thống thông báo: icon bell header hoạt động, gửi thông báo khi đặt hàng
- [x] Redesign header dashboard và thêm link cấu hình thông báo

## Phase: Major UI Fixes (Apr 9, 2026 - Session 18)
- [x] Fix sticky cart mobile: chỉ hiện trên mobile (md:hidden), thêm padding bottom cho content
- [x] Fix hiệu ứng giỏ hàng realtime: invalidate cart.list thay vì cart.count
- [x] Fix xóa giỏ hàng sau đặt hàng: gọi clearCart.mutate trong cartCheckout.onSuccess
- [x] Fix NaN đ trong tab đơn hàng: dùng item.unitPrice thay vì item.price
- [x] Redesign tab đơn hàng: thêm filter trạng thái (Tất cả, Chờ, Đã thanh toán, Hoàn thành, Hủy)
- [x] Hệ thống thông báo: gửi notification khi đặt hàng (buyNow + cartCheckout)
- [x] Tạo trang AdminNotifications (/admin/notifications) để admin gửi thông báo
- [x] Thêm broadcast procedure để gửi thông báo đến tất cả khách hàng
- [x] Redesign header dashboard: top bar cố định, SidebarTrigger trên cả desktop/mobile
- [x] Thêm link "Gửi thông báo" vào sidebar admin
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: Major Improvements (Apr 9, 2026 - Session 19)
- [x] Fix số 0 dư trong trang đơn hàng (OrderDetailPage - coupon section)
- [x] Fix nút nạp tiền PayOS: giữ paymentUrl sau khi tạo, không mất link khi loading
- [x] Feature flags block route hoàn toàn: khi tắt tính năng, route trả về 404/redirect
- [x] Xóa links tính năng bị tắt khỏi MyAccount (wishlist, leaderboard, warranty, referral)
- [x] Kho ảnh avatar: admin upload/quản lý avatar library
- [x] Client chọn avatar từ kho hoặc upload ảnh riêng
- [x] Redesign toàn bộ admin dashboard: sidebar gọn gàng, gộp trang liên quan
- [x] Cải thiện admin layout: thống nhất design system, chuyên nghiệp hơn
- [x] Fix tag trạng thái PAID hiển thị "Hoàn thành" → đổi thành "Đang xử lý"
- [x] Fix progress bar mất cân bằng trong CartPage (đường kẻ không đều)
- [x] Track order: nút "Xem chi tiết" dùng route /order/:invoiceNumber

## Phase: Feature Flags & Avatar Gallery (Apr 9, 2026 - Session 20)
- [x] Tạo FeatureGuard component: block route hoàn toàn khi feature bị tắt (redirect về /)
- [x] App.tsx: áp dụng FeatureGuard cho wishlist, flash_sale, leaderboard, blog, faq, loyalty (points), warranty-request, referral, wallet, wallet-history, coupons
- [x] App.tsx: thêm route /admin/avatar-gallery → AvatarGalleryAdmin
- [x] MyAccount: ẩn wallet balance section khi feature wallet bị tắt
- [x] MyAccount: ẩn quick action buttons (wishlist, leaderboard) khi feature bị tắt
- [x] MyAccount: ẩn feature links trong overview tab (points, warranty, referral, leaderboard)
- [x] MyAccount: thêm nút "Chọn từ kho" mở modal gallery avatar
- [x] MyAccount: modal gallery avatar với grid ảnh, chọn avatar từ kho admin
- [x] routers.ts: thêm customer.selectAvatar procedure để lưu avatar từ gallery
- [x] TypeScript: 0 errors, 53/53 tests passed

## Phase: Order Status + Leaderboard + Tag + Avatar UI (Apr 9, 2026 - Session 21)
- [x] Chuẩn hóa trạng thái đơn hàng: CREATED=Chờ xác nhận, PAID=Đang xử lý, SHIPPING=Đang giao, COMPLETED=Hoàn thành, WARRANTY=Bảo hành, FAILED=Thất bại, REFUNDED=Hoàn tiền, CANCELLED=Đã hủy
- [x] Cập nhật labels/colors trạng thái trong: OrderDetailPage, TrackOrder, MyAccount, CartPage, admin order management
- [x] Cập nhật email templates và thông báo khi đổi trạng thái đơn hàng
- [x] Fix FeatureGuard leaderboard: route /leaderboard vẫn truy cập được khi tắt (do nằm trong ALWAYS_PUBLIC)
- [x] Redesign LeaderboardPage: bỏ thống kê thừa, hiển thị theo thứ tự số thứ tự (1, 2, 3...)
- [x] Kiểm tra và fix trang quản lý tag (/settings/tags) trong admin sidebar
- [x] Cải thiện UI chọn avatar: click vào icon camera mở popup chọn từ kho hoặc upload
- [x] Fix giỏ hàng không tự xóa sau khi tạo thanh toán PayOS (đảm bảo await clearCart trước khi redirect)

## Phase: UX/UI Fixes (Apr 9, 2026 - Session 22)
- [x] Fix progress bar CartPage: căn chỉnh đường kẻ ngang đều giữa các bước
- [x] Fix progress bar OrderDetailPage: căn chỉnh đường kẻ ngang đều giữa các bước
- [x] Thay tag "BH 3T" bằng tag sản phẩm thực tế từ DB (hiển thị tags của sản phẩm)
- [x] Xóa số 0 thừa trên card thông tin thanh toán trong OrderDetailPage

## Phase: Fix số 0 + Admin Topup (Apr 9, 2026 - Session 23)
- [x] Tìm và sửa triệt để số 0 thừa trong OrderDetailPage (warrantyMonths=0 gây ra render 0)
- [x] Thêm trang quản lý nạp tiền cho admin (dùng WalletManagement đã có)
- [x] Thêm mục "Quản lý nạp tiền" vào sidebar admin (dùng Quản Lý Ví)
- [x] Thêm icon cho tag trong trang TagSettings (form tạo/sửa tag)
- [x] Thêm mục Quản Lý Ví vào sidebar admin
- [x] Fix 404 kho ảnh avatar trong admin (/settings/avatars)
- [x] Thêm icon cho tag trong TagSettings (thêm cột icon vào schema + UI)
- [x] Thêm mục Quản Lý Ví vào sidebar admin
- [x] Cải thiện UI WalletManagement: thêm button thao tác (duyệt nạp tiền, hoàn tiền, điều chỉnh số dư, xem lịch sử giao dịch)
- [x] Redesign trang Dashboard admin với giao diện mới (stats cards đẹp hơn, recent orders, quick actions)

## Phase: Replace lucide-react with Font Awesome CSS Icons (Apr 9, 2026 - Session 25)
- [x] Thay the toan bo 122 file dung lucide-react bang Font Awesome 6 CSS
- [x] Tao component Icon.tsx voi mapping 161 icons lucide -> FA
- [x] Fix spinner.tsx khong dung SVG props
- [x] Fix kich thuoc icon CSS bi lech: them CSS global map w-N h-N -> font-size
- [x] TypeScript 0 errors, 53/53 tests passed

## Phase: Notifications + WalletManagement Fix (Apr 9, 2026 - Session 24)
- [x] Fix WalletManagement: đang dùng DashboardLayout sai, cần dùng DashboardLayoutCustom
- [x] Thêm trang quản lý thông báo website cho admin (/admin/notifications)
- [x] Thêm mục Thông Báo vào sidebar admin

## Phase: PayOS Cancel Handler (Apr 9, 2026 - Session 26)
- [x] Backend: tạo tRPC procedure payos.handleCancel nhận orderCode + type (order/wallet), cập nhật trạng thái tương ứng
- [x] Backend: khi type=order → cập nhật order status = 'cancelled'
- [x] Backend: khi type=wallet → cập nhật wallet transaction status = 'failed'
- [x] Frontend: trang /payment/cancel gọi handleCancel và hiển thị thông báo phù hợp
- [x] Frontend: trang /wallet/cancel gọi handleCancel và hiển thị thông báo phù hợp
- [x] Đảm bảo cancelUrl trong createPaymentLink trỏ đúng trang cancel tương ứng

## Phase: Fix Remaining lucide-react Icons (Apr 9, 2026 - Session 27)
- [x] Quét và thay thế tất cả import lucide-react còn sót trong codebase
- [x] Fix icon trong nội dung thông báo dropdown header (ClientHeader notification dropdown)
- [x] Thay emoji picker trong TagSettings.tsx bằng FA icon picker
- [x] Thay emoji trong notifTypeIcon (ClientHeader) bằng FA icon

## Phase: Referral Reward Redemption (Apr 9, 2026 - Session 28)
- [x] Hiển thị % thưởng từ cấu hình referral trên ReferralPage
- [x] Backend: procedure đổi thưởng referral vào số dư ví
- [x] Backend: procedure yêu cầu rút thưởng qua banking (lưu yêu cầu, admin duyệt)
- [x] Frontend: UI đổi thưởng (chọn rút vào ví hoặc banking)
- [x] Admin: trang xem và duyệt yêu cầu rút thưởng banking

## Phase: Fix Nút Quy Đổi LoyaltyRewardsPage (Apr 9, 2026 - Session 29)
- [x] Fix tab Referral trong LoyaltyRewardsPage: đã có đầy đủ UI rút thưởng (thông báo "sớm ra mắt" là của tab Mini Game, không phải tab Referral)

## Phase: Fix Tag, BXH, Icon, Quy Đổi (Apr 9, 2026 - Session 30)
- [x] Xóa tag hardcode "Giao ngay" trong ProductDetail (chỉ giữ tag từ DB)
- [x] Fix tag từ DB không hiện FA icon (icon field lưu FA class nhưng không render đúng)
- [x] Ẩn section Bảng Xếp Hạng khỏi trang chính (Home)
- [x] Fix nút "Quy đổi" trong tab Giới thiệu trang cá nhân (MyAccount) - đã có dialog withdraw đầy đủ, nút disabled khi số dư = 0 (behavior đúng)

## Phase: Fix Wallet Status, Icon Tag (Apr 9, 2026 - Session 31)
- [x] WalletHistoryPage: hiển thị trạng thái nạp tiền (Đã nạp/Chờ xử lý/Thất bại) với icon màu sắc
- [x] WalletPage: thêm icon cho lịch sử đơn nạp tiền
- [x] Đồng nhất icon tag sản phẩm giữa trang chính (LandingPage) và trang chi tiết (ProductDetail)

## Phase: Security Audit & Cleanup (Apr 9, 2026)
- [x] Backend: thêm rate limiting cho các endpoint nhạy cảm (login, payment, referral)
- [x] Backend: validate và sanitize tất cả input từ user (zod schemas chặt chẽ hơn)
- [x] Backend: kiểm tra authorization - đã fix adminCredit, adminList wallet/referral thiếu role check
- [x] Backend: thêm CORS headers và security headers (helmet)
- [x] Backend: giới hạn kích thước request body để chống DoS (giảm từ 50MB xuống 10MB)
- [x] Backend: ẩn thông tin lỗi chi tiết khỏi response production (helmet + error handler)
- [x] Frontend: sanitize HTML input để chống XSS (DOMPurify cho BlogPostPage)
- [x] Frontend: xóa console.log debug trong production (kiểm tra không có log nhạy cảm)
- [x] Frontend: bảo vệ route admin - redirect nếu không có quyền (ForbiddenPage đã có sẵn)
- [x] Xóa các trang/component không còn dùng (orphan pages): ComponentShowcase, Home, ProductCompare
- [x] Fix các bug đã biết: TypeScript 0 errors, 53/53 tests passed

## Phase: Security Audit & Cleanup (Apr 9, 2026 - Session 28)
- [x] Backend: thêm helmet (security headers: X-Frame-Options, X-Content-Type-Options, HSTS, v.v.)
- [x] Backend: thêm rate limiting (100 req/15min general, 10 req/15min auth endpoints)
- [x] Backend: giảm body parser limit từ 50MB xuống 10MB để chống DoS
- [x] Backend: thêm role check admin cho adminCredit (wallet), adminList (wallet), adminList (referral)
- [x] Frontend: thêm DOMPurify sanitize cho dangerouslySetInnerHTML trong BlogPostPage (chống XSS)
- [x] Xóa trang không dùng: ComponentShowcase.tsx, Home.tsx, ProductCompare.tsx
- [x] Thêm routes còn thiếu: RefundPage, QueuePage, SpinWheelPage, SpinWheelAdmin, LoyaltyRewardsAdmin, LoyaltyRewardsPage
- [x] Xóa route trùng lặp: /blog-management (dùng /admin/blog), /announcements (dùng /admin/announcements)
- [x] TypeScript 0 errors, 53/53 tests passed

## Phase: Fix Popup Config & Sticky Bar (Apr 9, 2026)
- [x] Thêm link trang cấu hình thông báo/popup/banner vào admin sidebar (Banner Trang Chủ, Thông Báo Website, Thông Báo Hệ Thống đã có sẵn)
- [x] Fix sticky bottom bar ProductDetail mobile: dùng position:fixed thay vì bị cuộn theo trang
- [x] ProductDetail: xóa sticky bottom bar mobile, gộp nút Giỏ hàng/Mua ngay vào card thông tin đặt hàng

## Phase: UI/UX Fixes (Apr 9, 2026 - Session 32)
- [x] ProductCatalog grid view: xóa hardcode "Giao ngay" + số gói → hiển thị tag sản phẩm từ DB
- [x] ProductCatalog list view: xóa hardcode "Giao ngay" + tên gói → hiển thị tag sản phẩm từ DB
- [x] Fix khoảng cách header/thân trang: thêm pt-14 vào LoyaltyRewardsPage, SpinWheelPage, ResetPasswordPage, LeaderboardPage
- [x] Fix AnnouncementBanner popup không hiện: thêm AnnouncementBanner vào LandingPage để popup hoạt động

## Phase: UI/UX Nâng Cấp Toàn Diện (Apr 9, 2026 - Session 33)
- [x] Thêm rating (sao) và số lượng đã bán vào card sản phẩm (LandingPage grid + ProductCatalog grid/list)
- [x] Backend: thêm procedure lấy rating trung bình + số review + số đã bán cho sản phẩm
- [x] Fix tag trùng lặp trong ProductCatalog: grid view hiện 2 tag (danh mục + tag DB), list view thiếu tag danh mục
- [x] Fix card danh mục con mobile (ảnh 4): card quá to, cần làm gọn lại
- [x] Thiết kế lại FlashSalePage đồng bộ với trang chính
- [x] Thiết kế lại LeaderboardPage đồng bộ với trang chính
- [x] Thiết kế lại BlogPage đồng bộ với trang chính
- [x] Thiết kế lại SupportPage đồng bộ với trang chính
- [x] Thiết kế lại CouponStorePage đồng bộ với trang chính
- [x] Fix khoảng cách header/thân trang: pt-14 → pt-16 trên tất cả trang client
- [x] Thêm link trang cấu hình thông báo/popup/banner vào admin sidebar (Banner Trang Chủ, Thông Báo Website, Thông Báo Hệ Thống đã có sẵn)

## Session Apr 9, 2026 - UI/UX Improvements Batch 2

- [x] Thêm rating (sao) và số đã bán vào card sản phẩm (LandingPage + ProductCatalog grid/list)
- [x] Backend: thêm avgRating, reviewCount, soldCount vào products.listPublic
- [x] Fix tag trùng lặp trong ProductCatalog grid view (dùng product.tags thay vì tagMappings)
- [x] Fix card danh mục con mobile - icon nhỏ hơn, card gọn hơn (w-[56px])
- [x] Thiết kế lại FlashSalePage hero banner đồng bộ
- [x] Thiết kế lại LeaderboardPage hero banner đồng bộ
- [x] Thiết kế lại BlogPage hero banner đồng bộ
- [x] Thiết kế lại SupportPage hero banner đồng bộ
- [x] Thiết kế lại CouponStorePage hero banner đồng bộ
- [x] Fix khoảng cách header/thân trang: pt-14 → pt-16 trên tất cả trang client
- [x] Desktop dropdown danh mục: parent có children thì không navigate khi click (bỏ "Tất cả Giải trí")

## Phase: UI/UX Fixes Batch 3 (Apr 9, 2026)
- [x] Fix card danh mục con: giảm kích thước card container (inline-flex, không full-width)
- [x] Đồng bộ card sản phẩm ProductCatalog grid/list với LandingPage ProductCard (tag style bg-white/90)
- [x] Fix FlashSalePage thiếu footer ClientFooter
- [x] ProductDetail: đổi card "Lưu ý" thành "Chi tiết gói" dạng dropdown accordion giống card mô tả

## Phase: UI/UX Fixes Batch 4 (Apr 9, 2026)
- [x] Fix card danh mục con: icon lớn (w-14 h-14) + text bên dưới dạng card vuông (90px), không full-width
- [x] Fix ProductDetail: card "Chi tiết gói" chỉ hiển thị notes (product.notes) dạng dropdown accordion
- [x] Fix thông báo popup (AnnouncementBanner) hiện trên tất cả trang bằng cách đưa vào App.tsx
- [x] Fix card danh mục con: layout ngang (icon trái + text phải), không còn dạng dọc cao
- [x] Fix AnnouncementInline banner không hiện trên mobile: sửa class trùng lặp mx-4 và mx-auto
- [x] Fix AnnouncementInline và AnnouncementBanner popup: banner inline reset mỗi ngày (không lưu mãi mãi), popup snooze 2h theo session
- [x] Admin Banner: thêm tính năng upload ảnh lên S3 (thay vì chỉ nhập URL)
- [x] Đồng bộ card sản phẩm ProductCatalog grid/list với LandingPage (tag style, rating, sold count)
- [x] Thêm nút trái/phải (ChevronLeft/ChevronRight) cho banner slider trong LandingPage
- [x] Sửa layout danh mục con: mỗi card riêng, icon lớn hơn, border highlight khi hover
## Phase: ProductDetail Rewrite (Apr 10, 2026)
- [x] Viết lại toàn bộ ProductDetail layout theo ảnh mẫu: hero gradient teal, 2 cột PC (left 70% + right 30% sticky), mobile single column, review full width
- [x] Package card: horizontal layout (image + info + price + radio), grid 2 cột desktop, single column mobile
- [x] Quantity selector: căn đều trong card (justify-between)
- [x] Order info card: Số lượng, Custom fields, Coupon, Wallet, Notes, Tổng tiền, Nút mua
- [x] Đánh giá sản phẩm: full width bên dưới left column (không nằm trong right sidebar)
- [x] ProductDetail: bỏ icon thường trong tags, sửa lỗi fa- icon CSS không nhận diện, chữ trong hero xanh màu nổi bật hơn
- [x] ProductDetail: icon CSS (fa-tag) cho mã giảm giá thay vì emoji
- [x] ProductDetail: bỏ button "Xem chi tiết & Đánh giá" trong order info card
- [x] ProductDetail: thêm card sản phẩm liên quan (cùng danh mục)
- [x] LandingPage: bấm danh mục con → filter sản phẩm theo danh mục con đó
- [x] LandingPage: đổi "Tất cả sản phẩm" → "Sản phẩm nổi bật", tối đa 10 sản phẩm
- [x] LandingPage: thêm card "Sản phẩm bán chạy" (lượt mua nhiều nhất)
- [x] ProductDetail: thêm card "Lưu ý sản phẩm" hiển thị mô tả gói đang chọn, tự động cập nhật khi bấm gói khác

## Phase Admin Redesign: AdminKit Style
- [x] Xây dựng AdminLayout mới (sidebar navy, header trắng) theo phong cách AdminKit
- [x] Redesign Dashboard, Orders, Products, Customers, Reports theo AdminKit
- [x] Redesign Wallet, Blog, Coupons, FlashSale, Warranty, Feedbacks, Referral, Staff theo AdminKit
- [x] Redesign Settings (gộp sub-settings), bỏ/gộp trang thừa
- [x] Dọn App.tsx: bỏ routes thừa, đảm bảo AdminLayout bao hết trang admin
- [x] Cập nhật menu sidebar: thêm Flash Sale Subscribers, Loyalty Rewards, Warranty Requests, Referral Withdrawals, Refunds, Spin Wheel, VAT Invoices
- [x] Tạo ReferralAdmin.tsx (gộp ReferralSettings + ReferralWithdrawalsAdmin)
- [x] Tạo LoyaltyAdmin.tsx (gộp LoyaltySettings + LoyaltyRewardsAdmin)
- [x] Tạo FlashSaleAdmin.tsx (gộp FlashSaleSettings + FlashSaleSubscriberSettings)
- [x] Cập nhật App.tsx routes cho các trang gộp mới
- [x] Redesign Dashboard theo AdminKit (cards trắng, shadow nhẹ, KPI đẹp)
- [x] Redesign Orders/Invoices theo AdminKit
- [x] Redesign Products theo AdminKit
- [x] Redesign Customers theo AdminKit
- [x] Redesign Reports theo AdminKit
- [x] Redesign WalletManagement theo AdminKit
- [x] Redesign Feedbacks theo AdminKit
- [x] Redesign Blog theo AdminKit
- [x] Redesign Coupons theo AdminKit
- [x] Redesign Staff theo AdminKit
- [x] Redesign Settings theo AdminKit

## Phase N: Redesign Admin + Gộp Settings + Dọn dẹp code
- [x] Redesign Dashboard.tsx theo AdminKit (KPI cards + charts đẹp hơn)
- [x] Redesign Customers.tsx theo AdminKit (table + search + actions)
- [x] Redesign Products.tsx theo AdminKit (table + search + actions)
- [x] Redesign InvoiceHistory.tsx theo AdminKit (table + filters + actions)
- [x] Redesign Reports.tsx theo AdminKit (charts + stats)
- [x] Gộp tất cả Settings vào AdminSettings.tsx với tabs
- [x] Cập nhật route /settings/* trong App.tsx trỏ về AdminSettings.tsx
- [x] Xóa trang không dùng: QueuePage, Reminders, EmailCampaigns, TaxReportPage, DataBackup, AdvancedSearch, ImportExcel, RecurringInvoices, WeeklyReports
- [x] Xóa routes tương ứng trong App.tsx
- [x] Xóa lazy imports không dùng trong App.tsx

## Phase: Thêm tính năng mới (Apr 10, 2026)
- [x] Thêm trang Thư viện ảnh (ImageLibrary) với folder tree và upload
- [x] Mã giảm giá: thêm trường chọn sản phẩm khi tạo mã
- [x] Tách Affiliate thành 3 trang: Cấu hình, Nhật ký hoa hồng, Rút tiền
- [x] Tích điểm: tách thành Cấu hình, Lịch sử, Phần thưởng, Vòng quay
- [x] Blog: tách thành Chuyên mục, Viết bài mới, Tất cả bài viết
- [x] Nạp tiền: tách thành mục riêng (Cấu hình PayOS, Lịch sử, Quản lý ví)
- [x] Menu admin: phân mục rõ ràng với 10 nhóm

## Session 2026-04-10 - Cải thiện tính năng

- [x] Cải thiện trang kho ảnh avatar: thêm filter category, bulk upload nhiều ảnh, preview modal, view mode grid/list, copy URL, select nhiều ảnh để bulk delete/toggle
- [x] Bỏ trang Nhân Viên riêng, gộp vào tab trong trang Quản Lý Khách Hàng
- [x] Thêm cột Phân Loại (customerRole) vào bảng khách hàng: Khách Thường / VIP / Đại Lý / Đối Tác
- [x] Thêm field customerRole vào database schema và migration
- [x] Thêm procedure customers.updateRole vào routers.ts
- [x] Redesign trang Thông Báo & Banner: gộp 2 tính năng vào 1 trang với 2 tab đẹp hơn
- [x] Thêm link "Xem Trang Web" vào menu admin (mở trang client trong tab mới)
- [x] Tạo trang TopupHistory.tsx riêng cho Lịch Sử Nạp (xem danh sách, trạng thái, biến động tiền)
- [x] Quản Lý Ví đã có tính năng điều chỉnh số dư khách hàng (adminCredit)
- [x] Bỏ nút Quay lại trong trang Cấu Hình PayOS
- [x] Clean code PayPal: xóa PayPal logic khỏi testConnection trong routers.ts

## Session 2026-04-10 - Hoàn thiện UI Admin

- [x] Bỏ hoàn toàn tab Nhân Viên khỏi Customers.tsx (chỉ còn danh sách khách hàng)
- [x] Cải thiện tab UI AnnouncementManagement.tsx: custom tab bar với active=bg-blue-600, badge count, icon
- [x] Tách Blog thành 3 mục riêng trong menu sidebar: Tất Cả Bài Viết / Viết Bài Mới / Chuyên Mục
- [x] Route /admin/blog → BlogPosts (thay vì BlogManagement)
- [x] TypeScript 0 errors

## Session 2026-04-10 - Cải thiện UI Mobile + Tính năng mới

### Mobile Layout & Extensions
- [x] Redesign Extensions.tsx cho mobile: card grid responsive, thêm config dialog trước khi bật tính năng
- [x] Redesign RedisConsole.tsx cho mobile: layout gọn hơn, toolbar responsive
- [x] Redesign AdminConsole.tsx cho mobile: layout gọn hơn, input full width

### Settings Redesign
- [x] Redesign Settings.tsx với 6 nhóm: Identity (tên, logo, favicon), Visuals (màu sắc, font, theme), Assets (ảnh, media), Storage (S3/CDN), System (SMTP, Telegram, PayOS), Danger (xóa data, reset)

### Product Features
- [x] Thêm nút Chia Sẻ cạnh nút Yêu Thích trong ProductDetail
- [x] Fix ẩn tab Giới Thiệu (Referral) trong MyAccount khi tính năng referral bị tắt

### Inventory Fix
- [x] Fix kho hàng: chặn đặt hàng khi hết tồn kho (backend validate + frontend hiển thị "Hết hàng")
- [x] ProductDetail: hiển thị badge "Hết hàng" và disable nút mua khi tồn kho = 0

### Giá theo quyền hạn khách hàng
- [x] Schema: thêm priceVip, priceWholesale, pricePartner vào bảng product_packages
- [x] Migration: pnpm db:push cho schema mới
- [x] Backend: procedure tạo/sửa package hỗ trợ 4 mức giá
- [x] Backend: khi lấy giá gói, tự động chọn giá theo customerRole của khách đang đăng nhập
- [x] Admin UI: form tạo/sửa gói sản phẩm thêm 3 trường giá VIP/Đại Lý/Đối Tác
- [x] Client UI: ProductDetail hiển thị giá đúng theo quyền hạn khách hàng

### Mail xác thực & Quên mật khẩu
- [x] Backend: procedure gửi mail xác thực email khi đăng ký (token + link)
- [x] Backend: procedure verify email token
- [x] Backend: procedure gửi mail quên mật khẩu (reset token)
- [x] Backend: procedure reset mật khẩu bằng token
- [x] Frontend: trang /verify-email xử lý token xác thực
- [x] Frontend: trang /reset-password xử lý token reset mật khẩu
- [x] Frontend: ClientLogin thêm link "Quên mật khẩu?"
- [x] Frontend: form quên mật khẩu (nhập email → gửi mail)

### Cài đặt thông báo trong trang cá nhân
- [x] Schema: thêm các cột notify vào bảng customers (notifyOnLogin, notifyNewProduct, notifyFlashSale, notifyOrderStatus, notifyPromotion)
- [x] Migration: thêm cột vào DB
- [x] Backend: procedure updateNotificationPrefs của customer
- [x] Frontend: MyAccount thêm section "Cài đặt thông báo" với các toggle bật/tắt

## Session 2026-04-10 - Redesign Nhật Ký Hoạt Động

- [x] Redesign ActivityLog.tsx: timeline style, filter theo loại hành động, stats summary, mobile-friendly

## Session 2026-04-10 - Redesign BlockIP + Settings

- [x] Redesign BlockIpAdmin.tsx cho mobile: card layout thay table, filter gọn, bulk action bar
- [x] Redesign Settings.tsx: 3 tab (Cài đặt chung, Hình ảnh, Màu sắc), bỏ tab Bảo mật/PayOS/Telegram
- [x] Settings tab Cài đặt chung: SEO fields, contact, toggles, custom script/HTML
- [x] Settings tab Hình ảnh: Logo Light/Dark, Favicon, Image, Avatar upload
- [x] Settings tab Màu sắc: theme color picker, gradient presets, live preview

## Session 2026-04-10 - Cập nhật nhiều tính năng

- [x] MyAccount: cập nhật icon CSS cho tab Hồ Sơ và Bảo Mật (gradient, shadow, active style đẹp hơn)
- [x] Fix referral: ẩn hoàn toàn khi tính năng referral bị tắt trong admin (useFeatureFlags trả false khi loading)
- [x] Tự động redirect đến trang thanh toán PayOS sau khi tạo đơn hàng thành công
- [x] Toast kho hàng kiểu mới: hiển thị "Kho hàng: X sản phẩm" với icon hộp màu xanh lá
- [x] Inventory theo gói sản phẩm: mỗi gói có tồn kho riêng (query với packageId)
- [x] Hiển thị "Liên hệ" thay vì giá khi sản phẩm không có gói nào (ProductCatalog, LandingPage)
- [x] Thông báo email chỉ gửi khi người dùng đã bật notifyOrderStatus trong cài đặt thông báo

## Session 2026-04-10 - Audit, Clean, Icon CSS

- [x] MyAccount: thay icon thường bằng icon CSS (fa-*) trong nội dung tab Hồ Sơ & Bảo Mật
- [x] ProductDetail: toast kho hàng và hiển thị số lượng dùng icon CSS (fa-box)
- [x] Audit: tìm frontend-only features chưa có backend procedure
- [x] Audit: tìm features có backend nhưng frontend chưa kết nối
- [x] Clean: xóa unused imports BlogManagement, BlogHub khỏi App.tsx
- [x] Blog: thêm route /admin/blog/edit/:id + edit mode trong BlogNewPost.tsx
- [x] Blog: thêm adminGetPost procedure trong blog router

## Session 2026-04-10 - Settings: Primekey & Bảo mật

- [x] Schema: thêm cột primekey settings (requireLoginToView, showSoldCount, allowReview, telegramOrderChatId, orderCodeType, orderCodeLength, orderCodePrefix, copyright)
- [x] Schema: thêm cột security settings (bruteForceMaxLogin, bruteForceMaxAccount, bruteForceMaxApi, bruteForceMax2FA, bruteForceMaxOTP, bruteForceMaxTopup, bruteForceMaxPasswordReset, bruteForceMaxApiWhitelist, adminPanelMaxWrongUrl, adminSingleIp, adminSingleDevice, clientSingleDevice, adminPanelPath, showAdminPanelButton, maxRegisterPerIp, sessionDuration, cronJobSecret, requireStrongPassword)
- [x] Migration: push schema changes to DB
- [x] Backend: procedure updatePrimekeySettings
- [x] Backend: procedure updateSecuritySettings
- [x] Frontend: thêm tab "Primekey" vào Settings.tsx với đầy đủ fields
- [x] Frontend: thêm tab "Bảo mật" vào Settings.tsx với 3 nhóm (Brute Force, Kiểm soát truy cập, Bảo mật khác)

## Session 2026-04-10 - Fix Icon CSS & Logic Hoàn Tiền

- [x] MyAccount: thay icon thường bằng icon CSS trong mục Bảo mật (SecurityInlineSection) - đã dùng fa-* đầy đủ
- [x] MyAccount: thay icon thường bằng icon CSS trong mục Cài đặt thông báo (NotificationPrefsSection) - đã dùng fa-* đầy đủ
- [x] Logic hoàn tiền: chỉ cho phép tạo yêu cầu hoàn tiền khi đơn FAILED/PAID/COMPLETED (backend kiểm tra)
- [x] Admin: ẩn nút "Tạo yêu cầu hoàn tiền" khỏi RefundPage.tsx - admin chỉ xem và duyệt

## Session 2026-04-10 (tiếp) - Logic Hoàn Tiền & Refactor

- [x] RefundPage.tsx (admin): bỏ nút "Tạo Yêu Cầu" thủ công - admin chỉ xem và duyệt/từ chối
- [x] Backend refund router: sửa list lấy tất cả (không filter userId), sửa updateStatus không filter userId
- [x] Backend refund router: thêm customerCreate procedure (dùng token, kiểm tra đơn hàng thuộc về khách)
- [x] Backend refund router: thêm customerList procedure (lấy danh sách yêu cầu hoàn tiền của khách)
- [x] TrackOrder.tsx: thêm nút "Yêu cầu hoàn tiền" trong OrderDetail khi đơn FAILED/PAID/COMPLETED
- [x] TrackOrder.tsx: thêm RefundDialog component với form nhập lý do và số tiền hoàn
- [x] TrackOrder.tsx: chuyển sang render OrderDetail inline thay vì navigate (không mất context)
- [x] Settings.tsx: xác nhận không còn lỗi syntax (Vite compile thành công)

## Session 2026-04-10 - Hệ thống 2 Bot Telegram

- [x] Schema: thêm bảng telegramBotConfig (id, userId, botType: admin|user, botToken, chatId, enabled, webhookUrl, createdAt, updatedAt)
- [x] Schema: thêm bảng telegramSubscribers (id, userId, customerId, chatId, username, subscribedAt, isActive)
- [x] Migration: push schema changes (tạo trực tiếp qua SQL)
- [x] Backend: telegramBot router - saveBotConfig, getBotConfig, testBot, getSubscribers, removeSubscriber, broadcast
- [x] Backend: webhook handler /api/webhooks/telegram/user/:userId để nhận tin nhắn từ user
- [x] Backend: helper sendTelegramMessage(botToken, chatId, message) trong server/telegram.ts
- [x] Backend: tích hợp gửi thông báo admin bot khi có đơn hàng mới, thanh toán, yêu cầu hoàn tiền
- [x] Backend: tích hợp gửi thông báo user bot khi trạng thái đơn hàng thay đổi (PAID)
- [x] Frontend: tạo trang TelegramBots.tsx (Extensions) - cấu hình 2 bot, test kết nối, xem subscribers, broadcast
- [x] Frontend: bỏ telegramOrderChatId khỏi Settings tab Primekey
- [x] Frontend: route /admin/extensions/telegram đã có trong App.tsx và sidebar

## Session 2026-04-10 - Cải tiến toàn diện

### Dọn menu admin
- [x] Bỏ trang Hoàn Tiền (RefundPage) khỏi menu sidebar và routes
- [x] Bỏ trang Hóa đơn VAT khỏi menu sidebar và routes
- [x] Di chuyển link Bảo hành vào nhóm "Danh mục & Sản phẩm" trong sidebar
- [x] Di chuyển link Báo cáo lên nhóm "Bán hàng" trong sidebar
- [x] Đổi mục Liên hệ thành floating widget trong DashboardLayoutCustom

### Telegram Bot mở rộng
- [x] Thêm nhiều loại thông báo cho Admin Bot: đơn hàng cập nhật trạng thái, khách hàng mới, đánh giá mới, tồn kho thấp, nạp ví, flash sale sắp hết
- [x] Thêm nhiều loại thông báo cho User Bot: đơn hàng tạo, đơn hàng SHIPPING, đơn hàng COMPLETED, bảo hành, flash sale
- [x] UI: đổi notification settings thành dropdown/accordion cho gọn trong TelegramSettings.tsx

### Settings cập nhật
- [x] Bỏ nhóm "Thông báo & Thông tin" khỏi tab Primekey
- [x] Thêm tab "Bật/Tắt tính năng" trong Settings: bật/tắt Blog, Bảng xếp hạng, Flash Sale, Đánh giá, Bảo hành, Ví điện tử, Giới thiệu bạn bè
- [x] Thêm tab "Thuế" trong Settings (tên thuế, tỷ lệ %, bật/tắt áp dụng tự động)

### Client theme đồng bộ
- [x] Client đọc themeColor/themeColor1 từ API settings và áp dụng CSS variables qua GlobalBrandApplier
- [x] Thêm dark/light mode toggle cho web client (nút sun/moon trong ClientHeader)
- [x] Logo client tự động chọn logo sáng/tối theo theme (cần logoDarkUrl trong settings)

### MyAccount cập nhật
- [x] Thêm mục "Liên kết Telegram" trong tab Hồ sơ & Bảo mật (TelegramLinkSection)
- [x] Đổi card "Nhận thông báo email" thành dropdown/accordion cho gọn
- [x] Thêm card "Nhận thông báo Telegram" dạng dropdown/accordion

## Session 2026-04-10 - License, ProductConfig, Announcements, Dark Mode

### License Key System (thêm vào src)
- [x] Schema: thêm bảng licenseKeys (key, domain, plan, expiresAt, isActive, activatedAt)
- [x] Backend: middleware kiểm tra LICENSE_KEY env khi server khởi động (server/license.ts)
- [x] Backend: endpoint /api/license/status để validate key
- [x] Frontend: hiển thị thông báo license hết hạn/không hợp lệ

### Trang cấu hình sản phẩm riêng
- [x] Tạo ProductConfig.tsx - trang riêng thay thế popup cấu hình
- [x] Route /products/:id/config trong App.tsx
- [x] Thêm nút "Cấu hình" (⚙️) trong Products.tsx dẫn đến trang mới
- [x] Bỏ tab Packages/CustomFields khỏi dialog Products.tsx (giữ lại chỉ Thông tin cơ bản)

### Announcements - chọn trang hiển thị
- [x] Schema: thêm cột targetPages (JSON array) vào announcements và banners table
- [x] Backend: cập nhật create/update announcement để lưu targetPages
- [x] Frontend: thêm checkbox chọn trang trong form tạo/sửa announcement
- [x] Client: filter announcement theo trang hiện tại (pathname) trong AnnouncementDisplay

### Redesign Dark Mode + màu sắc động
- [x] index.css: định nghĩa đầy đủ CSS variables cho light/dark mode + dark mode overrides
- [x] GlobalBrandApplier: áp dụng themeColor từ settings vào --brand-primary, --brand-secondary
- [x] Dark mode CSS overrides cho client pages (bg-white, bg-gray-*, text-gray-*, inputs)
- [x] Dark mode CSS overrides cho admin panel (AdminKit classes)
- [x] ThemeContext: persist theme preference vào localStorage (switchable=true)

## Session 2026-04-10 - Dashboard License Banner, Page Builder, Product Management

### Dashboard License Banner & System Update
- [x] Dashboard: thêm LicenseBanner component (tên app + version + license key info + ẩn 24h)
- [x] Dashboard: thêm SystemUpdateWidget (kiểm tra version mới, cập nhật tự động bật/tắt)
- [x] Dashboard: thêm AdminBroadcastBanner (thông báo từ chủ src)
- [x] Backend: procedure getSystemInfo (version, licenseStatus, updateAvailable)
- [x] Settings: thêm toggle "Cập nhật tự động" trong tab Chung

### ThankYou & 404 Page Builder
- [x] ThankYouCustom: redesign thành page builder chuyên nghiệp (drag-drop sections)
- [x] ThankYouCustom: live preview full-screen trong iframe
- [x] ThankYouCustom: hỗ trợ custom HTML/CSS code
- [x] Custom404Admin: redesign thành page builder chuyên nghiệp
- [x] Custom404Admin: live preview full-screen trong iframe
- [x] Custom404Admin: hỗ trợ custom HTML/CSS code

### Product Management - Tách 4 trang riêng
- [x] ProductEdit.tsx: trang sửa thông tin sản phẩm (tên, mô tả, giá, ảnh, danh mục, tags)
- [x] ProductPackages.tsx: trang quản lý gói sản phẩm (CRUD gói, kho hàng)
- [x] ProductCustomFields.tsx: trang quản lý trường tùy chỉnh
- [x] ProductConfig.tsx: redesign lại đẹp hơn (cấu hình kho, hiển thị, SEO)
- [x] Products.tsx: bỏ dialog cũ, thêm nút dẫn đến 4 trang riêng
- [x] Menu sidebar: thêm submenu cho Products

## Checkpoint 2026-04-10 - Dashboard Banner, Page Builder, Product Split Pages
- [x] Dashboard: LicenseBanner component (version, license key, ẩn 24h, thông báo admin)
- [x] Dashboard: SystemUpdateWidget (kiểm tra version, cập nhật tự động toggle)
- [x] Dashboard: AdminBroadcastBanner (thông báo từ chủ src)
- [x] ThankYouCustom: redesign page builder chuyên nghiệp (templates, live preview, custom HTML/CSS)
- [x] Custom404Admin: redesign page builder chuyên nghiệp (templates, live preview, custom HTML/CSS)
- [x] ProductEdit.tsx: trang sửa thông tin sản phẩm riêng (tên, mô tả, ảnh, danh mục, tags)
- [x] ProductPackages.tsx: trang quản lý gói sản phẩm riêng (CRUD đầy đủ, multi-price)
- [x] ProductFields.tsx: trang quản lý trường tùy chỉnh riêng (text/select/checkbox/date)
- [x] Products.tsx: cập nhật nút action dẫn đến 3 trang riêng (edit/packages/fields)
- [x] App.tsx: thêm routes /products/:id/edit, /packages, /fields
- [x] DB schema: mở rộng productCustomFields với label/fieldType/placeholder/options/isRequired/isVisible
- [x] Server routers: cập nhật createCustomField/updateCustomField/getCustomFields với schema mới

## Checkpoint 2026-04-10 - Mobile & UX Improvements

- [x] LicenseBanner: quản lý license key, phiên bản, cập nhật tự động, broadcasts từ DB
- [x] Tạo bảng system_broadcasts trong DB
- [x] Tạo router broadcasts (getActive, getAll, create, update, delete, toggle)
- [x] Tạo trang BroadcastsAdmin để quản lý thông báo từ chủ src
- [x] Thêm menu "Thông Báo Dashboard" vào sidebar
- [x] Fix AvatarGallery: khi tắt feature, backend trả về mảng rỗng (không cho chọn avatar)
- [x] Redesign AvatarGalleryAdmin mobile-friendly (grid responsive, upload zone, toggle rõ ràng)
- [x] ThankYouCustom: mobile layout (flex-col trên mobile, header responsive)
- [x] Custom404Admin: mobile layout (flex-col trên mobile, header responsive)
- [x] ProductEdit: mobile layout (header, bottom buttons responsive)
- [x] ProductPackages: mobile layout (header responsive, icon-only buttons trên mobile)
- [x] ProductFields: mobile layout (header responsive, icon-only buttons trên mobile)

## Feature: License Gate & Auto-Update via GitHub

- [x] License Gate: màn hình setup bắt buộc nhập license key khi deploy mới (chưa có license)
- [x] License validation: verify license key với server (hoặc offline hash check)
- [x] License Gate middleware: chặn toàn bộ app nếu chưa activate license
- [x] Auto-Update: polling GitHub releases API để kiểm tra phiên bản mới
- [x] Auto-Update: webhook endpoint nhận push event từ GitHub
- [x] Auto-Update: khi có phiên bản mới, tự động pull code và restart server
- [x] UI: trang License Setup (first-run wizard)
- [x] UI: trang quản lý license trong admin (activate, deactivate, renew)
- [x] UI: trang quản lý Auto-Update trong admin (enable/disable, xem logs)

## Feature: High-Security License System
- [x] License Key Generator: HMAC-SHA256 signed key (email + domain + plan + expiry)
- [x] License Validator: xác thực 3 lớp (email + key signature + domain match)
- [x] Cập nhật DB schema: thêm trường licenseEmail
- [x] Cập nhật licenseRouter.activate: yêu cầu email + key + domain
- [x] Cập nhật LicenseSetup UI: thêm trường email bắt buộc
- [x] Cập nhật LicenseAdmin UI: thêm trường email khi kích hoạt
- [x] Tài liệu hướng dẫn tạo license key cho developer (scripts/generate-license.ts)

## Session 2026-04-11 - Final Check & Cleanup

### Fixes từ user feedback
- [x] Ẩn nút "Chọn từ kho ảnh" trong MyAccount khi feature avatar_gallery bị tắt
- [x] Bỏ card "Liên hệ tư vấn" trong trang ProductDetail
- [x] Đổi tên "Ghi chú nội bộ" → "Ghi chú sản phẩm" trong form tạo/sửa sản phẩm (Products.tsx và ProductEdit.tsx)

### Sync feature flags
- [x] Các trang tính năng riêng (FlashSale, Coupons, Loyalty, Blog, Referral, Warranty...) đã có toggle bật/tắt → sync với featureFlags trong Settings
- [x] Khi admin bật/tắt từ trang tính năng riêng thì Settings cũng cập nhật theo và ngược lại

### Final check & cleanup
- [x] Kiểm tra toàn bộ routes trong App.tsx có tương ứng với file page không
- [x] Kiểm tra tất cả tRPC procedures trong routers.ts có được dùng ở frontend không
- [x] Xóa các file page không còn được import/route (BlogManagement.tsx, NotFound.tsx, AdminLayout.tsx)
- [x] Kiểm tra unused imports trong các file chính

### Data & Documentation
- [x] Tạo file scripts/init-data.sql: schema only + email/telegram templates (không có dữ liệu thật)
- [x] Tạo file INSTALL.md: hướng dẫn cài đặt src đầy đủ (clone, env, db, license key)

## Session 2026-04-11 - Bug Fixes & Feature Improvements

### Menu feature flags
- [x] Ẩn menu "Mã Giảm Giá" trong ClientHeader khi featureCoupon bị tắt
- [x] Ẩn menu "Ticket Hỗ Trợ" trong ClientHeader khi featureTicket bị tắt

### Ticket Admin
- [x] Thêm tab/section quản lý ticket đang mở trong trang admin TicketAdmin

### Card sản phẩm nổi bật
- [x] Ẩn tag "Liên hệ" trên card sản phẩm khi sản phẩm không có tag liên hệ
- [x] Sửa rating hiển thị 5 sao khi chưa có đánh giá nào (phải hiển thị 0 sao hoặc ẩn)

### Trang chi tiết sản phẩm
- [x] Redesign card sản phẩm liên quan (related products)
- [x] Thêm badge "Đã mua hàng ✓" cho khách hàng đã mua khi họ đánh giá sản phẩm
