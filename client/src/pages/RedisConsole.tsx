import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Trash2, RefreshCw, Search, AlertCircle, CheckCircle, Terminal } from "@/components/Icon";
import { toast } from "sonner";

const MOCK_STATS = [
  { label: "Tổng Keys", value: "—" },
  { label: "Bộ nhớ dùng", value: "—" },
  { label: "Cache Hits", value: "—" },
  { label: "Cache Misses", value: "—" },
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <h1 className="ak-page-title">Redis Cache</h1>
            <p className="ak-page-subtitle">Quản lý bộ nhớ đệm và phiên làm việc</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="gap-1 bg-orange-500/10 text-orange-600 border-orange-200">
              <AlertCircle className="w-3 h-3" /> Chưa cấu hình
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} /> Làm mới
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-4 bg-blue-500/5 border border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-blue-700">Redis chưa được cấu hình</p>
            <p className="text-xs text-blue-600/80 mt-0.5">
              Hệ thống đang sử dụng in-memory cache. Để bật Redis, thêm biến môi trường <code className="bg-blue-100 px-1 rounded">REDIS_URL</code> vào cài đặt.
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {MOCK_STATS.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <Database className="w-4 h-4" /> Tổng Quan
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-1.5">
              <Search className="w-4 h-4" /> Duyệt Keys
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-1.5">
              <Terminal className="w-4 h-4" /> Thao Tác
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông Tin Redis Server</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground text-sm">Redis chưa được kết nối</p>
                  <p className="text-xs text-muted-foreground mt-1">Thêm REDIS_URL vào biến môi trường để bật tính năng này</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Tìm kiếm key (ví dụ: session:*, product:*)" value={keySearch} onChange={e => setKeySearch(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Redis chưa được kết nối")}>Tìm</Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Kết nối Redis để duyệt keys</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="space-y-4">
              {[
                { title: "Xóa Toàn Bộ Cache", desc: "Xóa tất cả keys trong Redis. Hệ thống sẽ tự rebuild cache khi cần.", label: "Flush All", danger: true },
                { title: "Xóa Cache Phiên Đăng Nhập", desc: "Xóa tất cả session cache. Người dùng sẽ cần đăng nhập lại.", label: "Xóa Sessions", danger: false },
                { title: "Xóa Cache Sản Phẩm", desc: "Làm mới cache danh sách sản phẩm và danh mục.", label: "Refresh Products", danger: false },
              ].map(action => (
                <Card key={action.title} className={action.danger ? "border-destructive/20" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                      <Button
                        variant={action.danger ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toast.info("Redis chưa được kết nối")}
                      >
                        {action.danger ? <Trash2 className="w-4 h-4 mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                        {action.label}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
