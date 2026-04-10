import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, Bell, Shield, CreditCard, Loader2, Eye, EyeOff, ImageIcon, Upload, X, Globe, Webhook, Check, AlertCircle, Copy, RefreshCw, CheckCircle2, XCircle, Send, Bot, ExternalLink, Receipt, Percent, Star, Users2, ShoppingBag, Heart, Trophy, BookOpen, Ticket, Wallet, MessageSquare, ToggleLeft, Tag, Plus, Trash2, Pencil } from "@/components/Icon";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// FeatureFlags icons map
const FEATURE_ICONS: Record<string, React.ElementType> = {
  points: Star,
  warranty: Shield,
  referral: Users2,
  flash_sale: ShoppingBag,
  wishlist: Heart,
  leaderboard: Trophy,
  blog: BookOpen,
  coupon: Ticket,
  wallet: Wallet,
  review: MessageSquare,
};
const CATEGORY_LABELS: Record<string, string> = {
  loyalty: "Khách hàng thân thiết",
  service: "Dịch vụ",
  marketing: "Marketing & Khuyến mãi",
  ux: "Trải nghiệm người dùng",
  gamification: "Gamification",
  content: "Nội dung",
  payment: "Thanh toán",
  general: "Chung",
};

export default function Settings() {
  const [, setLocation] = useLocation();

  // PayOS state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);
  const [payosSaving, setPayosSaving] = useState(false);
  const [payosTesting, setPayosTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [payosForm, setPayosForm] = useState({ payosApiKey: "", payosClientId: "", payosChecksumKey: "" });
  const webhookUrl = `${window.location.origin}/api/webhooks/payos`;

  // Telegram state
  const [telegramForm, setTelegramForm] = useState({ telegramBotToken: "", telegramChatId: "", telegramEnabled: false });
  const [telegramSaving, setTelegramSaving] = useState(false);

  // Tax state
  const [taxForm, setTaxForm] = useState({ taxName: "VAT", taxRate: 10, isEnabled: false });
  const [taxSaving, setTaxSaving] = useState(false);

  // Feature flags state
  const [loadingFlagKey, setLoadingFlagKey] = useState<string | null>(null);
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

  // PayOS queries
  const { data: payosConfig } = trpc.paymentGateways.get.useQuery();
  const updateGateway = trpc.paymentGateways.update.useMutation();
  const testConnection = trpc.paymentGateways.testConnection.useMutation();

  // Telegram queries
  const saveTelegram = trpc.settingsExt.updateTelegram.useMutation({
    onSuccess: () => { toast.success("Đã lưu cấu hình Telegram!"); setTelegramSaving(false); },
    onError: (e: any) => { toast.error(e.message || "Lưu thất bại"); setTelegramSaving(false); },
  });
  const testTelegram = trpc.settingsExt.testTelegram.useMutation({
    onSuccess: () => toast.success("Gửi tin nhắn test thành công!"),
    onError: (e: any) => toast.error(e.message || "Test thất bại"),
  });

  // Tax queries
  const { data: taxData } = trpc.tax.getSettings.useQuery();
  const saveTax = trpc.tax.save.useMutation({
    onSuccess: () => { toast.success("Đã lưu cấu hình thuế!"); setTaxSaving(false); },
    onError: (e: any) => { toast.error(e.message || "Lưu thất bại"); setTaxSaving(false); },
  });

  // Feature flags queries
  const { data: featureFlags, isLoading: flagsLoading, refetch: refetchFlags } = trpc.featureFlags.getAll.useQuery();
  const updateFlag = trpc.featureFlags.update.useMutation();

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

  // Load PayOS config
  useEffect(() => {
    if (payosConfig) {
      setPayosForm({
        payosApiKey: payosConfig.payosApiKey || "",
        payosClientId: payosConfig.payosClientId || "",
        payosChecksumKey: payosConfig.payosChecksumKey || "",
      });
    }
  }, [payosConfig]);

  // Load Telegram config
  useEffect(() => {
    if (settingsData) {
      const s = settingsData as any;
      setTelegramForm({
        telegramBotToken: s.telegramBotToken || "",
        telegramChatId: s.telegramChatId || "",
        telegramEnabled: s.telegramEnabled ?? false,
      });
    }
  }, [settingsData]);

  // Load Tax config
  useEffect(() => {
    if (taxData) {
      setTaxForm({
        taxName: taxData.taxName || "VAT",
        taxRate: Number(taxData.taxRate ?? 10),
        isEnabled: taxData.isEnabled ?? false,
      });
    }
  }, [taxData]);

  // Feature flag toggle handler
  const handleToggleFlag = async (key: string, enabled: boolean) => {
    setLoadingFlagKey(key);
    try {
      await updateFlag.mutateAsync({ key, enabled });
      await refetchFlags();
      toast.success(`Đã ${enabled ? "bật" : "tắt"} tính năng thành công`);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoadingFlagKey(null);
    }
  };

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
        {/* ── Page Header ── */}
        <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Cài Đặt Hệ Thống</h1>
            <p className="ak-page-subtitle">Quản lý thông tin công ty, thương hiệu và tích hợp</p>
          </div>
        </div>

        <Tabs defaultValue="identity" className="space-y-5">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="bg-gray-100 p-1 rounded-lg flex-nowrap h-auto gap-1 w-max">
              <TabsTrigger value="identity" className="gap-1.5 text-sm whitespace-nowrap">
                <Building2 className="h-4 w-4" /> Identity
              </TabsTrigger>
              <TabsTrigger value="visuals" className="gap-1.5 text-sm whitespace-nowrap">
                <Globe className="h-4 w-4" /> Visuals
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-1.5 text-sm whitespace-nowrap">
                <ImageIcon className="h-4 w-4" /> Assets
              </TabsTrigger>
              <TabsTrigger value="storage" className="gap-1.5 text-sm whitespace-nowrap">
                <Receipt className="h-4 w-4" /> Storage
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1.5 text-sm whitespace-nowrap">
                <Shield className="h-4 w-4" /> System
              </TabsTrigger>
              <TabsTrigger value="danger" className="gap-1.5 text-sm whitespace-nowrap text-red-600 data-[state=active]:text-red-600">
                <AlertCircle className="h-4 w-4" /> Danger
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Identity Tab */}
          <TabsContent value="identity">
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

          {/* Visuals Tab */}
          <TabsContent value="visuals">
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

          {/* Assets Tab */}
          <TabsContent value="assets">
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

          {/* Storage Tab */}
          <TabsContent value="storage">
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

          {/* System Tab - PayOS + Telegram */}
          <TabsContent value="system">
            <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Thông Tin API PayOS
                  </CardTitle>
                  <CardDescription>Lấy thông tin từ PayOS Developer Dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Client ID</Label>
                    <Input
                      value={payosForm.payosClientId}
                      onChange={(e) => setPayosForm({ ...payosForm, payosClientId: e.target.value })}
                      placeholder="Nhập Client ID từ PayOS Dashboard"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={payosForm.payosApiKey}
                        onChange={(e) => setPayosForm({ ...payosForm, payosApiKey: e.target.value })}
                        placeholder="Nhập API Key"
                        className="pr-10 font-mono"
                      />
                      <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">API Key bí mật, không chia sẻ với ai</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Checksum Key</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showChecksum ? "text" : "password"}
                        value={payosForm.payosChecksumKey}
                        onChange={(e) => setPayosForm({ ...payosForm, payosChecksumKey: e.target.value })}
                        placeholder="Nhập Checksum Key"
                        className="pr-10 font-mono"
                      />
                      <button type="button" onClick={() => setShowChecksum(!showChecksum)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showChecksum ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Dùng để xác thực chữ ký webhook từ PayOS</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={async () => {
                        setPayosSaving(true);
                        try {
                          await updateGateway.mutateAsync(payosForm);
                          await utils.paymentGateways.get.invalidate();
                          toast.success("Đã lưu cấu hình PayOS!");
                        } catch { toast.error("Lưu thất bại"); }
                        finally { setPayosSaving(false); }
                      }}
                      disabled={payosSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {payosSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Lưu Cấu Hình
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setPayosTesting(true);
                        try {
                          await updateGateway.mutateAsync(payosForm);
                          const r = await testConnection.mutateAsync({ gateway: "payos" });
                          r.success ? (setConnectionStatus("success"), toast.success(r.message || "Kết nối thành công!")) : (setConnectionStatus("error"), toast.error(r.message || "Kết nối thất bại"));
                        } catch (e: any) { setConnectionStatus("error"); toast.error(e.message || "Lỗi kết nối"); }
                        finally { setPayosTesting(false); }
                      }}
                      disabled={payosTesting}
                    >
                      {payosTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                  {connectionStatus !== "idle" && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      connectionStatus === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {connectionStatus === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {connectionStatus === "success" ? "Kết nối PayOS thành công" : "Kết nối thất bại, kiểm tra lại API"}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-purple-600" />
                    Webhook PayOS
                  </CardTitle>
                  <CardDescription>URL webhook để nhận thông báo thanh toán từ PayOS</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-700 flex-1 break-all">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/payos`}</code>
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/payos`); toast.success("Đã sao chép!"); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Hướng dẫn:</strong> Dán URL này vào mục "Webhook URL" trên PayOS Dashboard để nhận thông báo thanh toán tự động.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700">Lấy Client ID, API Key và Checksum Key từ <a href="https://my.payos.vn" target="_blank" rel="noreferrer" className="underline font-medium">my.payos.vn</a> → Tích hợp → Thông tin tích hợp</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Telegram section inside System */}
            <div className="max-w-2xl">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" /> Telegram Bot
              </h3>
              <div className="space-y-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="text-sm text-blue-700 space-y-1.5 pt-4">
                    <p><strong>Bước 1:</strong> Mở Telegram, tìm @BotFather và gõ <code className="bg-blue-100 px-1 rounded">/newbot</code></p>
                    <p><strong>Bước 2:</strong> Đặt tên bot, BotFather sẽ cấp <strong>Bot Token</strong></p>
                    <p><strong>Bước 3:</strong> Nhắn tin cho bot, truy cập <code className="bg-blue-100 px-1 rounded">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> để lấy <strong>Chat ID</strong></p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border border-gray-100">
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label className="text-sm font-medium">Bot Token *</Label>
                      <Input type="password" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" value={telegramForm.telegramBotToken} onChange={e => setTelegramForm(f => ({ ...f, telegramBotToken: e.target.value }))} className="mt-1.5 font-mono" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Chat ID *</Label>
                      <Input placeholder="-1001234567890" value={telegramForm.telegramChatId} onChange={e => setTelegramForm(f => ({ ...f, telegramChatId: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Bật thông báo Telegram</p>
                        <p className="text-xs text-gray-500">Nhận thông báo khi có đơn mới</p>
                      </div>
                      <Switch checked={telegramForm.telegramEnabled} onCheckedChange={v => setTelegramForm(f => ({ ...f, telegramEnabled: v }))} />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => { setTelegramSaving(true); saveTelegram.mutate(telegramForm); }} disabled={telegramSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {telegramSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Lưu Cấu Hình
                      </Button>
                      <Button variant="outline" onClick={() => testTelegram.mutate()} disabled={testTelegram.isPending || !telegramForm.telegramBotToken || !telegramForm.telegramChatId}>
                        {testTelegram.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            </div>
          </TabsContent>

          {/* Danger Tab */}
          <TabsContent value="danger">
            <div className="space-y-5">
              {/* Tax Section */}
              <Card className="shadow-sm border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    Cấu Hình Thuế
                  </CardTitle>
                  <CardDescription>Thuế sẽ được tự động tính vào tổng tiền khi thanh toán</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Kích hoạt thuế</p>
                      <p className="text-xs text-gray-500">Bật/tắt tính thuế khi thanh toán</p>
                    </div>
                    <Switch checked={taxForm.isEnabled} onCheckedChange={v => setTaxForm(f => ({ ...f, isEnabled: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tên thuế</Label>
                      <Input
                        value={taxForm.taxName}
                        onChange={(e) => setTaxForm(f => ({ ...f, taxName: e.target.value }))}
                        placeholder="VD: VAT, GST"
                        disabled={!taxForm.isEnabled}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tỷ lệ (%)</Label>
                      <div className="relative mt-1.5">
                        <Input
                          type="number" min={0} max={100} step={0.1}
                          value={taxForm.taxRate}
                          onChange={(e) => setTaxForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                          className="pr-10"
                          disabled={!taxForm.isEnabled}
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  {taxForm.isEnabled && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                      Đơn hàng 100,000đ với thuế {taxForm.taxRate}% → Tổng: {(100000 * (1 + taxForm.taxRate / 100)).toLocaleString("vi-VN")}đ
                    </p>
                  )}
                  <Button
                    onClick={() => { setTaxSaving(true); saveTax.mutate(taxForm); }}
                    disabled={taxSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {taxSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Lưu Cấu Hình Thuế
                  </Button>
                </CardContent>
              </Card>

              {/* Feature Flags Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-blue-600" />
                  Quản Lý Tính Năng
                </h3>
                {flagsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const grouped: Record<string, typeof featureFlags> = {};
                      if (featureFlags) {
                        for (const flag of featureFlags) {
                          const cat = flag.category || "general";
                          if (!grouped[cat]) grouped[cat] = [];
                          grouped[cat]!.push(flag);
                        }
                      }
                      const CATEGORY_COLORS: Record<string, string> = {
                        loyalty: "bg-yellow-100 text-yellow-800",
                        service: "bg-blue-100 text-blue-800",
                        marketing: "bg-pink-100 text-pink-800",
                        ux: "bg-purple-100 text-purple-800",
                        gamification: "bg-orange-100 text-orange-800",
                        content: "bg-green-100 text-green-800",
                        payment: "bg-teal-100 text-teal-800",
                        general: "bg-slate-100 text-slate-800",
                      };
                      return Object.entries(grouped).map(([category, items]) => (
                        <Card key={category} className="shadow-sm border border-gray-100">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${CATEGORY_COLORS[category] || CATEGORY_COLORS.general}`}>
                              {CATEGORY_LABELS[category] || category}
                            </span>
                          </CardHeader>
                          <CardContent className="px-4 pb-3 space-y-2">
                            {(items || []).map((flag) => {
                              const Icon = FEATURE_ICONS[flag.key] || ToggleLeft;
                              const isUpdating = loadingFlagKey === flag.key;
                              return (
                                <div key={flag.key} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${flag.enabled ? "bg-blue-100" : "bg-gray-100"}`}>
                                      <Icon className={`h-3.5 w-3.5 ${flag.enabled ? "text-blue-600" : "text-gray-400"}`} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-gray-800">{flag.label}</p>
                                        <Badge variant={flag.enabled ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                                          {flag.enabled ? "Đang bật" : "Đã tắt"}
                                        </Badge>
                                      </div>
                                      {flag.description && <p className="text-xs text-gray-500">{flag.description}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                                    <Switch
                                      checked={flag.enabled}
                                      onCheckedChange={(checked) => handleToggleFlag(flag.key, checked)}
                                      disabled={isUpdating}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
