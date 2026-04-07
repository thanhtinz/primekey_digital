import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Mail, Send, Users, CheckCircle2, Trash2, Search } from "lucide-react";

export default function FlashSaleSubscriberSettings() {
  const utils = trpc.useUtils();
  const { data: subscribers = [] } = trpc.flashSaleSubscriber.list.useQuery();
  // sendNotification not yet implemented, use a placeholder
  const sendMutation = { mutate: (_: any) => toast.info("Tính năng gửi email đang được phát triển"), isPending: false };
  const deleteMutation = trpc.flashSaleSubscriber.delete.useMutation({
    onSuccess: () => { utils.flashSaleSubscriber.list.invalidate(); toast.success("Đã xóa"); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });

  const filtered = (subscribers as any[]).filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-400" />
            Thông Báo Flash Sale
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý danh sách đăng ký nhận thông báo Flash Sale qua email</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng đăng ký", value: (subscribers as any[]).length, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", icon: Users },
            { label: "Đã xác nhận", value: (subscribers as any[]).filter((s: any) => s.isConfirmed).length, color: "from-green-500/20 to-green-600/10 border-green-500/30", icon: CheckCircle2 },
            { label: "Chờ xác nhận", value: (subscribers as any[]).filter((s: any) => !s.isConfirmed).length, color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30", icon: Mail },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <p className="text-slate-400 text-xs">{s.label}</p>
                </div>
                <p className="text-white text-2xl font-bold">{s.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send notification */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-orange-400" /> Gửi Thông Báo Flash Sale
            </h2>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-sm">Tiêu đề email *</Label>
                <Input value={emailContent.subject} onChange={e => setEmailContent(f => ({ ...f, subject: e.target.value }))} placeholder="🔥 Flash Sale đặc biệt - Giảm đến 50%!" className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Nội dung email *</Label>
                <Textarea value={emailContent.body} onChange={e => setEmailContent(f => ({ ...f, body: e.target.value }))} placeholder="Xin chào! Chúng tôi đang có chương trình Flash Sale đặc biệt..." className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 resize-none" rows={5} />
              </div>
              <Button
                onClick={() => sendMutation.mutate(emailContent)}
                disabled={sendMutation.isPending || !emailContent.subject || !emailContent.body}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {sendMutation.isPending ? "Đang gửi..." : `Gửi đến ${(subscribers as any[]).filter((s: any) => s.isConfirmed).length} người đăng ký`}
              </Button>
            </div>
          </div>

          {/* Subscriber list */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" /> Danh Sách Đăng Ký
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm email..." className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 h-8 text-sm" />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Chưa có người đăng ký</div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filtered.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 text-sm truncate">{sub.email}</span>
                        {sub.isConfirmed ? (
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 flex-shrink-0">Đã xác nhận</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 flex-shrink-0">Chờ xác nhận</Badge>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: sub.id })} className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 h-6 w-6 p-0 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
