import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Trash2, RefreshCw, Search, AlertCircle, Terminal } from "@/components/Icon";
import { toast } from "sonner";

const MOCK_STATS = [
  { label: "Tổng Keys", value: "—", icon: Database, color: "text-blue-500" },
  { label: "Bộ nhớ", value: "—", icon: Database, color: "text-purple-500" },
  { label: "Cache Hits", value: "—", icon: Database, color: "text-green-500" },
  { label: "Misses", value: "—", icon: AlertCircle, color: "text-orange-500" },
];

const TABS = [
  { id: "overview", label: "Tổng Quan", icon: Database },
  { id: "keys", label: "Duyệt Keys", icon: Search },
  { id: "actions", label: "Thao Tác", icon: Terminal },
];

export default function RedisConsole() {
  const [keySearch, setKeySearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.info("Đã làm mới thông tin Redis");
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="ak-page-title">Redis Cache</h1>
            <p className="ak-page-subtitle">Quản lý bộ nhớ đệm và phiên làm việc</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge className="gap-1 bg-orange-500/10 text-orange-600 border-orange-200 text-xs">
              <AlertCircle className="w-3 h-3" /> Chưa cấu hình
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-3.5 bg-blue-500/5 border border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm text-blue-700">Redis chưa được cấu hình</p>
            <p className="text-xs text-blue-600/80 mt-0.5">
              Hệ thống đang dùng in-memory cache. Thêm biến môi trường{" "}
              <code className="bg-blue-100 px-1 rounded font-mono">REDIS_URL</code> để bật Redis.
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOCK_STATS.map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold ${s.color} opacity-40`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom tabs - scrollable on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide border-b border-border">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">Thông Tin Redis Server</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-center py-8">
                <Database className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">Redis chưa được kết nối</p>
                <p className="text-xs text-muted-foreground mt-1">Thêm REDIS_URL vào biến môi trường để bật tính năng này</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "keys" && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Tìm key (vd: session:*, product:*)"
                    value={keySearch}
                    onChange={e => setKeySearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => toast.info("Redis chưa được kết nối")} className="flex-shrink-0">
                  Tìm
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Kết nối Redis để duyệt keys</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "actions" && (
          <div className="space-y-3">
            {[
              {
                title: "Xóa Toàn Bộ Cache",
                desc: "Xóa tất cả keys trong Redis. Hệ thống sẽ tự rebuild cache khi cần.",
                label: "Flush All",
                danger: true,
              },
              {
                title: "Xóa Cache Phiên Đăng Nhập",
                desc: "Xóa tất cả session cache. Người dùng sẽ cần đăng nhập lại.",
                label: "Xóa Sessions",
                danger: false,
              },
              {
                title: "Xóa Cache Sản Phẩm",
                desc: "Làm mới cache danh sách sản phẩm và danh mục.",
                label: "Refresh Products",
                danger: false,
              },
            ].map(action => (
              <Card key={action.title} className={action.danger ? "border-destructive/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                    <Button
                      variant={action.danger ? "destructive" : "outline"}
                      size="sm"
                      className="self-start sm:self-auto flex-shrink-0"
                      onClick={() => toast.info("Redis chưa được kết nối")}
                    >
                      {action.danger
                        ? <><Trash2 className="w-3.5 h-3.5 mr-1.5" />{action.label}</>
                        : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />{action.label}</>
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
