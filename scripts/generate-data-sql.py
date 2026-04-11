#!/usr/bin/env python3
"""
Script tạo file data.sql từ tất cả migration files.
File data.sql chỉ chứa CREATE TABLE statements (không có dữ liệu),
cộng với các INSERT mẫu cho email templates và telegram notification templates.
"""
import os
import re
import glob

DRIZZLE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "drizzle")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data.sql")

def extract_create_statements(sql_content):
    """Trích xuất tất cả CREATE TABLE và ALTER TABLE statements."""
    # Remove drizzle statement-breakpoint comments
    sql_content = sql_content.replace("--> statement-breakpoint", "")
    
    # Split by semicolon to get individual statements
    statements = []
    for stmt in sql_content.split(";"):
        stmt = stmt.strip()
        if not stmt:
            continue
        # Only keep CREATE TABLE and ALTER TABLE
        if stmt.upper().startswith("CREATE TABLE") or stmt.upper().startswith("ALTER TABLE"):
            statements.append(stmt + ";")
    return statements

def main():
    # Get all migration files sorted
    migration_files = sorted(glob.glob(os.path.join(DRIZZLE_DIR, "*.sql")))
    
    all_statements = []
    seen_tables = set()
    
    for filepath in migration_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        stmts = extract_create_statements(content)
        for stmt in stmts:
            # Extract table name to avoid duplicates
            match = re.search(r"CREATE TABLE\s+[`\"]?(\w+)[`\"]?", stmt, re.IGNORECASE)
            if match:
                table_name = match.group(1)
                if table_name not in seen_tables:
                    seen_tables.add(table_name)
                    all_statements.append(stmt)
            else:
                # ALTER TABLE - always include
                all_statements.append(stmt)
    
    # Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- ============================================================\n")
        f.write("-- PayOS Invoice Tool - Database Schema\n")
        f.write("-- Chỉ chứa cấu trúc bảng (không có dữ liệu người dùng)\n")
        f.write("-- Tạo tự động từ Drizzle migrations\n")
        f.write("-- ============================================================\n\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
        
        for stmt in all_statements:
            f.write(stmt + "\n\n")
        
        # Add email templates
        f.write("-- ============================================================\n")
        f.write("-- Email Templates mẫu (cần thay userId = 1 bằng userId thực)\n")
        f.write("-- ============================================================\n\n")
        f.write("""INSERT INTO `emailTemplates` (`userId`, `type`, `subject`, `htmlBody`, `isActive`) VALUES
(1, 'CREATED', 'Đơn hàng #{{orderCode}} đã được tạo', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Xác nhận đơn hàng</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được tạo thành công.</p><p><strong>Tổng tiền:</strong> {{totalAmount}}</p><p><strong>Trạng thái:</strong> Chờ thanh toán</p><p>Vui lòng thanh toán để hoàn tất đơn hàng.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'PAID', 'Đơn hàng #{{orderCode}} đã được thanh toán', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#34a853">Thanh toán thành công</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> đã được thanh toán thành công.</p><p><strong>Tổng tiền:</strong> {{totalAmount}}</p><p>Chúng tôi sẽ xử lý và giao hàng cho bạn sớm nhất có thể.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'SHIPPING', 'Đơn hàng #{{orderCode}} đang được giao', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#ff6d00">Đơn hàng đang giao</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> đang được xử lý/giao đến bạn.</p><p>Vui lòng kiểm tra email hoặc liên hệ hỗ trợ nếu cần thêm thông tin.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'WARRANTY', 'Thông tin bảo hành đơn hàng #{{orderCode}}', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Thông tin bảo hành</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Đơn hàng <strong>#{{orderCode}}</strong> của bạn đã được kích hoạt bảo hành.</p><p>Mã bảo hành: <strong>{{warrantyCode}}</strong></p><p>Thời hạn bảo hành: {{warrantyExpiry}}</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1),
(1, 'REVIEW', 'Đánh giá sản phẩm từ đơn hàng #{{orderCode}}', '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:30px"><h2 style="color:#1a73e8">Đánh giá sản phẩm</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi!</p><p>Vui lòng dành ít phút để đánh giá sản phẩm từ đơn hàng <strong>#{{orderCode}}</strong>.</p><p>Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và giúp khách hàng khác đưa ra quyết định tốt hơn.</p><hr><p style="color:#888;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p></div></body></html>', 1);
""")
        
        f.write("\n-- ============================================================\n")
        f.write("-- Feature Flags mặc định\n")
        f.write("-- ============================================================\n\n")
        f.write("""INSERT INTO `feature_flags` (`userId`, `key`, `enabled`, `label`, `description`) VALUES
(1, 'points', 0, 'Tích Điểm', 'Hệ thống tích điểm khách hàng'),
(1, 'warranty', 1, 'Bảo Hành', 'Quản lý bảo hành sản phẩm'),
(1, 'referral', 0, 'Giới Thiệu', 'Chương trình giới thiệu khách hàng'),
(1, 'flash_sale', 0, 'Flash Sale', 'Chương trình flash sale'),
(1, 'wishlist', 1, 'Yêu Thích', 'Danh sách sản phẩm yêu thích'),
(1, 'leaderboard', 1, 'Bảng Xếp Hạng', 'Bảng xếp hạng khách hàng'),
(1, 'blog', 1, 'Blog', 'Trang blog tin tức'),
(1, 'coupon', 0, 'Mã Giảm Giá', 'Hệ thống mã giảm giá'),
(1, 'wallet', 1, 'Ví Điện Tử', 'Ví điện tử và nạp tiền'),
(1, 'review', 1, 'Đánh Giá', 'Đánh giá sản phẩm'),
(1, 'spin_wheel', 0, 'Vòng Quay', 'Vòng quay may mắn'),
(1, 'ticket', 1, 'Ticket Hỗ Trợ', 'Hệ thống ticket hỗ trợ'),
(1, 'cart', 1, 'Giỏ Hàng', 'Giỏ hàng mua sắm'),
(1, 'compare', 0, 'So Sánh', 'So sánh sản phẩm');
""")
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
    
    print(f"✅ Đã tạo file: {OUTPUT_FILE}")
    print(f"   Tổng số bảng: {len(seen_tables)}")
    print(f"   Tổng số statements: {len(all_statements)}")

if __name__ == "__main__":
    main()
