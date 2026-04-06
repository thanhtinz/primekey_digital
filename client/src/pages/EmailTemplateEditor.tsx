import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff, Mail, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

type EmailType = "CREATED" | "PAID" | "SHIPPING" | "WARRANTY" | "REVIEW";

const EMAIL_TYPES: { value: EmailType; label: string; color: string; desc: string }[] = [
  { value: "CREATED", label: "Tạo Đơn", color: "bg-blue-100 text-blue-700", desc: "Gửi khi tạo đơn hàng mới" },
  { value: "PAID", label: "Thanh Toán", color: "bg-green-100 text-green-700", desc: "Gửi khi đơn được thanh toán" },
  { value: "SHIPPING", label: "Giao Hàng", color: "bg-orange-100 text-orange-700", desc: "Gửi khi đơn đang giao" },
  { value: "WARRANTY", label: "Bảo Hành", color: "bg-purple-100 text-purple-700", desc: "Gửi khi đơn vào bảo hành" },
  { value: "REVIEW", label: "Đánh Giá", color: "bg-yellow-100 text-yellow-700", desc: "Link đánh giá sản phẩm" },
];

const VARIABLES = [
  { key: "{{customerName}}", desc: "Tên khách hàng" },
  { key: "{{invoiceNumber}}", desc: "Số hóa đơn" },
  { key: "{{totalAmount}}", desc: "Tổng tiền" },
  { key: "{{status}}", desc: "Trạng thái đơn" },
  { key: "{{trackUrl}}", desc: "Link tra cứu đơn" },
  { key: "{{reviewUrl}}", desc: "Link đánh giá (WARRANTY)" },
  { key: "{{companyName}}", desc: "Tên công ty" },
];

