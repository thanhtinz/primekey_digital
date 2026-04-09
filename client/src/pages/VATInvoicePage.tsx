import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Receipt, Plus, Search, Download, FileText, CheckCircle2, Clock, XCircle, Building2 } from "@/components/Icon";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xuất", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  ISSUED: { label: "Đã xuất", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export default function VATInvoicePage() {
  const utils = trpc.useUtils();
  const { data: vatInvoices = [], isLoading } = trpc.vatInvoice.list.useQuery();
  const createMutation = trpc.vatInvoice.create.useMutation({
    onSuccess: () => { utils.vatInvoice.list.invalidate(); toast.success("Đã tạo yêu cầu hóa đơn VAT"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.vatInvoice.updateStatus.useMutation({
    onSuccess: () => { utils.vatInvoice.list.invalidate(); toast.success("Đã cập nhật trạng thái"); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    invoiceId: 0,
    companyName: "",
    taxCode: "",
    companyAddress: "",
    companyEmail: "",
    vatRate: 10,
  });

  const filtered = (vatInvoices as any[]).filter(v => {
    const matchSearch = !search || (v.companyName || "").toLowerCase().includes(search.toLowerCase()) || (v.taxCode || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: (vatInvoices as any[]).length,
    pending: (vatInvoices as any[]).filter(v => v.status === "PENDING").length,
    issued: (vatInvoices as any[]).filter(v => v.status === "ISSUED").length,
  };

  return (
    <DashboardLayoutCustom>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-400" />
              Hóa Đơn VAT
            </h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý yêu cầu xuất hóa đơn VAT từ khách hàng</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Tạo Yêu Cầu
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Tổng yêu cầu", value: counts.total, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
            { label: "Chờ xuất", value: counts.pending, color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" },
            { label: "Đã xuất", value: counts.issued, color: "from-green-500/20 to-green-600/10 border-green-500/30" },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-xl p-4`}>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên công ty, mã số thuế..." className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-white">Tất cả</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k} className="text-white">{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Chưa có yêu cầu hóa đơn VAT nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filtered.map((vat: any) => {
                const statusInfo = STATUS_MAP[vat.status] || STATUS_MAP.PENDING;
                return (
                  <div key={vat.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-white font-medium text-sm">{vat.companyName}</span>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">VAT {vat.vatRate}%</Badge>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">MST: {vat.taxCode} {vat.companyEmail && `• ${vat.companyEmail}`}</p>
                        {vat.companyAddress && <p className="text-slate-500 text-xs mt-0.5">{vat.companyAddress}</p>}
                        <p className="text-slate-500 text-xs mt-1">{new Date(vat.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                      <Select value={vat.status} onValueChange={s => updateMutation.mutate({ id: vat.id, status: s as any })}>
                        <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white text-xs h-8 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-xs">{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo Yêu Cầu Hóa Đơn VAT</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-slate-300 text-sm">Tên công ty *</Label>
              <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Công ty TNHH ABC" className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Mã số thuế *</Label>
                <Input value={form.taxCode} onChange={e => setForm(f => ({ ...f, taxCode: e.target.value }))} placeholder="0123456789" className="mt-1 bg-slate-800 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Thuế suất VAT (%)</Label>
                <Select value={String(form.vatRate)} onValueChange={v => setForm(f => ({ ...f, vatRate: Number(v) }))}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="0" className="text-white">0%</SelectItem>
                    <SelectItem value="5" className="text-white">5%</SelectItem>
                    <SelectItem value="8" className="text-white">8%</SelectItem>
                    <SelectItem value="10" className="text-white">10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Địa chỉ công ty</Label>
              <Input value={form.companyAddress} onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))} placeholder="123 Đường ABC, Quận 1, TP.HCM" className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Email nhận hóa đơn</Label>
              <Input type="email" value={form.companyEmail} onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))} placeholder="ketoan@company.com" className="mt-1 bg-slate-800 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-white">Hủy</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.companyName || !form.taxCode} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {createMutation.isPending ? "Đang tạo..." : "Tạo Yêu Cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
