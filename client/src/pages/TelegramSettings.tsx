import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Send, CheckCircle, AlertCircle, ExternalLink, Loader2,
  Users, Bell, Trash2, Globe, Shield
} from "@/components/Icon";

// ─── SwitchRow helper ──────────────────────────────────────────────────────────
function SwitchRow({ label, hint, checked, onCheckedChange }: {
  label: string; hint?: string; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── BotCard component ────────────────────────────────────────────────────────
function BotCard({
  botType, title, subtitle, iconClass, color, description,
}: {
  botType: "admin" | "user"; title: string; subtitle: string;
  iconClass: string; color: string; description: string;
}) {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.telegramBot.getConfig.useQuery({ botType });
  const saveConfig = trpc.telegramBot.saveConfig.useMutation({
    onSuccess: () => { toast.success("Đã lưu cấu hình!"); utils.telegramBot.getConfig.invalidate({ botType }); },
    onError: (e: any) => toast.error(e.message),
  });
  const testBot = trpc.telegramBot.testBot.useMutation({
    onSuccess: () => toast.success("Gửi tin nhắn test thành công!"),
    onError: (e: any) => toast.error(e.message),
  });
  const setWebhook = trpc.telegramBot.setWebhook.useMutation({
    onSuccess: () => { toast.success("Đã đặt webhook thành công!"); utils.telegramBot.getConfig.invalidate({ botType }); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeWebhook = trpc.telegramBot.removeWebhook.useMutation({
    onSuccess: () => { toast.success("Đã xóa webhook!"); utils.telegramBot.getConfig.invalidate({ botType }); },
    onError: (e: any) => toast.error(e.message),
  });

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  const [showToken, setShowToken] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!config) return;
    const c = config as any;
    setBotToken(c.botToken || "");
    setChatId(c.chatId || "");
    setEnabled(c.enabled ?? false);
    if (botType === "admin") {
      setNotifs({
        notifyNewOrder: c.notifyNewOrder ?? true,
        notifyPayment: c.notifyPayment ?? true,
        notifyRefund: c.notifyRefund ?? true,
        notifyStatusUpdate: c.notifyStatusUpdate ?? true,
        notifyNewCustomer: c.notifyNewCustomer ?? false,
        notifyLowStock: c.notifyLowStock ?? false,
        notifyNewReview: c.notifyNewReview ?? false,
        notifyNewTopup: c.notifyNewTopup ?? false,
        notifyFlashSaleEnd: c.notifyFlashSaleEnd ?? false,
        notifyDailyReport: c.notifyDailyReport ?? false,
        notifyNewTicket: c.notifyNewTicket ?? false,
        notifyWithdrawal: c.notifyWithdrawal ?? false,
      });
    } else {
      setNotifs({
        notifyOrderStatus: c.notifyOrderStatus ?? true,
        notifyOrderCreated: c.notifyOrderCreated ?? true,
        notifyOrderPaid: c.notifyOrderPaid ?? true,
        notifyOrderShipping: c.notifyOrderShipping ?? true,
        notifyOrderCompleted: c.notifyOrderCompleted ?? true,
        notifyWarranty: c.notifyWarranty ?? false,
        notifyFlashSale: c.notifyFlashSale ?? false,
        notifyPromotion: c.notifyPromotion ?? false,
      });
    }
  }, [config]);

  const handleSave = () => {
    saveConfig.mutate({ botType, botToken: botToken || undefined, chatId: chatId || undefined, enabled, ...notifs });
  };

  const isConfigured = !!(config as any)?.botToken;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white`}>
              <i className={`${iconClass} text-lg`} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">
                <CheckCircle className="h-3 w-3 mr-1" /> Đã cấu hình
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-slate-400">
                <AlertCircle className="h-3 w-3 mr-1" /> Chưa cấu hình
              </Badge>
            )}
            <Switch
              checked={enabled}
              onCheckedChange={v => { setEnabled(v); saveConfig.mutate({ botType, enabled: v }); }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Token & Chat ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Bot Token</Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="123456789:ABC-..."
                    className="pr-16 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Lấy từ{" "}
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    @BotFather
                  </a>
                </p>
              </div>
              {botType === "admin" && (
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Chat ID (Admin)</Label>
                  <Input
                    value={chatId}
                    onChange={e => setChatId(e.target.value)}
                    placeholder="-100xxxxxxxxx hoặc @channel"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ID của group/channel nhận thông báo admin
                  </p>
                </div>
              )}
            </div>

            {/* Notification settings - Accordion */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setNotifOpen(o => !o)}
                className="w-full px-4 py-3 bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
              >
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" /> Cài đặt thông báo
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                    ({Object.values(notifs).filter(Boolean).length}/{Object.keys(notifs).length} bật)
                  </span>
                </p>
                <i className={`fa fa-chevron-${notifOpen ? 'up' : 'down'} text-xs text-muted-foreground`} />
              </button>
              {notifOpen && (
                <div className="px-4 divide-y divide-border">
                  {botType === "admin" ? (
                    <>
                      <div className="py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Giao dịch</div>
                      <SwitchRow label="Đơn hàng mới" hint="Thông báo khi có đơn hàng mới" checked={notifs.notifyNewOrder ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyNewOrder: v }))} />
                      <SwitchRow label="Thanh toán thành công" hint="Khách hàng thanh toán xong" checked={notifs.notifyPayment ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyPayment: v }))} />
                      <SwitchRow label="Yêu cầu hoàn tiền" hint="Có yêu cầu hoàn tiền mới" checked={notifs.notifyRefund ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyRefund: v }))} />
                      <SwitchRow label="Cập nhật trạng thái" hint="Trạng thái đơn hàng thay đổi" checked={notifs.notifyStatusUpdate ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyStatusUpdate: v }))} />
                      <SwitchRow label="Yêu cầu rút tiền" hint="Affiliate/CTV yêu cầu rút tiền" checked={notifs.notifyWithdrawal ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyWithdrawal: v }))} />
                      <div className="py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Khách hàng</div>
                      <SwitchRow label="Khách hàng mới" hint="Khách hàng đăng ký mới" checked={notifs.notifyNewCustomer ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyNewCustomer: v }))} />
                      <SwitchRow label="Nạp tiền ví" hint="Khách hàng nạp tiền vào ví" checked={notifs.notifyNewTopup ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyNewTopup: v }))} />
                      <SwitchRow label="Đánh giá mới" hint="Khách hàng gửi đánh giá sản phẩm" checked={notifs.notifyNewReview ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyNewReview: v }))} />
                      <SwitchRow label="Ticket hỗ trợ mới" hint="Khách hàng gửi yêu cầu hỗ trợ" checked={notifs.notifyNewTicket ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyNewTicket: v }))} />
                      <div className="py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Vận hành</div>
                      <SwitchRow label="Tồn kho thấp" hint="Sản phẩm sắp hết hàng" checked={notifs.notifyLowStock ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyLowStock: v }))} />
                      <SwitchRow label="Flash Sale sắp kết thúc" hint="Flash sale còn ít thời gian" checked={notifs.notifyFlashSaleEnd ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyFlashSaleEnd: v }))} />
                      <SwitchRow label="Báo cáo hàng ngày" hint="Tóm tắt doanh thu cuối ngày" checked={notifs.notifyDailyReport ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyDailyReport: v }))} />
                    </>
                  ) : (
                    <>
                      <div className="py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái đơn hàng</div>
                      <SwitchRow label="Đơn hàng được tạo" hint="Xác nhận khi đơn hàng được tạo" checked={notifs.notifyOrderCreated ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyOrderCreated: v }))} />
                      <SwitchRow label="Thanh toán thành công" hint="Khi đơn hàng được thanh toán" checked={notifs.notifyOrderPaid ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyOrderPaid: v }))} />
                      <SwitchRow label="Đang giao hàng" hint="Khi đơn hàng chuyển sang SHIPPING" checked={notifs.notifyOrderShipping ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyOrderShipping: v }))} />
                      <SwitchRow label="Hoàn thành" hint="Khi đơn hàng được hoàn thành" checked={notifs.notifyOrderCompleted ?? true} onCheckedChange={v => setNotifs(n => ({ ...n, notifyOrderCompleted: v }))} />
                      <SwitchRow label="Bảo hành" hint="Khi đơn hàng chuyển sang bảo hành" checked={notifs.notifyWarranty ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyWarranty: v }))} />
                      <div className="py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Khuyến mãi</div>
                      <SwitchRow label="Flash Sale" hint="Thông báo khi có flash sale mới" checked={notifs.notifyFlashSale ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyFlashSale: v }))} />
                      <SwitchRow label="Khuyến mãi & ưu đãi" hint="Thông báo về mã giảm giá và ưu đãi" checked={notifs.notifyPromotion ?? false} onCheckedChange={v => setNotifs(n => ({ ...n, notifyPromotion: v }))} />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Webhook info for user bot */}
            {botType === "user" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-800">Webhook (User Bot)</p>
                  {(config as any)?.webhookSet ? (
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">Đã đặt</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">Chưa đặt</Badge>
                  )}
                </div>
                <p className="text-xs text-blue-700">
                  User Bot cần webhook để nhận tin nhắn từ khách hàng. Nhấn "Đặt Webhook" sau khi cấu hình Bot Token.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => setWebhook.mutate({ origin: window.location.origin })}
                    disabled={setWebhook.isPending || !isConfigured}
                  >
                    {setWebhook.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                    Đặt Webhook
                  </Button>
                  {(config as any)?.webhookSet && (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => removeWebhook.mutate()}
                      disabled={removeWebhook.isPending}
                    >
                      {removeWebhook.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Xóa Webhook
                    </Button>
                  )}
                </div>
                <div className="bg-white border border-blue-200 rounded-lg p-2.5 mt-1">
                  <p className="text-[11px] font-semibold text-blue-700 mb-1">Hướng dẫn liên kết tài khoản:</p>
                  <ol className="text-[11px] text-blue-600 space-y-0.5 list-decimal list-inside">
                    <li>Khách hàng mở Telegram, tìm bot của bạn</li>
                    <li>Gửi lệnh <code className="bg-blue-100 px-1 rounded">/start</code></li>
                    <li>Bot sẽ yêu cầu nhập email tài khoản</li>
                    <li>Sau khi xác nhận, khách sẽ nhận thông báo tự động</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={handleSave} disabled={saveConfig.isPending} className="gap-2">
                {saveConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Lưu cấu hình
              </Button>
              <Button
                variant="outline" onClick={() => testBot.mutate({ botType, chatId: chatId || undefined })}
                disabled={testBot.isPending || !isConfigured}
                className="gap-2"
              >
                {testBot.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Test kết nối
              </Button>
              <a href="https://core.telegram.org/bots#how-do-i-create-a-bot" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> Tài liệu
                </Button>
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Subscribers Panel ────────────────────────────────────────────────────────
function SubscribersPanel() {
  const utils = trpc.useUtils();
  const { data: subscribers = [], isLoading } = trpc.telegramBot.getSubscribers.useQuery();
  const removeSubscriber = trpc.telegramBot.removeSubscriber.useMutation({
    onSuccess: () => { toast.success("Đã xóa subscriber"); utils.telegramBot.getSubscribers.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const broadcast = trpc.telegramBot.broadcast.useMutation({
    onSuccess: (d: any) => { toast.success(`Đã gửi đến ${d.sent}/${d.total} người`); setBroadcastMsg(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const activeCount = (subscribers as any[]).filter((s: any) => s.isActive).length;
  const inactiveCount = (subscribers as any[]).length - activeCount;
  const filteredSubs = (subscribers as any[]).filter((s: any) => {
    const matchFilter = filter === "all" || (filter === "active" ? s.isActive : !s.isActive);
    const q = search.toLowerCase();
    const matchSearch = !q || (s.firstName || "").toLowerCase().includes(q) || (s.username || "").toLowerCase().includes(q) || (s.customerEmail || "").toLowerCase().includes(q) || (s.customerName || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Subscribers</CardTitle>
              <CardDescription className="text-xs">Khách hàng đã liên kết User Bot</CardDescription>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
            {activeCount} đang hoạt động
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + Filter */}
        {!isLoading && (subscribers as any[]).length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên, @username, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm px-3 py-1.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-1">
              {(["all", "active", "inactive"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                    filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {f === "all" ? `Tất cả (${(subscribers as any[]).length})` : f === "active" ? `Hoạt động (${activeCount})` : `Đã tắt (${inactiveCount})`}
                </button>
              ))}
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (subscribers as any[]).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Chưa có khách hàng nào liên kết</p>
            <p className="text-xs mt-1">Khách hàng cần nhắn /start cho User Bot để liên kết</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Không tìm thấy kết quả phù hợp</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSubs.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sub.isActive ? "bg-emerald-100" : "bg-slate-100"}`}>
                  <i className={`fa fa-user text-xs ${sub.isActive ? "text-emerald-600" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{sub.customerName || sub.firstName || "Khách hàng"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sub.customerEmail || (sub.username ? `@${sub.username}` : `Chat ID: ${sub.chatId}`)}
                  </p>
                  {sub.username && <p className="text-[11px] text-muted-foreground/70">@{sub.username}</p>}
                </div>
                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${sub.isActive ? "text-emerald-600 border-emerald-300" : "text-slate-400"}`}>
                  {sub.isActive ? "Hoạt động" : "Đã tắt"}
                </Badge>
                <Button
                  variant="ghost" size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-7 w-7 p-0"
                  onClick={() => removeSubscriber.mutate({ subscriberId: sub.id })}
                  disabled={removeSubscriber.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Broadcast */}
        {activeCount > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-purple-600" /> Gửi tin nhắn hàng loạt
            </p>
            <Textarea
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="Nhập nội dung tin nhắn..."
              rows={3}
              className="resize-none text-sm mb-2"
              maxLength={4096}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{broadcastMsg.length}/4096 ký tự</p>
              <Button
                size="sm" onClick={() => broadcast.mutate({ message: broadcastMsg })}
                disabled={!broadcastMsg.trim() || broadcast.isPending}
                className="gap-1.5"
              >
                {broadcast.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Gửi đến {activeCount} người
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TelegramSettings() {
  return (
    <DashboardLayoutCustom>
      <div className="space-y-5 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="ak-page-title flex items-center gap-2">
            <i className="fa-brands fa-telegram text-blue-500" />
            Telegram Bot
          </h1>
          <p className="ak-page-subtitle">
            Cấu hình 2 bot Telegram: <strong>Admin Bot</strong> nhận thông báo vận hành, <strong>User Bot</strong> gửi thông báo đơn hàng cho khách hàng
          </p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-bold text-blue-800">Admin Bot</p>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>🛒 Thông báo đơn hàng mới</li>
              <li>✅ Xác nhận thanh toán</li>
              <li>🔄 Yêu cầu hoàn tiền</li>
              <li>👋 Khách hàng mới đăng ký</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-bold text-purple-800">User Bot</p>
            </div>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>📦 Cập nhật trạng thái đơn hàng</li>
              <li>💰 Xác nhận thanh toán</li>
              <li>🎉 Thông báo hoàn thành</li>
              <li>📢 Broadcast tin nhắn hàng loạt</li>
            </ul>
          </div>
        </div>

        {/* Admin Bot */}
        <BotCard
          botType="admin"
          title="Admin Bot"
          subtitle="Thông báo vận hành cho quản trị viên"
          iconClass="fa fa-shield-halved"
          color="bg-blue-500"
          description="Bot này gửi thông báo về các hoạt động quan trọng đến group/channel Telegram của admin. Chỉ cần cấu hình Bot Token và Chat ID."
        />

        {/* User Bot */}
        <BotCard
          botType="user"
          title="User Bot"
          subtitle="Thông báo đơn hàng cho khách hàng"
          iconClass="fa fa-users"
          color="bg-purple-500"
          description="Bot này gửi thông báo cá nhân đến từng khách hàng. Khách hàng cần nhắn /start cho bot và cung cấp email để liên kết tài khoản."
        />

        {/* Subscribers */}
        <SubscribersPanel />
      </div>
    </DashboardLayoutCustom>
  );
}
