/**
 * InventoryAdmin - Quản lý kho hàng
 * Stats: Tổng / Còn hàng / Đã bán
 * Filter: Sản phẩm, Gói, Tìm kiếm, Trạng thái, Số lượng/trang
 * Table: Checkbox, ID, Gói sản phẩm, Giá trị kho hàng, Trạng thái, Ngày tạo, Ngày cập nhật, Thao tác
 */
import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, CheckCircle2, XCircle, Filter, X, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Users, AlertCircle, Clock, Search,
} from "@/components/Icon";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = "available" | "used" | "reserved";

const STATUS_CONFIG: Record<StatusType, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  available: {
    label: "Còn hàng",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  used: {
    label: "Đã bán",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  reserved: {
    label: "Đặt trước",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusType] ?? { label: status, badgeClass: "bg-gray-100 text-gray-600", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badgeClass}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

// ─── View Dialog ─────────────────────────────────────────────────────────────
function ViewDialog({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Chi tiết kho hàng #{item.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500 text-xs mb-1">ID</p>
              <p className="font-mono font-semibold text-blue-600">#{item.id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Trạng thái</p>
              <StatusBadge status={item.status} />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Sản phẩm</p>
              <p className="font-medium text-gray-800">{item.productName ?? `ID ${item.productId}`}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Gói sản phẩm</p>
              <p className="font-medium text-gray-800">{item.packageName ?? (item.packageId ? `ID ${item.packageId}` : "—")}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Ngày tạo</p>
              <p className="text-gray-700">{formatDate(item.createdAt)}</p>
            </div>
            {item.assignedOrderId && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Đơn hàng</p>
                <p className="font-mono text-gray-700">#{item.assignedOrderId}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Giá trị kho hàng</p>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {item.stockData}
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ─────────────────────────────────────────────────────────────
function EditDialog({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [stockData, setStockData] = useState(item.stockData);
  const [status, setStatus] = useState<StatusType>(item.status);

  const updateDataMutation = trpc.inventory.updateStockData.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật giá trị kho"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.inventory.updateStatus.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật trạng thái"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = async () => {
    if (stockData !== item.stockData) {
      await updateDataMutation.mutateAsync({ id: item.id, stockData });
    } else if (status !== item.status) {
      await updateStatusMutation.mutateAsync({ id: item.id, status });
    } else {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-amber-500" />
            Sửa kho hàng #{item.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Sản phẩm / Gói</Label>
            <p className="text-sm font-medium text-gray-800">
              {item.productName ?? `ID ${item.productId}`}
              {item.packageName && <span className="text-gray-500"> — {item.packageName}</span>}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Còn hàng</SelectItem>
                <SelectItem value="used">Đã bán</SelectItem>
                <SelectItem value="reserved">Đặt trước</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Giá trị kho hàng</Label>
            <Textarea
              value={stockData}
              onChange={(e) => setStockData(e.target.value)}
              rows={6}
              className="font-mono text-xs"
              placeholder="Nhập giá trị kho hàng..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={handleSave}
            disabled={updateDataMutation.isPending || updateStatusMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {(updateDataMutation.isPending || updateStatusMutation.isPending) ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventoryAdmin() {
  // ── Filters ─────────────────────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  // Applied filters (only applied on click "Lọc")
  const [applied, setApplied] = useState({ productSearch: "", packageSearch: "", search: "", status: "all" });

  // ── Selection ────────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Dialogs ──────────────────────────────────────────────────────────────────
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: stats, refetch: refetchStats } = trpc.inventory.stats.useQuery();

  // Build query params from applied filters
  const queryParams = useMemo(() => {
    const p: any = { page, limit: pageSize };
    if (applied.status && applied.status !== "all") p.status = applied.status;
    if (applied.search) p.search = applied.search;
    return p;
  }, [page, pageSize, applied]);

  const { data, isLoading, refetch } = trpc.inventory.list.useQuery(queryParams);

  // Products & packages for filter dropdowns
  const { data: productsData } = trpc.products.list.useQuery();
  const products = (productsData ?? []) as any[];
  // ── Mutations ──────────────────────────────────────────────────────────────────
  const addMutation = trpc.inventory.add.useMutation({
    onSuccess: ({ added }) => { toast.success(`Đã nhập ${added} mục vào kho`); setShowAddDialog(false); refetch(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); refetch(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const bulkDeleteMutation = trpc.inventory.bulkDelete.useMutation({
    onSuccess: ({ deleted }) => {
      toast.success(`Đã xóa ${deleted} mục`);
      setSelected(new Set());
      refetch();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const applyFilters = () => {
    setApplied({ productSearch, packageSearch, search, status: statusFilter });
    setPage(1);
    setSelected(new Set());
  };

  const clearFilters = () => {
    setProductSearch(""); setPackageSearch(""); setSearch(""); setStatusFilter("all");
    setApplied({ productSearch: "", packageSearch: "", search: "", status: "all" });
    setPage(1);
    setSelected(new Set());
  };

  const items = (data?.items ?? []) as any[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); items.forEach((i) => n.delete(i.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); items.forEach((i) => n.add(i.id)); return n; });
    }
  };

  const toggleOne = (id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Filter products by search
  const filteredProducts = products.filter((p: any) =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Pagination pages
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <DashboardLayoutCustom>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quản lý kho hàng</h1>
              <p className="text-xs text-gray-500">Quản lý toàn bộ mã kho, tài khoản và giá trị sản phẩm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              onClick={() => setShowAddDialog(true)}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Nhập kho</span>
              <span className="sm:hidden">+</span>
            </Button>
            {someSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Xóa ${selected.size} mục đã chọn?`)) {
                    bulkDeleteMutation.mutate({ ids: Array.from(selected) });
                  }
                }}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Xóa {selected.size} mục
              </Button>
            )}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">Tổng số lượng</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{(stats?.total ?? 0).toLocaleString("vi-VN")}</p>
            </div>
          </div>
          {/* Available */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">Còn hàng</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 leading-tight">{(stats?.available ?? 0).toLocaleString("vi-VN")}</p>
            </div>
          </div>
          {/* Used */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 leading-tight">Đã bán</p>
              <p className="text-lg sm:text-2xl font-bold text-red-500 leading-tight">{(stats?.used ?? 0).toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Product filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Sản phẩm</label>
              <div className="relative">
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-9 pr-8 text-sm"
                />
                <Search className="absolute right-2.5 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            {/* Package filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Gói sản phẩm</label>
              <div className="relative">
                <Input
                  placeholder="Tìm kiếm gói..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="h-9 pr-8 text-sm"
                />
                <Search className="absolute right-2.5 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            {/* Search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Tìm kiếm</label>
              <Input
                placeholder="Giá trị kho hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="available">Còn hàng</SelectItem>
                  <SelectItem value="used">Đã bán</SelectItem>
                  <SelectItem value="reserved">Đặt trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Page size */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Số lượng/trang</label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Filter buttons */}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Lọc
            </Button>
            <Button size="sm" variant="outline" onClick={clearFilters} className="gap-1.5 text-gray-600">
              <X className="h-3.5 w-3.5" /> Bỏ lọc
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-10 px-4 py-3 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gói sản phẩm</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Giá trị kho hàng</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Trạng thái</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32 hidden sm:table-cell">Ngày tạo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32 hidden lg:table-cell">Ngày cập nhật</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-200 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-7 w-24 bg-gray-200 rounded" /></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Package className="h-12 w-12 opacity-30" />
                        <p className="text-sm font-medium">Không có dữ liệu kho hàng</p>
                        <p className="text-xs">Thêm sản phẩm kiểu "Kho hàng" để bắt đầu quản lý</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isChecked = selected.has(item.id);
                    const productLabel = item.productName
                      ? (item.packageName ? `${item.productName} - ${item.packageName}` : item.productName)
                      : `Sản phẩm #${item.productId}`;
                    const stockPreview = item.stockData.length > 60
                      ? item.stockData.slice(0, 60) + "..."
                      : item.stockData;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${isChecked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleOne(item.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-blue-600 font-semibold text-xs">{item.id}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-blue-600 font-medium hover:underline cursor-pointer text-xs" onClick={() => setViewItem(item)}>
                            {productLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 max-w-[180px] hidden md:table-cell">
                          <span className="text-gray-600 text-xs font-mono break-all line-clamp-2">{stockPreview}</span>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-1.5 sm:px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 gap-1"
                              onClick={() => setViewItem(item)}
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline">Xem</span>
                            </Button>
                            {item.status === "available" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-1.5 sm:px-2 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 gap-1"
                                onClick={() => setEditItem(item)}
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="hidden sm:inline">Sửa</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-1.5 sm:px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1"
                              onClick={() => {
                                if (confirm(`Xóa mục #${item.id}?`)) {
                                  deleteMutation.mutate({ id: item.id });
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Xóa</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total.toLocaleString("vi-VN")} Results
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs ${page === p ? "bg-blue-600 text-white border-blue-600" : ""}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      {viewItem && <ViewDialog item={viewItem} onClose={() => setViewItem(null)} />}
      {editItem && (
        <EditDialog
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { refetch(); refetchStats(); }}
        />
      )}
      {/* ── Add Dialog ── */}
      <AddInventoryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        products={products}
        onAdd={(productId, packageId, items) => addMutation.mutate({ productId, packageId, items })}
        isPending={addMutation.isPending}
      />
    </DashboardLayoutCustom>
  );
}
// ─── AddInventoryDialog ──────────────────────────────────────────────────────────────────
function AddInventoryDialog({
  open, onClose, products, onAdd, isPending,
}: {
  open: boolean;
  onClose: () => void;
  products: any[];
  onAdd: (productId: number, packageId: number | undefined, items: string[]) => void;
  isPending: boolean;
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [rawText, setRawText] = useState("");

  const selectedProduct = products.find((p) => String(p.id) === selectedProductId);
  const packages = selectedProduct?.packages ?? [];

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleSubmit = () => {
    if (!selectedProductId) { toast.error("Vui lòng chọn sản phẩm"); return; }
    if (lines.length === 0) { toast.error("Chưa có dữ liệu nào"); return; }
    onAdd(
      Number(selectedProductId),
      selectedPackageId ? Number(selectedPackageId) : undefined,
      lines,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Nhập kho hàng
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Product select */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sản phẩm <span className="text-red-500">*</span></Label>
            <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setSelectedPackageId(""); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Chọn sản phẩm..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Package select */}
          {packages.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Gói sản phẩm</Label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn gói (tùy chọn)..." />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg: any) => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Bulk input */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Dữ liệu kho hàng
              {lines.length > 0 && (
                <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {lines.length} mục
                </span>
              )}
            </Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="font-mono text-xs resize-none"
              placeholder={`Mỗi dòng là một mục kho hàng.\nVí dụ:\nTài khoản: abc@gmail.com | Mật khẩu: 123456\nTài khoản: xyz@gmail.com | Mật khẩu: 789012`}
            />
            <p className="text-xs text-gray-400">Mỗi dòng = 1 mục kho. Dòng trống sẽ bị bỏ qua.</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedProductId || lines.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            {isPending ? "Đang nhập..." : `Nhập ${lines.length > 0 ? lines.length + " mục" : "kho"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
