import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, CheckCircle, AlertCircle, Puzzle, Shield, BarChart3, Mail, Send, Bell } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Extension {
  id: string;
  name: string;
  subtitle: string;
  category: "auth" | "notification" | "analytics" | "monitoring";
  icon: string;
  enabled: boolean;
  settingsPath?: string;
  description: string;
}

const EXTENSIONS: Extension[] = [
  // Auth
  {
    id: "google_oauth",
    name: "Google",
    subtitle: "OAUTH 2.0 PROVIDER",
    category: "auth",
    icon: "https://www.google.com/favicon.ico",
    enabled: false,
    description: "Đăng nhập bằng tài khoản Google",
  },
  {
    id: "github_oauth",
    name: "Github",
    subtitle: "OAUTH 2.0 PROVIDER",
    category: "auth",
    icon: "https://github.com/favicon.ico",
    enabled: false,
    description: "Đăng nhập bằng tài khoản Github",
  },
  {
    id: "captcha",
    name: "CAPTCHA",
    subtitle: "BẢO MẬT",
    category: "auth",
    icon: "",
    enabled: false,
    description: "Bảo vệ form đăng ký và đăng nhập",
  },
  // Notification
  {
    id: "telegram",
    name: "Telegram",
    subtitle: "THÔNG BÁO",
    category: "notification",
    icon: "https://telegram.org/favicon.ico",
    enabled: false,
    settingsPath: "/settings/telegram",
    description: "Gửi thông báo qua Telegram bot",
  },
  {
    id: "smtp_email",
    name: "SMTP Email",
    subtitle: "THÔNG BÁO",
    category: "notification",
    icon: "",
    enabled: true,
    settingsPath: "/settings/smtp",
    description: "Gửi email qua SMTP server",
  },
  // Analytics
  {
    id: "google_analytics",
    name: "Google Analytics",
    subtitle: "PHÂN TÍCH",
    category: "analytics",
    icon: "https://www.google.com/favicon.ico",
    enabled: false,
    description: "Theo dõi lưu lượng truy cập",
  },
  // Monitoring
  {
    id: "monitoring",
    name: "Giám Sát",
    subtitle: "GIÁM SÁT",
    category: "monitoring",
    icon: "",
    enabled: false,
    description: "Theo dõi hiệu suất và lỗi hệ thống",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
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

function ExtensionCard({ ext, onToggle }: { ext: Extension; onToggle: (id: string) => void }) {
  const [, navigate] = useLocation();

  const IconComponent = CATEGORY_ICONS[ext.category];

  return (
    <Card className="hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      <CardContent className="p-5">
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`text-xs font-semibold ${ext.enabled ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
            {ext.enabled ? "Mở" : "Tắt"}
          </Badge>
        </div>

        {/* Icon */}
        <div className="flex flex-col items-center py-4 gap-3">
          {ext.icon ? (
            <img
              src={ext.icon}
              alt={ext.name}
              className="w-16 h-16 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="text-center">
            <p className="font-bold text-base">{ext.name}</p>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">{ext.subtitle}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center mb-4 line-clamp-2">{ext.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Button
            variant={ext.enabled ? "destructive" : "default"}
            size="sm"
            className="flex-1 mr-2"
            onClick={() => onToggle(ext.id)}
          >
            {ext.enabled ? "Tắt" : "Bật"}
          </Button>
          {ext.settingsPath && (
            <Button
              variant="outline"
              size="sm"
              className="w-9 p-0"
              onClick={() => navigate(ext.settingsPath!)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Extensions() {
  const [extensions, setExtensions] = useState<Extension[]>(EXTENSIONS);
  const [activeTab, setActiveTab] = useState("all");

  const handleToggle = (id: string) => {
    setExtensions(prev => prev.map(e => {
      if (e.id !== id) return e;
      const newEnabled = !e.enabled;
      toast.success(`${newEnabled ? "Đã bật" : "Đã tắt"} ${e.name}`);
      return { ...e, enabled: newEnabled };
    }));
  };

  const categories = ["all", "auth", "notification", "analytics", "monitoring"];

  const filtered = activeTab === "all"
    ? extensions
    : extensions.filter(e => e.category === activeTab);

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="ak-page-header">
          <h1 className="ak-page-title">Tính Năng Mở Rộng</h1>
          <p className="ak-page-subtitle">Tích hợp và mở rộng chức năng hệ thống</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-1.5">
              <Puzzle className="w-4 h-4" /> Tất Cả
            </TabsTrigger>
            {categories.slice(1).map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1.5">
                  <Icon className="w-4 h-4" /> {CATEGORY_LABELS[cat]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không có tính năng nào trong danh mục này</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map(ext => (
                  <ExtensionCard key={ext.id} ext={ext} onToggle={handleToggle} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
