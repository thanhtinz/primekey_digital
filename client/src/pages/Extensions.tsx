import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings, AlertCircle, Puzzle, Shield, BarChart3, Bell, ExternalLink, ChevronRight } from "@/components/Icon";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  hint?: string;
}

interface Extension {
  id: string;
  name: string;
  subtitle: string;
  category: "auth" | "notification" | "analytics" | "monitoring";
  icon: string;
  enabled: boolean;
  settingsPath?: string;
  description: string;
  docsUrl?: string;
  configFields?: ConfigField[];
}

const EXTENSIONS: Extension[] = [
  {
    id: "google_oauth",
    name: "Google OAuth",
    subtitle: "ĐĂNG NHẬP",
    category: "auth",
    icon: "https://www.google.com/favicon.ico",
    enabled: false,
    description: "Cho phép khách hàng đăng nhập bằng tài khoản Google",
    docsUrl: "https://console.cloud.google.com/",
    configFields: [
      { key: "clientId", label: "Client ID", placeholder: "xxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret", placeholder: "GOCSPX-...", type: "password" },
    ],
  },
  {
    id: "github_oauth",
    name: "GitHub OAuth",
    subtitle: "ĐĂNG NHẬP",
    category: "auth",
    icon: "https://github.com/favicon.ico",
    enabled: false,
    description: "Cho phép khách hàng đăng nhập bằng tài khoản GitHub",
    docsUrl: "https://github.com/settings/developers",
    configFields: [
      { key: "clientId", label: "Client ID", placeholder: "Oc..." },
      { key: "clientSecret", label: "Client Secret", placeholder: "...", type: "password" },
    ],
  },
  {
    id: "captcha",
    name: "reCAPTCHA",
    subtitle: "BẢO MẬT",
    category: "auth",
    icon: "",
    enabled: false,
    description: "Bảo vệ form đăng ký và đăng nhập khỏi bot",
    docsUrl: "https://www.google.com/recaptcha/admin",
    configFields: [
      { key: "siteKey", label: "Site Key", placeholder: "6Le..." },
      { key: "secretKey", label: "Secret Key", placeholder: "6Le...", type: "password" },
    ],
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    subtitle: "THÔNG BÁO",
    category: "notification",
    icon: "https://telegram.org/favicon.ico",
    enabled: false,
    settingsPath: "/settings/telegram",
    description: "Nhận thông báo đơn hàng và cảnh báo qua Telegram",
    docsUrl: "https://core.telegram.org/bots",
    configFields: [
      { key: "botToken", label: "Bot Token", placeholder: "123456:ABC-...", type: "password", hint: "Lấy từ @BotFather trên Telegram" },
      { key: "chatId", label: "Chat ID", placeholder: "-100...", hint: "ID của group hoặc channel nhận thông báo" },
    ],
  },
  {
    id: "smtp_email",
    name: "SMTP Email",
    subtitle: "THÔNG BÁO",
    category: "notification",
    icon: "",
    enabled: true,
    settingsPath: "/settings/smtp",
    description: "Gửi email xác nhận đơn hàng, reset mật khẩu qua SMTP",
    configFields: [
      { key: "host", label: "SMTP Host", placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", placeholder: "587" },
      { key: "user", label: "Email", placeholder: "your@gmail.com" },
      { key: "pass", label: "App Password", placeholder: "...", type: "password" },
    ],
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    subtitle: "PHÂN TÍCH",
    category: "analytics",
    icon: "https://www.google.com/favicon.ico",
    enabled: false,
    description: "Theo dõi lưu lượng truy cập và hành vi người dùng",
    docsUrl: "https://analytics.google.com/",
    configFields: [
      { key: "measurementId", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", hint: "Tìm trong Admin > Data Streams" },
    ],
  },
  {
    id: "facebook_pixel",
    name: "Facebook Pixel",
    subtitle: "PHÂN TÍCH",
    category: "analytics",
    icon: "https://www.facebook.com/favicon.ico",
    enabled: false,
    description: "Theo dõi chuyển đổi và remarketing trên Facebook Ads",
    docsUrl: "https://business.facebook.com/events_manager",
    configFields: [
      { key: "pixelId", label: "Pixel ID", placeholder: "123456789012345" },
    ],
  },
  {
    id: "monitoring",
    name: "Uptime Monitor",
    subtitle: "GIÁM SÁT",
    category: "monitoring",
    icon: "",
    enabled: false,
    description: "Theo dõi uptime và cảnh báo khi hệ thống gặp sự cố",
    configFields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://...", hint: "URL nhận cảnh báo khi downtime" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "Tất Cả",
  auth: "Đăng Nhập",
  notification: "Thông Báo",
  analytics: "Phân Tích",
  monitoring: "Giám Sát",
};

const CATEGORY_ICONS: Record<string, any> = {
  auth: Shield,
  notification: Bell,
  analytics: BarChart3,
  monitoring: AlertCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-600 border-blue-200",
  notification: "bg-purple-500/10 text-purple-600 border-purple-200",
  analytics: "bg-orange-500/10 text-orange-600 border-orange-200",
  monitoring: "bg-red-500/10 text-red-600 border-red-200",
};

function ConfigDialog({
  ext,
  open,
  onClose,
  onConfirm,
}: {
  ext: Extension;
  open: boolean;
  onClose: () => void;
  onConfirm: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleConfirm = () => {
    const required = ext.configFields?.filter(f => !values[f.key]?.trim());
    if (required && required.length > 0) {
      toast.error(`Vui lòng điền: ${required.map(f => f.label).join(", ")}`);
      return;
    }
    onConfirm(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ext.icon ? (
              <img src={ext.icon} alt={ext.name} className="w-5 h-5 object-contain" />
            ) : (
              <Settings className="w-5 h-5 text-muted-foreground" />
            )}
            Cấu hình {ext.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{ext.description}</p>

          {ext.docsUrl && (
            <a
              href={ext.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Xem hướng dẫn lấy API key
            </a>
          )}

          {ext.configFields?.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
              </Label>
              <Input
                id={field.key}
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
              {field.hint && (
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm}>Bật tính năng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtensionCard({
  ext,
  onToggle,
  onConfigure,
}: {
  ext: Extension;
  onToggle: (id: string) => void;
  onConfigure: (ext: Extension) => void;
}) {
  const [, navigate] = useLocation();
  const IconComponent = CATEGORY_ICONS[ext.category];
  const catColor = CATEGORY_COLORS[ext.category];

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${ext.enabled ? "ring-1 ring-green-200" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ext.enabled ? "bg-green-50" : "bg-muted"}`}>
            {ext.icon ? (
              <img
                src={ext.icon}
                alt={ext.name}
                className="w-6 h-6 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <IconComponent className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{ext.name}</p>
              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${catColor}`}>
                {CATEGORY_LABELS[ext.category]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ext.description}</p>
          </div>

          {/* Status */}
          <Badge className={`flex-shrink-0 text-xs ${ext.enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {ext.enabled ? "Bật" : "Tắt"}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <Button
            variant={ext.enabled ? "outline" : "default"}
            size="sm"
            className={`flex-1 text-xs h-8 ${ext.enabled ? "text-red-600 border-red-200 hover:bg-red-50" : ""}`}
            onClick={() => {
              if (!ext.enabled && ext.configFields && ext.configFields.length > 0) {
                onConfigure(ext);
              } else {
                onToggle(ext.id);
              }
            }}
          >
            {ext.enabled ? "Tắt" : "Bật"}
          </Button>
          {ext.settingsPath && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Cài đặt"
              onClick={() => navigate(ext.settingsPath!)}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Extensions() {
  const [extensions, setExtensions] = useState<Extension[]>(EXTENSIONS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [configExt, setConfigExt] = useState<Extension | null>(null);

  const handleToggle = (id: string) => {
    setExtensions(prev => prev.map(e => {
      if (e.id !== id) return e;
      const newEnabled = !e.enabled;
      toast.success(`${newEnabled ? "Đã bật" : "Đã tắt"} ${e.name}`);
      return { ...e, enabled: newEnabled };
    }));
  };

  const handleConfigure = (ext: Extension) => {
    setConfigExt(ext);
  };

  const handleConfigConfirm = (values: Record<string, string>) => {
    if (!configExt) return;
    setExtensions(prev => prev.map(e =>
      e.id === configExt.id ? { ...e, enabled: true } : e
    ));
    toast.success(`Đã bật và lưu cấu hình ${configExt.name}`);
    setConfigExt(null);
  };

  const categories = ["all", "auth", "notification", "analytics", "monitoring"];

  const filtered = activeCategory === "all"
    ? extensions
    : extensions.filter(e => e.category === activeCategory);

  const enabledCount = extensions.filter(e => e.enabled).length;

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="ak-page-title">Tính Năng Mở Rộng</h1>
            <p className="ak-page-subtitle">Tích hợp dịch vụ bên thứ ba vào hệ thống</p>
          </div>
          <Badge className="self-start sm:self-auto bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1">
            {enabledCount}/{extensions.length} đang bật
          </Badge>
        </div>

        {/* Category filter - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => {
            const Icon = cat === "all" ? Puzzle : CATEGORY_ICONS[cat];
            const count = cat === "all" ? extensions.length : extensions.filter(e => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {CATEGORY_LABELS[cat]}
                <span className={`text-xs rounded-full px-1.5 py-0 ${activeCategory === cat ? "bg-white/20" : "bg-background"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có tính năng nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(ext => (
              <ExtensionCard
                key={ext.id}
                ext={ext}
                onToggle={handleToggle}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        )}
      </div>

      {/* Config dialog */}
      {configExt && (
        <ConfigDialog
          ext={configExt}
          open={!!configExt}
          onClose={() => setConfigExt(null)}
          onConfirm={handleConfigConfirm}
        />
      )}
    </DashboardLayoutCustom>
  );
}