const DEFAULT_TEMPLATES: Record<EmailType, { subject: string; htmlBody: string }> = {
  CREATED: {
    subject: "Xác nhận đơn hàng {{invoiceNumber}} - {{companyName}}",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#1e40af;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">{{companyName}}</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px">Xác Nhận Đơn Hàng</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:16px;color:#111827">Xin chào <strong>{{customerName}}</strong>,</p>
    <p style="color:#4b5563">Đơn hàng <strong>{{invoiceNumber}}</strong> của bạn đã được tạo thành công.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #3b82f6">
      <p style="margin:0;color:#374151"><strong>Tổng tiền:</strong> {{totalAmount}}</p>
      <p style="margin:4px 0 0;color:#374151"><strong>Trạng thái:</strong> Chờ thanh toán</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="{{trackUrl}}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Theo Dõi Đơn Hàng</a>
    </div>
    <p style="color:#6b7280;font-size:13px">Nếu có thắc mắc, vui lòng liên hệ chúng tôi.</p>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    © {{companyName}} | Cảm ơn bạn đã mua hàng!
  </div>
</div>`,
  },
  PAID: {
    subject: "Thanh toán thành công đơn {{invoiceNumber}} - {{companyName}}",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#16a34a;padding:24px;text-align:center">
    <div style="font-size:40px">✅</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Thanh Toán Thành Công!</h1>
  </div>
  <div style="padding:24px">
    <p style="font-size:16px;color:#111827">Xin chào <strong>{{customerName}}</strong>,</p>
    <p style="color:#4b5563">Chúng tôi đã nhận được thanh toán cho đơn hàng <strong>{{invoiceNumber}}</strong>.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #16a34a">
      <p style="margin:0;color:#374151"><strong>Số tiền:</strong> {{totalAmount}}</p>
      <p style="margin:4px 0 0;color:#374151"><strong>Trạng thái:</strong> Đã thanh toán</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="{{trackUrl}}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Theo Dõi Đơn Hàng</a>
    </div>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    © {{companyName}} | Cảm ơn bạn đã tin tưởng chúng tôi!
  </div>
</div>`,
  },
  SHIPPING: {
    subject: "Đơn hàng {{invoiceNumber}} đang được giao - {{companyName}}",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#ea580c;padding:24px;text-align:center">
    <div style="font-size:40px">🚚</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Đơn Hàng Đang Giao!</h1>
  </div>
  <div style="padding:24px">
    <p style="font-size:16px;color:#111827">Xin chào <strong>{{customerName}}</strong>,</p>
    <p style="color:#4b5563">Đơn hàng <strong>{{invoiceNumber}}</strong> của bạn đang trên đường giao đến bạn.</p>
    <div style="background:#fff7ed;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #ea580c">
      <p style="margin:0;color:#374151"><strong>Trạng thái:</strong> Đang giao hàng</p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="{{trackUrl}}" style="background:#ea580c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Theo Dõi Đơn Hàng</a>
    </div>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    © {{companyName}}
  </div>
</div>`,
  },
  WARRANTY: {
    subject: "Đơn hàng {{invoiceNumber}} - Chế độ bảo hành - {{companyName}}",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#7c3aed;padding:24px;text-align:center">
    <div style="font-size:40px">🛡️</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Bảo Hành Kích Hoạt!</h1>
  </div>
  <div style="padding:24px">
    <p style="font-size:16px;color:#111827">Xin chào <strong>{{customerName}}</strong>,</p>
    <p style="color:#4b5563">Đơn hàng <strong>{{invoiceNumber}}</strong> của bạn đã vào chế độ bảo hành.</p>
    <div style="background:#faf5ff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #7c3aed">
      <p style="margin:0;color:#374151"><strong>Trạng thái:</strong> Đang bảo hành</p>
    </div>
    <p style="color:#4b5563">Bạn có muốn để lại đánh giá về sản phẩm không? Ý kiến của bạn rất quan trọng với chúng tôi!</p>
    <div style="text-align:center;margin:24px 0">
      <a href="{{reviewUrl}}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">⭐ Đánh Giá Ngay</a>
    </div>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    © {{companyName}} | Cảm ơn bạn đã tin tưởng!
  </div>
</div>`,
  },
  REVIEW: {
    subject: "Đánh giá sản phẩm đơn hàng {{invoiceNumber}} - {{companyName}}",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#d97706;padding:24px;text-align:center">
    <div style="font-size:40px">⭐</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:22px">Đánh Giá Sản Phẩm</h1>
  </div>
  <div style="padding:24px">
    <p style="font-size:16px;color:#111827">Xin chào <strong>{{customerName}}</strong>,</p>
    <p style="color:#4b5563">Cảm ơn bạn đã mua hàng tại <strong>{{companyName}}</strong>. Hãy chia sẻ trải nghiệm của bạn!</p>
    <div style="text-align:center;margin:24px 0">
      <a href="{{reviewUrl}}" style="background:#d97706;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">⭐ Viết Đánh Giá</a>
    </div>
    <p style="color:#6b7280;font-size:13px;text-align:center">Chỉ mất 1 phút để giúp chúng tôi cải thiện dịch vụ!</p>
  </div>
  <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    © {{companyName}}
  </div>
</div>`,
  },
};

export default function EmailTemplateEditor() {
  const [selectedType, setSelectedType] = useState<EmailType>("CREATED");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showVars, setShowVars] = useState(false);

  const { data: existing, isLoading, refetch } = trpc.emailTemplates.get.useQuery({ type: selectedType });
  const upsertMutation = trpc.emailTemplates.upsert.useMutation({
    onSuccess: () => { toast.success("Đã lưu mẫu email!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (existing) {
      setSubject(existing.subject);
      setHtmlBody(existing.htmlBody);
    } else {
      setSubject(DEFAULT_TEMPLATES[selectedType].subject);
      setHtmlBody(DEFAULT_TEMPLATES[selectedType].htmlBody);
    }
  }, [existing, selectedType]);

  const handleSave = () => {
    upsertMutation.mutate({ type: selectedType, subject, htmlBody });
  };

  const handleReset = () => {
    setSubject(DEFAULT_TEMPLATES[selectedType].subject);
    setHtmlBody(DEFAULT_TEMPLATES[selectedType].htmlBody);
    toast.info("Đã khôi phục mẫu mặc định");
  };

  const insertVar = (v: string) => {
    setHtmlBody(prev => prev + v);
  };

  const previewHtml = htmlBody
    .replace(/{{customerName}}/g, "Nguyễn Văn A")
    .replace(/{{invoiceNumber}}/g, "HD-2024-0001")
    .replace(/{{totalAmount}}/g, "2.200.000 đ")
    .replace(/{{status}}/g, "Đang xử lý")
    .replace(/{{trackUrl}}/g, "#")
    .replace(/{{reviewUrl}}/g, "#")
    .replace(/{{companyName}}/g, "Công Ty TNHH ABC");

  const currentType = EMAIL_TYPES.find(t => t.value === selectedType)!;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Mẫu Email
            </h1>
            <p className="text-sm text-muted-foreground">Chỉnh sửa nội dung email gửi tự động cho khách hàng</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVars(!showVars)}>
              <Info className="w-4 h-4 mr-1.5" />
              Biến
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
              {showPreview ? "Ẩn Preview" : "Xem Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Mặc định
            </Button>
            <Button size="sm" onClick={handleSave} disabled={upsertMutation.isPending}>
              <Save className="w-4 h-4 mr-1.5" />
              {upsertMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>

        {/* Variables hint */}
        {showVars && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Biến có thể dùng trong nội dung email (click để chèn):</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <button
                  key={v.key}
                  onClick={() => insertVar(v.key)}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 transition-colors font-mono"
                  title={v.desc}
                >
                  {v.key} <span className="text-muted-foreground font-sans">— {v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type Selector */}
        <div className="flex gap-2 flex-wrap">
          {EMAIL_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selectedType === t.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Info bar */}
        <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${currentType.color}`}>
          <Mail className="w-4 h-4" />
          <span><strong>{currentType.label}:</strong> {currentType.desc}</span>
          {existing && <Badge variant="outline" className="ml-auto text-xs">Đã tùy chỉnh</Badge>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">Đang tải...</div>
        ) : (
          <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* Editor */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tiêu đề email (Subject)</Label>
                <Input
                  className="mt-1"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Nhập tiêu đề email..."
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nội dung HTML</Label>
                <textarea
                  value={htmlBody}
                  onChange={e => setHtmlBody(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-xs font-mono bg-background resize-y"
                  style={{ minHeight: "420px" }}
                  placeholder="<div>Nội dung email HTML...</div>"
                  spellCheck={false}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Chỉnh sửa HTML trực tiếp. Dùng các biến như <code className="bg-muted px-1 rounded">{"{{customerName}}"}</code> để tự động điền thông tin.
              </p>
            </div>

            {/* Preview */}
            {showPreview && (
              <div>
                <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-t-lg border border-b-0 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Live Preview (dữ liệu mẫu)</span>
                </div>
                <div className="border border-t-0 rounded-b-lg overflow-hidden bg-gray-50 dark:bg-gray-900" style={{ minHeight: "460px" }}>
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><body style="margin:0;padding:16px;background:#f3f4f6">${previewHtml}</body></html>`}
                    className="w-full border-0"
                    style={{ minHeight: "460px" }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
