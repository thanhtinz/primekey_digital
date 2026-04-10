import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Search, X } from "lucide-react";

export default function BlockIpAdmin() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ipAddress: "", reason: "" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [selected, setSelected] = useState<number[]>([]);

  const { data: blockedIps, refetch } = trpc.blockIp.list.useQuery();
  const addMutation = trpc.blockIp.add.useMutation({
    onSuccess: () => { toast.success("Đã block IP"); setShowAdd(false); setForm({ ipAddress: "", reason: "" }); refetch(); },
    onError: (e: any) => toast.error(e.message || "Lỗi"),
  });
  const deleteMutation = trpc.blockIp.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa IP"); refetch(); },
  });
  const deleteSelectedMutation = trpc.blockIp.deleteMany.useMutation({
    onSuccess: () => { toast.success(`Đã xóa ${selected.length} IP`); setSelected([]); refetch(); },
  });
  const cleanupMutation = trpc.blockIp.cleanup.useMutation({
    onSuccess: (r) => { toast.success(`Đã dọn dẹp ${r.deleted} IP hết hạn`); refetch(); },
  });

  const filtered = (blockedIps ?? []).filter(ip => {
    if (search && !ip.ipAddress.includes(search)) return false;
    if (sortBy === "active") return ip.isActive;
    if (sortBy === "expired") return !ip.isActive;
    return true;
  });

  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === filtered.length ? [] : filtered.map(ip => ip.id));

  return (
    <DashboardLayoutCustom>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Block IP</h1>
          <p className="ak-page-subtitle">Quản lý danh sách địa chỉ IP bị chặn truy cập</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => cleanupMutation.mutate()} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Dọn dẹp
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" /> Thêm IP cần Block
          </Button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 uppercase text-sm tracking-wide">Danh Sách IP Bị Chặn</h2>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3">
          <Input
            placeholder="Tìm IP"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang chặn</SelectItem>
              <SelectItem value="expired">Đã hết hạn</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-1" onClick={() => { setSearch(""); setSortBy("all"); }}>
            <Search className="h-4 w-4" /> Tìm kiếm
          </Button>
          <Button variant="outline" className="gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => { setSearch(""); setSortBy("all"); }}>
            <X className="h-4 w-4" /> Xóa bộ lọc
          </Button>
        </div>

        {/* Show / Sort controls */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-4 text-sm text-gray-600">
          <span>SHOW:</span>
          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["10", "25", "50", "100"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>SHORT BY DATE:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang chặn</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="p-3 w-10">
                  <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Địa chỉ IP</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Lý do</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Ngày block</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Hết hạn</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, parseInt(pageSize)).map(ip => (
                <tr key={ip.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <Checkbox checked={selected.includes(ip.id)} onCheckedChange={() => toggleSelect(ip.id)} />
                  </td>
                  <td className="p-3 font-mono text-sm text-gray-800">{ip.ipAddress}</td>
                  <td className="p-3 text-sm text-gray-600">{ip.reason || "—"}</td>
                  <td className="p-3 text-sm text-gray-500">{new Date(ip.blockedAt).toLocaleDateString("vi-VN")}</td>
                  <td className="p-3 text-sm text-gray-500">{ip.expiresAt ? new Date(ip.expiresAt).toLocaleDateString("vi-VN") : "Vĩnh viễn"}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ip.isActive ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                      {ip.isActive ? "Đang chặn" : "Hết hạn"}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                      onClick={() => { if (confirm("Xóa IP này?")) deleteMutation.mutate({ id: ip.id }); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Chưa có IP nào bị chặn</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          {selected.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { if (confirm(`Xóa ${selected.length} IP đã chọn?`)) deleteSelectedMutation.mutate({ ids: selected }); }}
            >
              <Trash2 className="h-4 w-4" /> Xóa IP Đã Chọn ({selected.length})
            </Button>
          )}
          <p className="text-sm text-gray-500 ml-auto">
            Showing {Math.min(parseInt(pageSize), filtered.length)} of {filtered.length} Results
          </p>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm IP Cần Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Địa chỉ IP <span className="text-red-500">(*)</span></Label>
              <Input
                value={form.ipAddress}
                onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))}
                placeholder="vd: 192.168.1.1 hoặc 2001:db8::1"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>Lý do</Label>
              <Input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Spam, tấn công, ..."
                className="mt-1"
              />
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => addMutation.mutate(form)}
              disabled={addMutation.isPending || !form.ipAddress}
            >
              {addMutation.isPending ? "Đang block..." : "Block IP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
