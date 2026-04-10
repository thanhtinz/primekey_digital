# So sánh Layout ProductDetail

## Website tham khảo (divineshop.net)

### Layout chính:
- **Trái**: Product image (square, medium size)
- **Giữa**: Package list (grid 2-3 cột, card style)
  - Mỗi card có: thumbnail + title + "Order" button
  - Có checkbox để select package
  - Dashed border (border-dashed)
  - Hover effect
- **Phải**: Order info (sticky)
  - Quantity selector (- 1 +)
  - "Thông tin Order" header
  - Coupon code input
  - Total price
  - Action buttons

### Package card style:
- Grid layout (2-3 cột)
- Dashed border (border-2 border-dashed)
- Horizontal layout: thumbnail (left) + info (center) + price/button (right)
- Checkbox để select
- "Order" button trong card

### Order info card (right sidebar):
- Sticky top
- Quantity selector (- 1 +)
- Coupon toggle
- Total price display
- "Đăng nhập để mua" button

## Hiện tại (payos-invoice-tool):
- ✅ Grid 2 cột cho package list
- ✅ Vertical layout (image trên, info giữa, price dưới)
- ✅ Sticky order info card
- ❌ Chưa có quantity selector
- ❌ Package card chưa có checkbox
- ❌ Package card chưa có dashed border

## Cần sửa:
1. Thêm quantity selector vào order info card
2. Thêm checkbox vào package card (select package)
3. Đổi border từ solid sang dashed
4. Thêm "Order" button vào package card hoặc order info
