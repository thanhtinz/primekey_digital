import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bot, CheckCircle, AlertCircle, ExternalLink } from "@/components/Icon";

export default function TelegramSettings() {
  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const [form, setForm] = useState({ telegramBotToken: "", telegramChatId: "", telegramEnabled: false });

  useEffect(() => {
    if (settings) {
      setForm({
        telegramBotToken: (settings as any).telegramBotToken || "",
        telegramChatId: (settings as any).telegramChatId || "",
        telegramEnabled: (settings as any).telegramEnabled || false,
      });
    }
  }, [settings]);

  const saveMutation = trpc.settingsExt.updateTelegram.useMutation({
    onSuccess: () => { toast.success("Đã lưu cài đặt Telegram"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const testMutation = trpc.settingsExt.testTelegram.useMutation({
    onSuccess: () => toast.success("✅ Gửi tin nhắn test thành công!"),
    onError: (e: { message: string }) => toast.error(`Lỗi: ${e.message}`),
  });

  const isConfigured = form.telegramBotToken && form.telegramChatId;

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Thông Báo Telegram</h1>
          <p className="text-muted-foreground text-sm mt-1">Nhận thông báo tức thì khi có đơn hàng mới hoặc thanh toán thành công</p>
        </div>

        {/* Hướng dẫn */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Bot className="w-4 h-4" />
              Hướng dẫn cài đặt
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p><strong>Bước 1:</strong> Mở Telegram, tìm <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-3 h-3" /></a> và gõ <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/newbot</code></p>
            <p><strong>Bước 2:</strong> Đặt tên và username cho bot, BotFather sẽ cấp <strong>Bot Token</strong></p>
            <p><strong>Bước 3:</strong> Nhắn tin cho bot của bạn, sau đó truy cập <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> để lấy <strong>Chat ID</strong></p>
          </CardContent>
        </Card>

        {/* Form cài đặt */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Bot</CardTitle>
            <CardDescription>Nhập thông tin bot Telegram của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bot Token *</Label>
              <Input
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={form.telegramBotToken}
                onChange={e => setForm(f => ({ ...f, telegramBotToken: e.target.value }))}
                type="password"
              />
              <p className="text-xs text-muted-foreground mt-1">Token từ @BotFather</p>
            </div>
            <div>
              <Label>Chat ID *</Label>
              <Input
                placeholder="-1001234567890 hoặc 123456789"
                value={form.telegramChatId}
                onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">ID của chat/group nhận thông báo</p>
            </div>
            <div className="flex items-center justify-between py-2 border rounded-lg px-3">
              <div>
                <p className="font-medium text-sm">Bật thông báo Telegram</p>
                <p className="text-xs text-muted-foreground">Nhận thông báo khi có đơn mới, thanh toán, cập nhật trạng thái</p>
              </div>
              <Switch
                checked={form.telegramEnabled}
                onCheckedChange={v => setForm(f => ({ ...f, telegramEnabled: v }))}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? "Đang lưu..." : "Lưu Cài Đặt"}
              </Button>
              <Button
                variant="outline"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || !isConfigured}
              >
                <Send className="w-4 h-4 mr-2" />
                {testMutation.isPending ? "Đang gửi..." : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trạng thái */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trạng Thái Kết Nối</CardTitle>
          </CardHeader>
          <CardContent>
            {isConfigured && form.telegramEnabled ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Đã kết nối và đang hoạt động</span>
                <Badge variant="outline" className="text-green-600 border-green-300">Active</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{!isConfigured ? "Chưa cấu hình Bot Token và Chat ID" : "Thông báo đang tắt"}</span>
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>📄 Thông báo khi tạo hóa đơn mới</p>
              <p>💰 Thông báo khi thanh toán thành công</p>
              <p>🚚 Thông báo khi cập nhật trạng thái đơn hàng</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
