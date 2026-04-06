import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, Bell, Shield, CreditCard, Loader2, Eye, EyeOff } from "lucide-react";
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

  // Load settings from server
  const { data: settingsData, isLoading } = trpc.settings.get.useQuery();
  const updateCompany = trpc.settings.updateCompany.useMutation();
  const updateNotifications = trpc.settings.updateNotifications.useMutation();
  const changePassword = trpc.settings.changePassword.useMutation();
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
    }
  }, [settingsData]);

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
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success("Đã đổi mật khẩu thành công!");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message || "Đổi mật khẩu thất bại");
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
          <TabsList className="bg-gray-100 p-1 rounded-lg flex-wrap h-auto gap-1">
            <TabsTrigger value="company" className="gap-1.5 text-sm">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Công Ty</span>
              <span className="sm:hidden">CT</span>
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
