import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Phone, Mail, MapPin, ExternalLink, Send, Globe, Save, Loader2, Plus, Trash2 } from "@/components/Icon";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  facebookUrl: string;
  zaloUrl: string;
  telegramUrl: string;
  websiteUrl: string;
  showContactPage: boolean;
  contactPageTitle: string;
  contactPageDescription: string;
  customLinks: { label: string; url: string; icon: string }[];
}

const DEFAULT_CONTACT: ContactInfo = {
  phone: "",
  email: "",
  address: "",
  workingHours: "8:00 - 22:00 (T2 - CN)",
  facebookUrl: "",
  zaloUrl: "",
  telegramUrl: "",
  websiteUrl: "",
  showContactPage: true,
  contactPageTitle: "Liên Hệ Với Chúng Tôi",
  contactPageDescription: "Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua các kênh bên dưới.",
  customLinks: [],
};

export default function ContactWidget() {
  const [form, setForm] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings } = trpc.settings.get.useQuery();
  const updateContact = trpc.settings.updateCompany.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu thông tin liên hệ");
      setIsSaving(false);
    },
    onError: (e: any) => {
      toast.error(e.message || "Lưu thất bại");
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({
        phone: s.contactPhone || "",
        email: s.contactEmail || s.companyEmail || "",
        address: s.contactAddress || s.companyAddress || "",
        workingHours: s.workingHours || "8:00 - 22:00 (T2 - CN)",
        facebookUrl: s.facebookUrl || "",
        zaloUrl: s.zaloUrl || "",
        telegramUrl: s.telegramUrl || "",
        websiteUrl: s.website || "",
        showContactPage: s.showContactPage ?? true,
        contactPageTitle: s.contactPageTitle || "Liên Hệ Với Chúng Tôi",
        contactPageDescription: s.contactPageDescription || "Chúng tôi luôn sẵn sàng hỗ trợ bạn.",
        customLinks: s.customLinks ? JSON.parse(s.customLinks) : [],
      });
    }
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    updateContact.mutate({
      companyPhone: form.phone,
      companyEmail: form.email,
      companyAddress: form.address,
    } as any);
    // Also save extended contact info to localStorage for now
    localStorage.setItem('contactSettings', JSON.stringify(form));
    setTimeout(() => setIsSaving(false), 500);
  };

  const addCustomLink = () => {
    setForm(f => ({
      ...f,
      customLinks: [...f.customLinks, { label: "", url: "", icon: "fa-solid fa-link" }],
    }));
  };

  const removeCustomLink = (idx: number) => {
    setForm(f => ({ ...f, customLinks: f.customLinks.filter((_, i) => i !== idx) }));
  };

  const updateCustomLink = (idx: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      customLinks: f.customLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Trang Liên Hệ</h1>
            <p className="ak-page-subtitle">Cấu hình thông tin liên hệ hiển thị cho khách hàng</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu Cài Đặt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Hiển thị trang liên hệ */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                Trang Liên Hệ
              </CardTitle>
              <CardDescription>Bật/tắt trang liên hệ và tuỳ chỉnh nội dung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Hiển thị trang liên hệ</p>
                  <p className="text-xs text-muted-foreground">Khách hàng có thể truy cập /contact</p>
                </div>
                <Switch
                  checked={form.showContactPage}
                  onCheckedChange={(v) => setForm(f => ({ ...f, showContactPage: v }))}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Tiêu đề trang</Label>
                <Input
                  value={form.contactPageTitle}
                  onChange={(e) => setForm(f => ({ ...f, contactPageTitle: e.target.value }))}
                  placeholder="Liên Hệ Với Chúng Tôi"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Mô tả trang</Label>
                <Textarea
                  value={form.contactPageDescription}
                  onChange={(e) => setForm(f => ({ ...f, contactPageDescription: e.target.value }))}
                  placeholder="Chúng tôi luôn sẵn sàng hỗ trợ bạn..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Thông tin liên hệ cơ bản */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Thông Tin Liên Hệ
              </CardTitle>
              <CardDescription>Số điện thoại, email, địa chỉ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Số Điện Thoại
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0901 234 567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Liên Hệ
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="support@company.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Địa Chỉ
                </Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Giờ Làm Việc</Label>
                <Input
                  value={form.workingHours}
                  onChange={(e) => setForm(f => ({ ...f, workingHours: e.target.value }))}
                  placeholder="8:00 - 22:00 (T2 - CN)"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mạng xã hội */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Mạng Xã Hội & Liên Kết
              </CardTitle>
              <CardDescription>Facebook, Zalo, Telegram và các kênh khác</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Facebook
                </Label>
                <Input
                  value={form.facebookUrl}
                  onChange={(e) => setForm(f => ({ ...f, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/yourpage"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Zalo</Label>
                <Input
                  value={form.zaloUrl}
                  onChange={(e) => setForm(f => ({ ...f, zaloUrl: e.target.value }))}
                  placeholder="https://zalo.me/0901234567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-muted-foreground" /> Telegram
                </Label>
                <Input
                  value={form.telegramUrl}
                  onChange={(e) => setForm(f => ({ ...f, telegramUrl: e.target.value }))}
                  placeholder="https://t.me/yourusername"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
                </Label>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Liên kết tuỳ chỉnh */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    Liên Kết Tuỳ Chỉnh
                  </CardTitle>
                  <CardDescription>Thêm các kênh liên hệ khác</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addCustomLink} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Thêm
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.customLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có liên kết tuỳ chỉnh. Nhấn "Thêm" để tạo mới.
                </p>
              ) : (
                form.customLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateCustomLink(idx, "label", e.target.value)}
                        placeholder="Nhãn (VD: Discord, YouTube...)"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateCustomLink(idx, "url", e.target.value)}
                        placeholder="URL liên kết"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-0.5"
                      onClick={() => removeCustomLink(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="shadow-sm border border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-blue-700">Xem Trước Thông Tin Liên Hệ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{form.phone}</span>
                </div>
              )}
              {form.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">{form.email}</span>
                </div>
              )}
              {form.facebookUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">Facebook</span>
                </div>
              )}
              {form.telegramUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Send className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">Telegram</span>
                </div>
              )}
            </div>
            {!form.phone && !form.email && !form.facebookUrl && (
              <p className="text-sm text-muted-foreground">Điền thông tin ở trên để xem trước</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
