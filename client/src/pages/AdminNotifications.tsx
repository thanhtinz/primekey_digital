import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, Info, CheckCircle, AlertTriangle, ShoppingBag, CreditCard, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const typeOptions = [
  { value: "info", label: "Thông tin", icon: Info, color: "bg-blue-100 text-blue-700" },
  { value: "success", label: "Thành công", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  { value: "warning", label: "Cảnh báo", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700" },
  { value: "order", label: "Đơn hàng", icon: ShoppingBag, color: "bg-purple-100 text-purple-700" },
  { value: "payment", label: "Thanh toán", icon: CreditCard, color: "bg-emerald-100 text-emerald-700" },
  { value: "promo", label: "Khuyến mãi", icon: Tag, color: "bg-orange-100 text-orange-700" },
];

export default function AdminNotifications() {
  const { token } = useCustomerAuth();
  const [form, setForm] = useState({
    customerEmail: "",
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "order" | "payment" | "promo",
    link: "",
    sendToAll: false,
  });

  const customers = trpc.customers.list.useQuery();

  const createNotif = trpc.customerNotif.create.useMutation({
    onSuccess: () => {
      toast.success("Đã gửi thông báo thành công!");
      setForm(f => ({ ...f, customerEmail: "", title: "", message: "", link: "" }));
    },
    onError: (err) => {
      toast.error("Lỗi: " + err.message);
    },
  });

  const broadcastNotif = trpc.customerNotif.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã gửi thông báo đến ${data.count} khách hàng!`);
      setForm(f => ({ ...f, title: "", message: "", link: "" }));
    },
    onError: (err) => {
      toast.error("Lỗi: " + err.message);
    },
  });

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo");
      return;
    }
    if (form.sendToAll) {
      broadcastNotif.mutate({
        token: token || "",
        title: form.title,
        message: form.message,
        type: form.type,
        link: form.link || undefined,
      });
    } else {
      if (!form.customerEmail) {
        toast.error("Vui lòng chọn khách hàng");
        return;
      }
      createNotif.mutate({
        token: token || "",
        customerEmail: form.customerEmail,
        title: form.title,
        message: form.message,
        type: form.type,
        link: form.link || undefined,
      });
    }
  };

  const selectedType = typeOptions.find(t => t.value === form.type);

  return (
    <DashboardLayoutCustom>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gửi thông báo</h1>
          <p className="text-muted-foreground text-sm mt-1">Gửi thông báo đến khách hàng về đơn hàng, khuyến mãi, v.v.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Soạn thông báo
            </CardTitle>
            <CardDescription>Thông báo sẽ hiển thị trong icon chuông trên header của khách hàng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Send to all toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Gửi đến tất cả khách hàng</p>
                <p className="text-xs text-muted-foreground">Broadcast thông báo đến toàn bộ khách hàng đã đăng ký</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, sendToAll: !f.sendToAll }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.sendToAll ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.sendToAll ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Customer selector */}
            {!form.sendToAll && (
              <div className="space-y-1.5">
                <Label>Khách hàng</Label>
                <Select value={form.customerEmail} onValueChange={v => setForm(f => ({ ...f, customerEmail: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.data?.filter(c => c.email).map(c => (
                      <SelectItem key={c.email!} value={c.email!}>
                        <span className="font-medium">{c.name || c.email}</span>
                        {c.name && <span className="text-muted-foreground ml-1 text-xs">({c.email})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Loại thông báo</Label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value as typeof form.type }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.type === t.value ? t.color + " border-current" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Tiêu đề</Label>
              <Input
                placeholder="Ví dụ: Đơn hàng của bạn đã được xác nhận"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label>Nội dung</Label>
              <Textarea
                placeholder="Nội dung chi tiết của thông báo..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <Label>Link (tuỳ chọn)</Label>
              <Input
                placeholder="Ví dụ: /order/INV-XXXXX"
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              />
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Xem trước</p>
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-full ${selectedType?.color || "bg-blue-100 text-blue-700"}`}>
                    {selectedType && <selectedType.icon className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.title || "Tiêu đề thông báo"}</p>
                    <p className="text-xs text-muted-foreground">{form.message || "Nội dung thông báo..."}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={createNotif.isPending || broadcastNotif.isPending}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {form.sendToAll ? "Gửi đến tất cả khách hàng" : "Gửi thông báo"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutCustom>
  );
}
