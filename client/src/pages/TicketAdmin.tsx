import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Headphones, Clock, CheckCircle, AlertCircle, Send, User, Mail, RefreshCw } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Đang chờ", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  in_progress: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: AlertCircle },
  resolved: { label: "Đã giải quyết", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
  closed: { label: "Đã đóng", color: "bg-gray-500/10 text-gray-500 border-gray-200", icon: CheckCircle },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "Thấp", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Trung bình", color: "bg-blue-100 text-blue-600" },
  high: { label: "Cao", color: "bg-red-100 text-red-600" },
};

export default function TicketAdmin() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: tickets = [], isLoading, refetch } = trpc.support.list.useQuery();
  const updateStatus = trpc.support.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Đã cập nhật ticket");
      setSelectedTicket(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (tickets as any[]).filter((t: any) => {
    const matchSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.customerEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: (tickets as any[]).length,
    open: (tickets as any[]).filter((t: any) => t.status === "open").length,
    in_progress: (tickets as any[]).filter((t: any) => t.status === "in_progress").length,
    resolved: (tickets as any[]).filter((t: any) => t.status === "resolved").length,
  };

  const handleReply = () => {
    if (!selectedTicket) return;
    updateStatus.mutate({
      id: selectedTicket.id,
      status: (newStatus || selectedTicket.status) as any,
      adminReply: reply || undefined,
    });
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-4">
        <div className="ak-page-header">
          <h1 className="ak-page-title">Ticket Hỗ Trợ</h1>
          <p className="ak-page-subtitle">Quản lý yêu cầu hỗ trợ từ khách hàng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tất cả", count: counts.all, color: "text-foreground" },
            { label: "Đang chờ", count: counts.open, color: "text-yellow-600" },
            { label: "Đang xử lý", count: counts.in_progress, color: "text-blue-600" },
            { label: "Đã giải quyết", count: counts.resolved, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="cursor-pointer hover:shadow-sm" onClick={() => setStatusFilter(s.label === "Tất cả" ? "all" : Object.entries({ "Đang chờ": "open", "Đang xử lý": "in_progress", "Đã giải quyết": "resolved" }).find(([k]) => k === s.label)?.[1] || "all")}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm theo tiêu đề, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {["all", "open", "in_progress", "resolved", "closed"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "Tất cả" : STATUS_MAP[s]?.label || s}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Headphones className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Không có ticket nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket: any) => {
              const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
              const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
              const StatusIcon = status.icon;
              return (
                <Card key={ticket.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedTicket(ticket); setReply(ticket.adminReply || ""); setNewStatus(ticket.status); }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <Badge className={`text-xs flex-shrink-0 ${status.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className={`text-xs flex-shrink-0 ${priority.color}`}>{priority.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ticket.customerEmail}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {selectedTicket.customerEmail}
                  <span>·</span>
                  <Clock className="w-3.5 h-3.5" /> {new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}
                </div>
                <p className="text-sm">{selectedTicket.message}</p>
              </div>

              {selectedTicket.adminReply && (
                <div className="bg-blue-500/5 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Phản hồi trước đó:</p>
                  <p className="text-sm">{selectedTicket.adminReply}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trạng thái</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phản hồi</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Nhập phản hồi cho khách hàng..."
                  rows={4}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Hủy</Button>
            <Button onClick={handleReply} disabled={updateStatus.isPending}>
              <Send className="w-4 h-4 mr-1" />
              {updateStatus.isPending ? "Đang lưu..." : "Lưu & Phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
