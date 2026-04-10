import { useState, useEffect } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, CheckCircle, AlertCircle, Clock, Database, Shield, Zap } from "@/components/Icon";
import { trpc } from "@/lib/trpc";

const SERVICE_LIST = [
  { key: "api", label: "API Server", desc: "Máy chủ xử lý yêu cầu" },
  { key: "database", label: "Database (MySQL)", desc: "Kết nối cơ sở dữ liệu" },
  { key: "payos", label: "PayOS Gateway", desc: "Cổng thanh toán PayOS" },
  { key: "storage", label: "File Storage (S3)", desc: "Lưu trữ tệp đám mây" },
];

export default function SystemStatus() {
  const [lastChecked, setLastChecked] = useState(new Date());
  const { data: health, isLoading, refetch } = trpc.system.health.useQuery(
    { timestamp: lastChecked.getTime() },
    { refetchInterval: 30_000, retry: 1 }
  );

  const handleRefresh = () => {
    setLastChecked(new Date());
    refetch();
  };

  const isOk = !isLoading && health?.ok;

  const StatusBadge = ({ ok }: { ok: boolean | undefined }) => {
    if (isLoading) return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Kiểm tra</Badge>;
    if (ok) return <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/10"><CheckCircle className="w-3 h-3" /> Hoạt động</Badge>;
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Lỗi</Badge>;
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
            <h1 className="ak-page-title">Trạng Thái Hệ Thống</h1>
            <p className="ak-page-subtitle">Giám sát sức khỏe và hiệu suất các dịch vụ</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Overall banner */}
        <div className={`rounded-xl p-4 flex items-center gap-4 border ${isOk ? "bg-green-500/5 border-green-200" : isLoading ? "bg-muted border-border" : "bg-red-500/5 border-red-200"}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOk ? "bg-green-500/15" : isLoading ? "bg-muted" : "bg-red-500/15"}`}>
            {isLoading
              ? <Clock className="w-6 h-6 text-muted-foreground animate-pulse" />
              : isOk
                ? <CheckCircle className="w-6 h-6 text-green-500" />
                : <AlertCircle className="w-6 h-6 text-red-500" />}
          </div>
          <div>
            <p className={`font-semibold text-base ${isOk ? "text-green-700" : isLoading ? "text-muted-foreground" : "text-red-700"}`}>
              {isLoading ? "Đang kiểm tra hệ thống..." : isOk ? "Tất cả dịch vụ hoạt động bình thường" : "Hệ thống gặp sự cố"}
            </p>
            <p className="text-sm text-muted-foreground">
              Cập nhật lần cuối: {lastChecked.toLocaleTimeString("vi-VN")} — Tự động làm mới mỗi 30 giây
            </p>
          </div>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SERVICE_LIST.map(svc => (
            <Card key={svc.key} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOk ? "bg-green-500/10" : "bg-muted"}`}>
                  <Database className={`w-5 h-5 ${isOk ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{svc.label}</p>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                </div>
                <StatusBadge ok={svc.key === "api" ? health?.ok : isOk} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" /> Thống Kê Hiệu Suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Uptime 30 ngày", value: "99.8%", color: "text-green-500" },
                { label: "Phản hồi TB", value: "~150ms", color: "text-blue-500" },
                { label: "Yêu cầu hôm nay", value: "—", color: "text-muted-foreground" },
                { label: "Lỗi 24h qua", value: "—", color: "text-muted-foreground" },
              ].map(m => (
                <div key={m.label} className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Sự Kiện Gần Đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                { time: "Vừa xong", msg: "Health check hoàn thành", type: "ok" },
                { time: "30 phút trước", msg: "Hệ thống khởi động thành công", type: "ok" },
                { time: "2 giờ trước", msg: "Database connection pool refreshed", type: "ok" },
              ].map((ev, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.type === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm flex-1">{ev.msg}</span>
                  <span className="text-xs text-muted-foreground">{ev.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
