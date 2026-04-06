import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, Bell, Shield, CreditCard, Loader2, Eye, EyeOff, ImageIcon, Upload, X, Globe } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    taxId: "",
    website: "",
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    invoiceReminder: true,
    paymentConfirmation: true,
    weeklyReport: false,
  });

  // Brand state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Load settings from server
  const { data: settingsData, isLoading } = trpc.settings.get.useQuery();
  const updateCompany = trpc.settings.updateCompany.useMutation();
  const updateNotifications = trpc.settings.updateNotifications.useMutation();
  const changePassword = trpc.settings.changePassword.useMutation();
  const uploadBrandAsset = trpc.settings.uploadBrandAsset.useMutation();
  const updateBrand = trpc.settings.updateBrand.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (settingsData) {
      setCompanyData({
        companyName: settingsData.companyName || "",
        companyEmail: settingsData.companyEmail || "",
        companyPhone: settingsData.companyPhone || "",
        companyAddress: settingsData.companyAddress || "",
        taxId: settingsData.taxId || "",
        website: settingsData.website || "",
      });
      setNotifications({
        emailNotifications: settingsData.emailNotifications ?? true,
        invoiceReminder: settingsData.invoiceReminder ?? true,
        paymentConfirmation: settingsData.paymentConfirmation ?? true,
        weeklyReport: settingsData.weeklyReport ?? false,
      });
      // Load brand assets
      if ((settingsData as any).logoUrl) setLogoPreview((settingsData as any).logoUrl);
      if ((settingsData as any).faviconUrl) setFaviconPreview((settingsData as any).faviconUrl);
    }
  }, [settingsData]);

  // Apply favicon dynamically
  useEffect(() => {
    if (faviconPreview) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) {
        link.href = faviconPreview;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = faviconPreview;
        document.head.appendChild(newLink);
      }
    }
  }, [faviconPreview]);

  const handleSaveCompany = async () => {
    try {
      await updateCompany.mutateAsync(companyData);
      await utils.settings.get.invalidate();
      toast.success("Đã lưu thông tin công ty!");
    } catch (e: any) {
      toast.error(e.message || "Lưu thất bại");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotifications.mutateAsync(notifications);
      await utils.settings.get.invalidate();
      toast.success("Đã lưu cài đặt thông báo!");
    } catch (e: any) {
      toast.error(e.message || "Lưu thất bại");
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: "", newPw: "", confirm: "" });
      toast.success("Đổi mật khẩu thành công!");
    } catch (e: any) {
      toast.error(e.message || "Đổi mật khẩu thất bại");
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File logo không được vượt quá 2MB");
      return;
    }
    setLogoUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoPreview(dataUrl);
      const result = await uploadBrandAsset.mutateAsync({
        type: "logo",
        dataUrl,
        fileName: file.name,
      });
      setLogoPreview(result.url);
      await utils.settings.get.invalidate();
      toast.success("Đã tải lên logo website!");
    } catch (e: any) {
      toast.error(e.message || "Upload thất bại");
      setLogoPreview(null);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast.error("File favicon không được vượt quá 512KB");
      return;
    }
    setFaviconUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setFaviconPreview(dataUrl);
      const result = await uploadBrandAsset.mutateAsync({
        type: "favicon",
        dataUrl,
        fileName: file.name,
      });
      setFaviconPreview(result.url);
      await utils.settings.get.invalidate();
      toast.success("Đã tải lên favicon!");
    } catch (e: any) {
      toast.error(e.message || "Upload thất bại");
      setFaviconPreview(null);
    } finally {
      setFaviconUploading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateBrand.mutateAsync({ logoUrl: null });
      setLogoPreview(null);
      await utils.settings.get.invalidate();
      toast.success("Đã xóa logo");
    } catch (e: any) {
      toast.error(e.message || "Xóa thất bại");
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      await updateBrand.mutateAsync({ faviconUrl: null });
      setFaviconPreview(null);
      // Reset favicon to default
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = "/favicon.ico";
      await utils.settings.get.invalidate();
      toast.success("Đã xóa favicon");
    } catch (e: any) {
      toast.error(e.message || "Xóa thất bại");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài Đặt</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin công ty và tùy chọn hệ thống</p>
        </div>

        <Tabs defaultValue="company" className="space-y-5">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="bg-gray-100 p-1 rounded-lg flex-wrap h-auto gap-1 w-max min-w-full">
              <TabsTrigger value="company" className="gap-1.5 text-sm">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Công Ty</span>
                <span className="sm:hidden">CT</span>
              </TabsTrigger>
              <TabsTrigger value="brand" className="gap-1.5 text-sm">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Thương Hiệu</span>
                <span className="sm:hidden">TH</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-sm">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Thông Báo</span>
                <span className="sm:hidden">TB</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-1.5 text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Thanh Toán</span>
                <span className="sm:hidden">TT</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-sm">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Bảo Mật</span>
                <span className="sm:hidden">BM</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Thông Tin Công Ty
                </CardTitle>
                <CardDescription>Thông tin này sẽ hiển thị trên hóa đơn của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tên Công Ty</Label>
                        <Input
                          value={companyData.companyName}
                          onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                          placeholder="Invoice Prime"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Mã Số Thuế</Label>
                        <Input
                          value={companyData.taxId}
                          onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                          placeholder="0123456789"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email Công Ty</Label>
                        <Input
                          type="email"
                          value={companyData.companyEmail}
                          onChange={(e) => setCompanyData({ ...companyData, companyEmail: e.target.value })}
                          placeholder="info@company.com"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Số Điện Thoại</Label>
                        <Input
                          value={companyData.companyPhone}
                          onChange={(e) => setCompanyData({ ...companyData, companyPhone: e.target.value })}
                          placeholder="(028) 1234-5678"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Website</Label>
                        <Input
                          value={companyData.website}
                          onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                          placeholder="https://yourcompany.com"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Địa Chỉ</Label>
                      <Input
                        value={companyData.companyAddress}
                        onChange={(e) => setCompanyData({ ...companyData, companyAddress: e.target.value })}
                        placeholder="123 Đường ABC, Quận 1, TP.HCM"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handleSaveCompany}
                        disabled={updateCompany.isPending}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {updateCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Lưu Thông Tin
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Tab */}
          <TabsContent value="brand">
            <div className="space-y-4">
              {/* Logo Card */}
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Logo Website
                  </CardTitle>
                  <CardDescription>
                    Logo hiển thị trên navbar, trang thanh toán và landing page. Khuyến nghị PNG/SVG nền trong suốt, tối đa 2MB.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 text-gray-300 mx-auto" />
                            <p className="text-xs text-gray-400 mt-1">Chưa có logo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-3">
                      <p className="text-sm text-gray-600">
                        Tải lên file ảnh PNG, JPG, SVG hoặc WebP. Kích thước khuyến nghị: <strong>200×60px</strong> hoặc tỷ lệ tương đương.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={logoUploading}
                        >
                          {logoUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {logoUploading ? "Đang tải lên..." : "Chọn File Logo"}
                        </Button>
                        {logoPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300"
                            onClick={handleRemoveLogo}
                            disabled={updateBrand.isPending}
                          >
                            <X className="h-4 w-4" />
                            Xóa Logo
                          </Button>
                        )}
                      </div>
                      {logoPreview && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          Logo đã được lưu và áp dụng
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Favicon Card */}
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-600" />
                    Favicon (Icon Tab Trình Duyệt)
                  </CardTitle>
                  <CardDescription>
                    Icon nhỏ hiển thị trên tab trình duyệt. Khuyến nghị ICO hoặc PNG vuông 32×32px hoặc 64×64px, tối đa 512KB.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {faviconPreview ? (
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <Globe className="h-8 w-8 text-gray-300 mx-auto" />
                            <p className="text-xs text-gray-400 mt-1">Chưa có</p>
                          </div>
                        )}
                      </div>
                      {faviconPreview && (
                        <p className="text-xs text-gray-500 mt-2 text-center">Xem trước 48px</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-3">
                      <p className="text-sm text-gray-600">
                        Tải lên file ICO, PNG hoặc SVG. Kích thước tốt nhất: <strong>32×32px</strong> hoặc <strong>64×64px</strong> (hình vuông).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon"
                          className="hidden"
                          onChange={handleFaviconUpload}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => faviconInputRef.current?.click()}
                          disabled={faviconUploading}
                        >
                          {faviconUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {faviconUploading ? "Đang tải lên..." : "Chọn File Favicon"}
                        </Button>
                        {faviconPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300"
                            onClick={handleRemoveFavicon}
                            disabled={updateBrand.isPending}
                          >
                            <X className="h-4 w-4" />
                            Xóa Favicon
                          </Button>
                        )}
                      </div>
                      {faviconPreview && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          Favicon đã được lưu và áp dụng cho tab trình duyệt
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage hint */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-blue-700 font-medium mb-1">Lưu ý về Logo & Favicon</p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>Logo sẽ hiển thị trên navbar dashboard, trang thanh toán (/pay), và landing page</li>
                  <li>Favicon sẽ hiển thị ngay lập tức trên tab trình duyệt sau khi tải lên</li>
                  <li>Để logo hiển thị đẹp trên nền tối, hãy dùng PNG có nền trong suốt</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  Cài Đặt Thông Báo
                </CardTitle>
                <CardDescription>Quản lý các loại thông báo bạn muốn nhận</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  {
                    key: "emailNotifications" as const,
                    title: "Thông Báo Qua Email",
                    desc: "Nhận email khi có hóa đơn mới được tạo",
                  },
                  {
                    key: "invoiceReminder" as const,
                    title: "Nhắc Nhở Hóa Đơn Chưa Thanh Toán",
                    desc: "Tự động nhắc khách hàng thanh toán khi gần đến hạn",
                  },
                  {
                    key: "paymentConfirmation" as const,
                    title: "Xác Nhận Thanh Toán",
                    desc: "Nhận thông báo khi khách hàng thanh toán thành công",
                  },
                  {
                    key: "weeklyReport" as const,
                    title: "Báo Cáo Hàng Tuần",
                    desc: "Nhận tóm tắt doanh thu và hóa đơn mỗi tuần",
                  },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={updateNotifications.isPending}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {updateNotifications.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu Cài Đặt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className="shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => setLocation("/settings/payos")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">PayOS</h3>
                      <p className="text-sm text-gray-500 mt-1">Cổng thanh toán PayOS - hỗ trợ QR Code, chuyển khoản ngân hàng</p>
                      <span className="inline-block mt-2 text-xs text-blue-600 font-medium">Cấu hình →</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => setLocation("/settings/paypal")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">PayPal</h3>
                      <p className="text-sm text-gray-500 mt-1">Cổng thanh toán PayPal - hỗ trợ thẻ quốc tế, USD</p>
                      <span className="inline-block mt-2 text-xs text-indigo-600 font-medium">Cấu hình →</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Bảo Mật Tài Khoản
                </CardTitle>
                <CardDescription>Đổi mật khẩu để bảo vệ tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Mật Khẩu Hiện Tại</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mật Khẩu Mới</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      value={pwForm.newPw}
                      onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Xác Nhận Mật Khẩu Mới</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleChangePassword}
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    Đổi Mật Khẩu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
