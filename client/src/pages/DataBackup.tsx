import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Database, Shield, Clock, CheckCircle } from "lucide-react";

export default function DataBackup() {
  const [downloading, setDownloading] = useState(false);
  const { data: weeklySettings, refetch } = trpc.settingsExt.getWeeklyReportSettings.useQuery();
  const [weeklyForm, setWeeklyForm] = useState({ weeklyReport: false, weeklyReportEmail: "" });

  // Sync form with server data
  useState(() => {
    if (weeklySettings) {
      setWeeklyForm({
        weeklyReport: weeklySettings.weeklyReport,
        weeklyReportEmail: weeklySettings.weeklyReportEmail,
      });
    }
  });

  const exportMutation = trpc.settingsExt.exportBackup.useMutation({
    onSuccess: (data) => {
      // Download the base64 Excel file
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.base64}`;
      link.download = data.filename;
      link.click();
      toast.success("Đã tải xuống file backup");
      setDownloading(false);
    },
    onError: (e: { message: string }) => {
      toast.error(e.message);
      setDownloading(false);
    },
  });

  const weeklyMutation = trpc.settingsExt.updateWeeklyReport.useMutation({
    onSuccess: () => { toast.success("Đã lưu cài đặt báo cáo tuần"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleExport = () => {
    setDownloading(true);
    exportMutation.mutate();
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sao Lưu Dữ Liệu</h1>
          <p className="text-muted-foreground text-sm mt-1">Xuất toàn bộ dữ liệu và cấu hình báo cáo tự động</p>
        </div>

        {/* Export backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Xuất Toàn Bộ Dữ Liệu
            </CardTitle>
            <CardDescription>
              Tải xuống file Excel chứa toàn bộ hóa đơn, khách hàng, sản phẩm và cài đặt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: "📄", label: "Hóa Đơn", desc: "Tất cả hóa đơn và trạng thái" },
                { icon: "👥", label: "Khách Hàng", desc: "Danh sách khách hàng" },
                { icon: "📦", label: "Sản Phẩm", desc: "Danh mục sản phẩm" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleExport} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Đang xuất..." : "Xuất File Excel (.xlsx)"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              File backup được mã hóa và chứa toàn bộ dữ liệu của bạn
            </p>
          </CardContent>
        </Card>

        {/* Weekly report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Báo Cáo Tuần Tự Động
            </CardTitle>
            <CardDescription>
              Nhận báo cáo doanh thu và tóm tắt hàng tuần qua email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border rounded-lg px-3">
              <div>
                <p className="font-medium text-sm">Bật báo cáo tuần</p>
                <p className="text-xs text-muted-foreground">Gửi mỗi thứ Hai lúc 8:00 sáng</p>
              </div>
              <Switch
                checked={weeklyForm.weeklyReport}
                onCheckedChange={v => setWeeklyForm(f => ({ ...f, weeklyReport: v }))}
              />
            </div>
            {weeklyForm.weeklyReport && (
              <div>
                <Label>Email nhận báo cáo</Label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={weeklyForm.weeklyReportEmail}
                  onChange={e => setWeeklyForm(f => ({ ...f, weeklyReportEmail: e.target.value }))}
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => weeklyMutation.mutate(weeklyForm)}
              disabled={weeklyMutation.isPending}
            >
              {weeklyMutation.isPending ? "Đang lưu..." : "Lưu Cài Đặt"}
            </Button>
          </CardContent>
        </Card>

        {/* Security note */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <p className="font-medium">Bảo Mật Dữ Liệu</p>
                <p>File backup chỉ chứa dữ liệu của bạn và không được chia sẻ với bên thứ ba. Hãy lưu trữ file backup ở nơi an toàn.</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">Dữ liệu được mã hóa trong quá trình truyền</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
