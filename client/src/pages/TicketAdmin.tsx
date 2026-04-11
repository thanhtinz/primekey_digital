import { useState } from "react";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Headphones, Clock, CheckCircle, AlertCircle, Send, User, Mail, RefreshCw, ChevronRight, X, ArrowLeft } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open:        { label: "Đang chờ",      color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700", icon: Clock },
  in_progress: { label: "Đang xử lý",   color: "text-blue-600",   bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",       icon: AlertCircle },
  resolved:    { label: "Đã giải quyết", color: "text-green-600",  bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",   icon: CheckCircle },
  closed:      { label: "Đã đóng",       color: "text-gray-500",   bg: "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",           icon: CheckCircle },
};

const PRIORITY_MAP: Record<string, { label: string; dot: string }> = {
  low:    { label: "Thấp",      dot: "bg-gray-400" },
  medium: { label: "Trung bình", dot: "bg-blue-500" },
  high:   { label: "Cao",       dot: "bg-red-500" },
};

const STATUS_TABS = [
  { key: "all",         label: "Tất cả" },
  { key: "open",        label: "Chờ" },
  { key: "in_progress", label: "Xử lý" },
  { key: "resolved",    label: "Xong" },
  { key: "closed",      label: "Đóng" },
];

export default function TicketAdmin() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [activeView, setActiveView] = useState<"open" | "all">("open");

  const { data: tickets = [], isLoading, refetch } = trpc.support.list.useQuery();
  const updateStatus = trpc.support.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Đã cập nhật ticket");
      setSelectedTicket(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Tickets đang mở (cần xử lý)
  const openTickets = (tickets as any[]).filter((t: any) => t.status === "open" || t.status === "in_progress");

  const filtered = (tickets as any[]).filter((t: any) => {
    const matchSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.customerEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts: Record<string, number> = {
    all: (tickets as any[]).length,
    open: (tickets as any[]).filter((t: any) => t.status === "open").length,
    in_progress: (tickets as any[]).filter((t: any) => t.status === "in_progress").length,
    resolved: (tickets as any[]).filter((t: any) => t.status === "resolved").length,
    closed: (tickets as any[]).filter((t: any) => t.status === "closed").length,
  };

  const handleReply = () => {
    if (!selectedTicket) return;
    updateStatus.mutate({
      id: selectedTicket.id,
      status: (newStatus || selectedTicket.status) as any,
      adminReply: reply || undefined,
    });
  };

  const openTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setReply(ticket.adminReply || "");
    setNewStatus(ticket.status);
  };

  return (
    <DashboardLayoutCustom>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold">Ticket Hỗ Trợ</h1>
              <p className="text-xs text-muted-foreground">Quản lý yêu cầu hỗ trợ từ khách hàng</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* View toggle: Open / All */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setActiveView("open")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeView === "open"
                  ? "bg-yellow-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Đang mở
              {openTickets.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeView === "open" ? "bg-white/30 text-white" : "bg-yellow-500 text-white"
                }`}>{openTickets.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveView("all")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeView === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              Tất cả ({counts.all})
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: "all", label: "Tất cả", color: "text-foreground" },
              { key: "open", label: "Đang chờ", color: "text-yellow-600" },
              { key: "in_progress", label: "Đang xử lý", color: "text-blue-600" },
              { key: "resolved", label: "Đã xong", color: "text-green-600" },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-colors ${
                  statusFilter === s.key
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/30 border-transparent hover:bg-muted/60"
                }`}
              >
                <span className={`text-xl font-bold leading-none ${s.color}`}>{counts[s.key]}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Search + filter tabs */}
          <div className="mt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 h-9 text-sm" placeholder="Tìm theo tiêu đề, email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className={`ml-1 ${statusFilter === tab.key ? "opacity-70" : "opacity-50"}`}>
                      ({counts[tab.key]})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : (activeView === "open" ? openTickets : filtered).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Headphones className="w-12 h-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground text-sm">
                {activeView === "open" ? "Đã xử lý hết ticket!" : "Không có ticket nào"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(activeView === "open" ? openTickets : filtered).map((ticket: any) => {
                const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
                const StatusIcon = status.icon;
                const isUnread = ticket.status === "open";
                return (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors active:bg-muted/60 ${isUnread ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-sm font-medium truncate ${isUnread ? "font-semibold" : ""}`}>
                            {ticket.subject}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {new Date(ticket.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1.5">{ticket.customerEmail}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{ticket.message}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {status.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel - full screen overlay on mobile, slide-in on desktop */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[420px] lg:border-l lg:border-border lg:shadow-2xl">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background">
            <button
              onClick={() => setSelectedTicket(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{selectedTicket.subject}</p>
              <p className="text-xs text-muted-foreground">{selectedTicket.customerEmail}</p>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="hidden lg:flex w-8 h-8 rounded-full items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Original message */}
            <div className="rounded-2xl bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium">{selectedTicket.customerEmail}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{selectedTicket.message}</p>
            </div>

            {/* Previous admin reply */}
            {selectedTicket.adminReply && (
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <i className="fa-solid fa-headset text-primary text-xs" />
                  </div>
                  <p className="text-xs font-medium text-primary">Phản hồi trước đó</p>
                </div>
                <p className="text-sm leading-relaxed">{selectedTicket.adminReply}</p>
              </div>
            )}

            {/* Status selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Cập nhật trạng thái</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_MAP).map(([k, v]) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={k}
                      onClick={() => setNewStatus(k)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        newStatus === k
                          ? `${v.bg} ${v.color} border-current`
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reply textarea */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Phản hồi khách hàng</label>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Nhập nội dung phản hồi..."
                rows={5}
                className="w-full border border-border rounded-2xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
            </div>
          </div>

          {/* Panel footer */}
          <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0 bg-background">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedTicket(null)}>
              Hủy
            </Button>
            <Button className="flex-1" onClick={handleReply} disabled={updateStatus.isPending}>
              <Send className="w-4 h-4 mr-1.5" />
              {updateStatus.isPending ? "Đang lưu..." : "Lưu & Phản hồi"}
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop for desktop panel */}
      {selectedTicket && (
        <div
          className="hidden lg:block fixed inset-0 z-40 bg-black/20"
          onClick={() => setSelectedTicket(null)}
        />
      )}
    </DashboardLayoutCustom>
  );
}
