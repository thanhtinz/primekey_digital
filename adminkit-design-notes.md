# AdminKit Design System Notes

## Visual Style
- **Sidebar**: Dark navy/dark blue-gray (#293042 or similar), white text, icons + labels
- **Header**: White/light, thin border-bottom, user avatar top-right, notification bell
- **Background**: Light gray (#f5f7fb), white cards
- **Primary color**: Blue (#3b7ddd or similar)
- **Cards**: White, subtle shadow, rounded corners (0.25rem)
- **Typography**: Clean sans-serif, section headers in gray
- **Tables**: Striped or bordered, compact
- **Sidebar groups**: "Pages" label, "Tools & Components" label as section dividers
- **Active menu item**: Highlighted with primary blue, left border accent

## Layout
- Left sidebar (fixed, ~220px wide)
- Top header bar (fixed)
- Main content area with padding
- Footer at bottom

## Admin Pages to Keep (merged/cleaned):
1. Dashboard (overview stats)
2. Đơn hàng (orders/invoices list)
3. Sản phẩm (products management)
4. Khách hàng (customers)
5. Quản lý ví (wallet management)
6. Báo cáo (reports)
7. Blog (blog management)
8. Mã giảm giá (coupons)
9. Flash Sale
10. Bảo hành (warranty management)
11. Đánh giá (feedbacks/reviews)
12. Giới thiệu - Hoa hồng (referral + withdrawals)
13. Thông báo (notifications + announcements)
14. Nhân viên (staff)
15. Cài đặt (settings - merged all sub-settings)
16. Nhật ký hoạt động (activity log)
17. Quản lý bảo hành yêu cầu

## Pages to Remove/Merge:
- EmbedWidget (niche, rarely used)
- DataBackup (merge into settings)
- AdvancedSearch (merge into customers/orders)
- WeeklyReports (merge into reports)
- RecurringInvoices (merge into invoices)
- Reminders (merge into settings or orders)
- EmailCampaigns (merge into settings/marketing)
- AvatarGalleryAdmin (merge into settings)
- SpinWheelAdmin (merge into settings/loyalty)
- LoyaltyRewardsAdmin (merge into settings/loyalty)
- ImportExcel (merge into products/customers)
- VATInvoicePage + TaxReportPage (merge into reports)
