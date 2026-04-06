import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Eye, EyeOff, Building2, Palette, Layout, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const FONT_OPTIONS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Courier New"];

const DEFAULT_TEMPLATE = {
  name: "Mẫu Chuẩn",
  companyName: "Công Ty TNHH ABC",
  companyAddress: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  companyPhone: "0123 456 789",
  companyEmail: "info@congtyabc.vn",
  companyTaxCode: "0123456789",
  logo: "",
  invoiceTitle: "HÓA ĐƠN BÁN HÀNG",
  footer: "Cảm ơn quý khách đã mua hàng! Mọi thắc mắc xin liên hệ hotline.",
  headerColor: "#1e40af",
  accentColor: "#3b82f6",
  textColor: "#111827",
  bgColor: "#ffffff",
  fontFamily: "Arial",
  showLogo: true,
  showTaxCode: true,
  showBankInfo: false,
  bankInfo: "",
  notes: "",
  isDefault: false,
};

function InvoicePreview({ data }: { data: typeof DEFAULT_TEMPLATE }) {
  const sampleItems = [
    { name: "Sản phẩm A", qty: 2, price: 500000, total: 1000000 },
    { name: "Dịch vụ B", qty: 1, price: 750000, total: 750000 },
    { name: "Phụ kiện C", qty: 3, price: 150000, total: 450000 },
  ];
  const subtotal = sampleItems.reduce((s, i) => s + i.total, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  return (
    <div style={{ fontFamily: data.fontFamily, color: data.textColor, backgroundColor: data.bgColor, fontSize: "12px", lineHeight: "1.5" }} className="w-full shadow-lg border rounded-lg overflow-hidden">
      <div style={{ backgroundColor: data.headerColor, color: "#fff", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {data.showLogo && data.logo ? (
              <img src={data.logo} alt="Logo" style={{ height: "48px", marginBottom: "8px" }} />
            ) : (
              <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
                {data.companyName.charAt(0)}
              </div>
            )}
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>{data.companyName}</div>
            <div style={{ opacity: 0.85, fontSize: "11px", marginTop: "2px" }}>{data.companyAddress}</div>
            <div style={{ opacity: 0.85, fontSize: "11px" }}>ĐT: {data.companyPhone} | Email: {data.companyEmail}</div>
            {data.showTaxCode && <div style={{ opacity: 0.85, fontSize: "11px" }}>MST: {data.companyTaxCode}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}>{data.invoiceTitle}</div>
            <div style={{ opacity: 0.85, fontSize: "11px", marginTop: "4px" }}>Số: HD-2024-0001</div>
            <div style={{ opacity: 0.85, fontSize: "11px" }}>Ngày: {new Date().toLocaleDateString("vi-VN")}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderBottom: `2px solid ${data.accentColor}20` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontWeight: "600", color: data.accentColor, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>Thông Tin Khách Hàng</div>
            <div style={{ fontWeight: "600" }}>Nguyễn Văn A</div>
            <div style={{ color: "#6b7280", fontSize: "11px" }}>email@example.com</div>
            <div style={{ color: "#6b7280", fontSize: "11px" }}>0987 654 321</div>
          </div>
          <div>
            <div style={{ fontWeight: "600", color: data.accentColor, fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>Trạng Thái</div>
            <span style={{ padding: "2px 8px", borderRadius: "12px", backgroundColor: "#fef3c7", color: "#92400e", fontSize: "10px", fontWeight: "600" }}>Chờ thanh toán</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: data.accentColor + "15" }}>
              <th style={{ padding: "8px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Sản phẩm</th>
              <th style={{ padding: "8px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>SL</th>
              <th style={{ padding: "8px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Đơn giá</th>
              <th style={{ padding: "8px", textAlign: "right", fontSize: "11px", fontWeight: "600", color: data.accentColor, borderBottom: `2px solid ${data.accentColor}` }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {sampleItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px" }}>{item.name}</td>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.qty}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{fmt(item.price)}</td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: "500" }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 24px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "220px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: "#6b7280" }}>Tạm tính:</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: "#6b7280" }}>Thuế (10%):</span><span>{fmt(tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${data.accentColor}`, marginTop: "4px", fontWeight: "bold", fontSize: "14px" }}>
            <span style={{ color: data.accentColor }}>Tổng cộng:</span>
            <span style={{ color: data.accentColor }}>{fmt(total)}</span>
          </div>
        </div>
      </div>
      {data.showBankInfo && data.bankInfo && (
        <div style={{ padding: "12px 24px", backgroundColor: data.accentColor + "08", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: "600", fontSize: "11px", color: data.accentColor, marginBottom: "4px" }}>THÔNG TIN CHUYỂN KHOẢN</div>
          <div style={{ fontSize: "11px", whiteSpace: "pre-line" }}>{data.bankInfo}</div>
        </div>
      )}
      {data.notes && (
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: "600", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>GHI CHÚ</div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>{data.notes}</div>
        </div>
      )}
      <div style={{ backgroundColor: "#f9fafb", padding: "12px 24px", borderTop: "1px solid #e5e7eb", textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
        {data.footer}
      </div>
    </div>
  );
}

export default function EditInvoiceTemplate() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const templateId = params?.id ? parseInt(params.id as string) : null;
  const [data, setData] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("company");

  const { data: existing, isLoading } = trpc.invoiceTemplates.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );
  const utils = trpc.useUtils();
  const updateMutation = trpc.invoiceTemplates2.update.useMutation({
    onSuccess: () => { toast.success("Đã lưu mẫu hóa đơn!"); utils.invoiceTemplates.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (existing) {
      setData({
        name: existing.name || DEFAULT_TEMPLATE.name,
        companyName: existing.companyName || DEFAULT_TEMPLATE.companyName,
        companyAddress: existing.companyAddress || DEFAULT_TEMPLATE.companyAddress,
        companyPhone: existing.companyPhone || DEFAULT_TEMPLATE.companyPhone,
        companyEmail: existing.companyEmail || DEFAULT_TEMPLATE.companyEmail,
        companyTaxCode: existing.companyTaxCode || DEFAULT_TEMPLATE.companyTaxCode,
        logo: existing.logo || "",
        invoiceTitle: existing.invoiceTitle || DEFAULT_TEMPLATE.invoiceTitle,
        footer: existing.footer || DEFAULT_TEMPLATE.footer,
        headerColor: (existing as any).headerColor || DEFAULT_TEMPLATE.headerColor,
        accentColor: (existing as any).accentColor || DEFAULT_TEMPLATE.accentColor,
        textColor: (existing as any).textColor || DEFAULT_TEMPLATE.textColor,
        bgColor: (existing as any).bgColor || DEFAULT_TEMPLATE.bgColor,
        fontFamily: (existing as any).fontFamily || DEFAULT_TEMPLATE.fontFamily,
        showLogo: (existing as any).showLogo !== false,
        showTaxCode: (existing as any).showTaxCode !== false,
        showBankInfo: (existing as any).showBankInfo || false,
        bankInfo: (existing as any).bankInfo || "",
        notes: (existing as any).notes || "",
        isDefault: existing.isDefault || false,
      });
    }
  }, [existing]);

  const set = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = () => {
    if (!templateId) return;
    updateMutation.mutate({ id: templateId, ...data });
  };

  const ColorField = ({ label, field }: { label: string; field: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <input type="color" value={(data as any)[field]} onChange={e => set(field, e.target.value)} className="w-10 h-9 rounded border cursor-pointer p-0.5" />
        <Input value={(data as any)[field]} onChange={e => set(field, e.target.value)} className="font-mono text-sm" placeholder="#000000" />
      </div>
    </div>
  );

  const Section = ({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) => (
    <div className="border rounded-lg overflow-hidden">
      <button className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors" onClick={() => setActiveSection(activeSection === id ? "" : id)}>
        <div className="flex items-center gap-2 font-medium text-sm"><Icon className="w-4 h-4 text-primary" />{title}</div>
        {activeSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {activeSection === id && <div className="p-4 space-y-3 border-t">{children}</div>}
    </div>
  );

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Đang tải...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/templates")}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
              <h1 className="text-xl font-bold">Chỉnh Sửa Mẫu Hóa Đơn</h1>
              <p className="text-sm text-muted-foreground">{data.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
              {showPreview ? "Ẩn Preview" : "Xem Preview"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-1.5" />
              {updateMutation.isPending ? "Đang lưu..." : "Lưu Mẫu"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-[380px_1fr]" : "grid-cols-1 max-w-lg"}`}>
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="border rounded-lg p-4 space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tên Mẫu</Label>
              <Input value={data.name} onChange={e => set("name", e.target.value)} placeholder="Tên mẫu hóa đơn" />
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="isDefault" checked={data.isDefault} onChange={e => set("isDefault", e.target.checked)} className="rounded" />
                <Label htmlFor="isDefault" className="text-sm cursor-pointer">Đặt làm mẫu mặc định</Label>
              </div>
            </div>

            <Section id="company" icon={Building2} title="Thông Tin Công Ty">
              <div><Label className="text-xs">Tên công ty</Label><Input className="mt-1" value={data.companyName} onChange={e => set("companyName", e.target.value)} /></div>
              <div><Label className="text-xs">Địa chỉ</Label><Input className="mt-1" value={data.companyAddress} onChange={e => set("companyAddress", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Điện thoại</Label><Input className="mt-1" value={data.companyPhone} onChange={e => set("companyPhone", e.target.value)} /></div>
                <div><Label className="text-xs">Email</Label><Input className="mt-1" value={data.companyEmail} onChange={e => set("companyEmail", e.target.value)} /></div>
              </div>
              <div><Label className="text-xs">Mã số thuế</Label><Input className="mt-1" value={data.companyTaxCode} onChange={e => set("companyTaxCode", e.target.value)} /></div>
              <div><Label className="text-xs">URL Logo</Label><Input className="mt-1" value={data.logo} onChange={e => set("logo", e.target.value)} placeholder="https://..." /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="showLogo" checked={data.showLogo} onChange={e => set("showLogo", e.target.checked)} /><Label htmlFor="showLogo" className="text-sm cursor-pointer">Hiển thị logo</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="showTaxCode" checked={data.showTaxCode} onChange={e => set("showTaxCode", e.target.checked)} /><Label htmlFor="showTaxCode" className="text-sm cursor-pointer">Hiển thị mã số thuế</Label></div>
            </Section>

            <Section id="design" icon={Palette} title="Màu Sắc & Font Chữ">
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Màu Header" field="headerColor" />
                <ColorField label="Màu Nhấn" field="accentColor" />
                <ColorField label="Màu Chữ" field="textColor" />
                <ColorField label="Màu Nền" field="bgColor" />
              </div>
              <div>
                <Label className="text-xs">Font Chữ</Label>
                <select value={data.fontFamily} onChange={e => set("fontFamily", e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background">
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </Section>

            <Section id="layout" icon={Layout} title="Tiêu Đề Hóa Đơn">
              <div><Label className="text-xs">Tiêu đề</Label><Input className="mt-1" value={data.invoiceTitle} onChange={e => set("invoiceTitle", e.target.value)} /></div>
            </Section>

            <Section id="footer" icon={FileText} title="Footer, Ghi Chú & Ngân Hàng">
              <div>
                <Label className="text-xs">Nội dung footer</Label>
                <textarea value={data.footer} onChange={e => set("footer", e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm min-h-16 bg-background resize-none" placeholder="Cảm ơn quý khách..." />
              </div>
              <div>
                <Label className="text-xs">Ghi chú</Label>
                <textarea value={data.notes} onChange={e => set("notes", e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm min-h-16 bg-background resize-none" placeholder="Ghi chú thêm..." />
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="showBankInfo" checked={data.showBankInfo} onChange={e => set("showBankInfo", e.target.checked)} /><Label htmlFor="showBankInfo" className="text-sm cursor-pointer">Hiển thị thông tin ngân hàng</Label></div>
              {data.showBankInfo && (
                <div>
                  <Label className="text-xs">Thông tin ngân hàng</Label>
                  <textarea value={data.bankInfo} onChange={e => set("bankInfo", e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm min-h-20 bg-background resize-none" placeholder={"Ngân hàng: Vietcombank\nSố TK: 1234567890\nChủ TK: CÔNG TY ABC"} />
                </div>
              )}
            </Section>
          </div>

          {showPreview && (
            <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
              <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-t-lg border border-b-0 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Live Preview (dữ liệu mẫu)</span>
              </div>
              <div className="border border-t-0 rounded-b-lg p-3 bg-gray-50 dark:bg-gray-900">
                <div style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "117.6%" }}>
                  <InvoicePreview data={data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
