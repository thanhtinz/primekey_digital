import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bell, Send, Clock, CheckCircle, XCircle, RefreshCw,
  FileText, Mail, AlertTriangle, Loader2, Settings2, CalendarClock
} from "lucide-react";

const REMINDER_HOURS_OPTIONS = [
  { value: "1", label: "1 giờ trước khi hết hạn" },
  { value: "2", label: "2 giờ trước khi hết hạn" },
  { value: "4", label: "4 giờ trước khi hết hạn" },
  { value: "6", label: "6 giờ trước khi hết hạn" },
  { value: "12", label: "12 giờ trước khi hết hạn" },
  { value: "24", label: "24 giờ (1 ngày) trước khi hết hạn" },
  { value: "48", label: "48 giờ (2 ngày) trước khi hết hạn" },
  { value: "72", label: "72 giờ (3 ngày) trước khi hết hạn" },
];

export default function Reminders() {
  const [isSending, setIsSending] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const { data: pendingInvoices, isLoading: pendingLoading, refetch: refetchPending } =
    trpc.reminders.getPending.useQuery();

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.reminders.getLogs.useQuery();

  const { data: userSettings, refetch: refetchSettings } =
    trpc.settings.get.useQuery();

  const sendRemindersMutation = trpc.reminders.sendPending.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã gửi ${data.sent}/${data.total} email nhắc nhở thành công!`);
      refetchPending();
      refetchLogs();
    },
    onError: (err) => {
      toast.error("Lỗi khi gửi nhắc nhở: " + err.message);
    },
  });

  const updateNotificationsMutation = trpc.settings.updateNotifications.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu cài đặt nhắc nhở");
      refetchSettings();
    },
    onError: () => {
      toast.error("Lưu cài đặt thất bại");
    },
  });

  const handleSendReminders = async () => {
    setIsSending(true);
    try {
      await sendRemindersMutation.mutateAsync();
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAutoReminder = async (enabled: boolean) => {
    setIsSavingSchedule(true);
    try {
      await updateNotificationsMutation.mutateAsync({ invoiceReminder: enabled });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleChangeReminderHours = async (hours: string) => {
    setIsSavingSchedule(true);
    try {
      await updateNotificationsMutation.mutateAsync({ reminderHoursBefore: parseInt(hours) });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("vi-VN");
  };

  const getHoursAgo = (date: Date | string) => {
    const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hours < 1) return "< 1 giờ";
    if (hours < 24) return `${Math.floor(hours)} giờ`;
    return `${Math.floor(hours / 24)} ngày`;
  };

  const autoReminderEnabled = userSettings?.invoiceReminder ?? true;
  const reminderHoursBefore = userSettings?.reminderHoursBefore ?? 24;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-orange-500" />
              Nhắc Nhở Thanh Toán
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tự động gửi email nhắc nhở khách hàng có đơn chưa thanh toán
            </p>
          </div>
          <Button
            onClick={handleSendReminders}
            disabled={isSending || sendRemindersMutation.isPending}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            {isSending || sendRemindersMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Gửi Nhắc Nhở Ngay
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingInvoices?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Đơn chờ nhắc nhở</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {logs?.filter(l => l.success).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Email gửi thành công</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {logs?.filter(l => !l.success).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Email gửi thất bại</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto Reminder Schedule Settings */}
        <Card className="shadow-sm border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              Cài Đặt Lên Lịch Nhắc Nhở Tự Động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Toggle auto reminder */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <Label htmlFor="auto-reminder-toggle" className="text-sm font-medium text-gray-800 cursor-pointer">
                  Bật nhắc nhở email tự động
                </Label>
                <p className="text-xs text-gray-500">
                  Hệ thống sẽ tự động gửi email nhắc nhở khi hóa đơn sắp hết hạn theo lịch đã cài đặt
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {isSavingSchedule && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                <Switch
                  id="auto-reminder-toggle"
                  checked={autoReminderEnabled}
                  onCheckedChange={handleToggleAutoReminder}
                  disabled={isSavingSchedule}
                />
              </div>
            </div>

            {/* Reminder hours before */}
            <div className={`p-4 rounded-lg border transition-opacity ${autoReminderEnabled ? "bg-white border-blue-100 opacity-100" : "bg-gray-50 border-gray-100 opacity-50 pointer-events-none"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-sm font-medium text-gray-800">
                    Thời điểm gửi nhắc nhở
                  </Label>
                  <p className="text-xs text-gray-500">
                    Gửi email nhắc nhở cho khách hàng trước khi hóa đơn hết hạn
                  </p>
                </div>
                <Select
                  value={String(reminderHoursBefore)}
                  onValueChange={handleChangeReminderHours}
                  disabled={isSavingSchedule || !autoReminderEnabled}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Chọn thời điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_HOURS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Settings2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-medium">Lưu ý về nhắc nhở tự động:</p>
                <ul className="space-y-0.5 list-disc list-inside text-blue-600">
                  <li>Nhắc nhở tự động chạy khi có sự kiện hệ thống (không phải cron job thời gian thực)</li>
                  <li>Để gửi ngay lập tức, nhấn nút <strong>"Gửi Nhắc Nhở Ngay"</strong> ở trên</li>
                  <li>Mỗi hóa đơn chỉ nhận tối đa 1 email nhắc nhở theo loại (24h/48h)</li>
                  <li>Cần cấu hình SMTP trong <strong>Cài Đặt → SMTP</strong> để gửi email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Đơn Hàng Chờ Nhắc Nhở ({pendingInvoices?.length || 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchPending()} className="gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />
                Làm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : !pendingInvoices || pendingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-3 opacity-30 text-green-500" />
                <p className="text-sm font-medium">Không có đơn hàng nào cần nhắc nhở</p>
                <p className="text-xs mt-1">Tất cả đơn hàng đã được thanh toán hoặc đã gửi nhắc nhở</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Số HĐ</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium hidden sm:table-cell">Khách Hàng</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Email</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Số Tiền</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvoices.map((inv: any) => {
                      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
                      const hoursOld = (Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60);
                      return (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-medium text-blue-600">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 text-gray-700 hidden sm:table-cell">{inv.customerName || "—"}</td>
                          <td className="py-3 px-3 text-gray-500 hidden md:table-cell">{inv.customerEmail || "—"}</td>
                          <td className="py-3 px-3 text-right font-medium">
                            {amount.toLocaleString("vi-VN")} VND
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="outline" className={`text-xs ${
                              hoursOld >= 48 ? "border-red-300 text-red-600 bg-red-50" : "border-orange-300 text-orange-600 bg-orange-50"
                            }`}>
                              {getHoursAgo(inv.createdAt)}
                              {hoursOld >= 48 ? " (48h)" : " (24h)"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder Logs */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Lịch Sử Gửi Nhắc Nhở
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchLogs()} className="gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />
                Làm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Chưa có lịch sử gửi nhắc nhở</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">ID Đơn</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Loại</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Trạng Thái</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium hidden sm:table-cell">Thời Gian Gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-blue-600">#{log.invoiceId}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            Nhắc {log.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3" />
                              Thất bại
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                          {formatDate(log.sentAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
