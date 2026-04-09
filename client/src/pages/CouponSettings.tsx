import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Copy, Calendar, Users, TicketCheck, Search, Loader2, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Eye, EyeOff, Zap } from "@/components/Icon";

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CouponSettings() {
  const utils = trpc.useUtils();
  const { data: coupons = [], isLoading } = trpc.coupon.list.useQuery(undefined, { staleTime: 10_000 });
  const { data: statsData, isLoading: statsLoading } = trpc.coupon.stats.useQuery(undefined, { staleTime: 15_000 });
  const createMut = trpc.coupon.create.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); utils.coupon.stats.invalidate(); setDialogOpen(false); resetForm(); toast.success("Tạo mã giảm giá thành công"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.coupon.update.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); utils.coupon.stats.invalidate(); setDialogOpen(false); resetForm(); toast.success("Cập nhật thành công"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.coupon.delete.useMutation({
    onSuccess: () => { utils.coupon.list.invalidate(); utils.coupon.stats.invalidate(); toast.success("Đã xóa mã giảm giá"); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [activeTab, setActiveTab] = useState("manage");
  const [form, setForm] = useState({
    code: "", description: "", discountType: "percent" as "percent" | "fixed",
    discountValue: 0, minOrderAmount: 0, maxDiscountAmount: 0,
    maxUses: 0, maxUsesPerCustomer: 1, startsAt: "", expiresAt: "", isActive: true,
  });

  const resetForm = () => {
    setForm({ code: "", description: "", discountType: "percent", discountValue: 0, minOrderAmount: 0, maxDiscountAmount: 0, maxUses: 0, maxUsesPerCustomer: 1, startsAt: "", expiresAt: "", isActive: true });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || "", discountType: c.discountType,
      discountValue: Number(c.discountValue), minOrderAmount: Number(c.minOrderAmount || 0),
      maxDiscountAmount: Number(c.maxDiscountAmount || 0), maxUses: c.maxUses || 0,
      maxUsesPerCustomer: c.maxUsesPerCustomer || 1,
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : "",
      isActive: c.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim()) { toast.error("Vui lòng nhập mã"); return; }
    if (form.discountValue <= 0) { toast.error("Giá trị giảm phải > 0"); return; }
    if (form.discountType === "percent" && form.discountValue > 100) { toast.error("Phần trăm giảm không được > 100%"); return; }
    if (editingId) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép: ${code}`);
  };

  const getCouponStatus = (c: any) => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    const isMaxed = c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses;
    if (!c.isActive) return "inactive";
    if (isExpired) return "expired";
    if (isMaxed) return "maxed";
    return "active";
  };

  const filtered = useMemo(() => {
    let list = coupons;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) => c.code.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    if (filterStatus !== "all") {
      list = list.filter((c: any) => {
        const status = getCouponStatus(c);
        if (filterStatus === "active") return status === "active";
        if (filterStatus === "inactive") return status === "inactive";
        if (filterStatus === "expired") return status === "expired" || status === "maxed";
        return true;
      });
    }
    return list;
  }, [coupons, search, filterStatus]);

  const overview = statsData?.overview || { totalCoupons: 0, activeCoupons: 0, totalUsages: 0, totalDiscountGiven: 0 };
  const perCoupon = statsData?.perCoupon || [];

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    inactive: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    expired: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    maxed: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  const statusLabels: Record<string, string> = { active: "Hoạt động", inactive: "Tắt", expired: "Hết hạn", maxed: "Hết lượt" };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-blue-500" />
              Mã Giảm Giá
            </h1>
            <p className="text-muted-foreground mt-1">Quản lý và theo dõi hiệu quả các chương trình giảm giá</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Mã Giảm Giá
          </Button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Tổng mã</p>
                  <p className="text-2xl font-bold mt-1">{overview.totalCoupons}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Đang hoạt động</p>
                  <p className="text-2xl font-bold mt-1">{overview.activeCoupons}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TicketCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Lượt sử dụng</p>
                  <p className="text-2xl font-bold mt-1">{overview.totalUsages}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Tổng giảm giá</p>
                  <p className="text-2xl font-bold mt-1 text-rose-600">{formatCurrency(overview.totalDiscountGiven)}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Quản lý / Thống kê */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manage" className="gap-2">
              <Tag className="h-4 w-4" /> Quản Lý
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Thống Kê
            </TabsTrigger>
          </TabsList>

          {/* TAB: Quản Lý */}
          <TabsContent value="manage" className="space-y-4 mt-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm mã giảm giá..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["all", "active", "inactive", "expired"] as const).map(s => (
                  <Button
                    key={s}
                    variant={filterStatus === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(s)}
                    className="text-xs"
                  >
                    {s === "all" ? "Tất cả" : s === "active" ? "Hoạt động" : s === "inactive" ? "Tắt" : "Hết hạn"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Coupon List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Tag className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Chưa có mã giảm giá nào</p>
                  <p className="text-sm mt-1">Nhấn "Tạo Mã Giảm Giá" để bắt đầu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((c: any) => {
                  const status = getCouponStatus(c);
                  const usagePercent = c.maxUses > 0 ? Math.round(((c.usedCount || 0) / c.maxUses) * 100) : null;

                  return (
                    <Card key={c.id} className={`transition-all hover:shadow-md ${status !== "active" ? "opacity-70" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Left: Icon + Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mt-0.5">
                              {c.discountType === "percent"
                                ? <Percent className="h-5 w-5 text-blue-500" />
                                : <DollarSign className="h-5 w-5 text-green-500" />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => copyCode(c.code)} className="font-mono font-bold text-base hover:text-blue-500 transition-colors flex items-center gap-1.5">
                                  {c.code} <Copy className="h-3 w-3 opacity-40" />
                                </button>
                                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusColors[status]}`}>
                                  {statusLabels[status]}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {c.discountType === "percent"
                                  ? `Giảm ${Number(c.discountValue)}%${Number(c.maxDiscountAmount) > 0 ? ` (tối đa ${formatCurrency(Number(c.maxDiscountAmount))})` : ""}`
                                  : `Giảm ${formatCurrency(Number(c.discountValue))}`
                                }
                                {Number(c.minOrderAmount) > 0 && ` · Đơn tối thiểu ${formatCurrency(Number(c.minOrderAmount))}`}
                              </p>
                              {c.description && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{c.description}</p>}

                              {/* Usage progress bar */}
                              {usagePercent !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                                    <div
                                      className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 50 ? "bg-amber-500" : "bg-blue-500"}`}
                                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{c.usedCount || 0}/{c.maxUses} lượt</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Meta + Actions */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right text-xs text-muted-foreground hidden md:block space-y-0.5">
                              <p className="flex items-center gap-1 justify-end">
                                <Users className="h-3 w-3" />
                                Đã dùng: <span className="font-medium text-foreground">{c.usedCount || 0}</span>
                                {c.maxUses > 0 && `/${c.maxUses}`}
                              </p>
                              {c.expiresAt && (
                                <p className="flex items-center gap-1 justify-end">
                                  <Calendar className="h-3 w-3" />
                                  HH: {formatShortDate(c.expiresAt)}
                                </p>
                              )}
                              {c.startsAt && new Date(c.startsAt) > new Date() && (
                                <p className="flex items-center gap-1 justify-end text-amber-500">
                                  <Clock className="h-3 w-3" />
                                  Bắt đầu: {formatShortDate(c.startsAt)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Sửa">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => { if (confirm(`Xóa mã "${c.code}"?`)) deleteMut.mutate({ id: c.id }); }}
                                title="Xóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB: Thống Kê */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : perCoupon.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Chưa có dữ liệu thống kê</p>
                  <p className="text-sm mt-1">Tạo mã giảm giá và chờ khách hàng sử dụng</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-3">Mã giảm giá</div>
                  <div className="col-span-2 text-center">Giá trị</div>
                  <div className="col-span-2 text-center">Lượt dùng</div>
                  <div className="col-span-2 text-center">Doanh thu giảm</div>
                  <div className="col-span-2 text-center">Tỷ lệ sử dụng</div>
                  <div className="col-span-1 text-center">Trạng thái</div>
                </div>

                {perCoupon.map((c: any) => {
                  const status = !c.isActive ? "inactive" : (c.expiresAt && new Date(c.expiresAt) < new Date()) ? "expired" : "active";
                  const usagePercent = c.maxUses && c.maxUses > 0 ? Math.round((c.usageCount / c.maxUses) * 100) : null;

                  return (
                    <Card key={c.id} className="transition-all hover:shadow-sm">
                      <CardContent className="p-4">
                        {/* Desktop: Grid layout */}
                        <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                {c.discountType === "percent"
                                  ? <Percent className="h-4 w-4 text-blue-500" />
                                  : <DollarSign className="h-4 w-4 text-green-500" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="font-mono font-bold text-sm truncate">{c.code}</p>
                                {c.description && <p className="text-[10px] text-muted-foreground truncate">{c.description}</p>}
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="font-semibold text-sm">
                              {c.discountType === "percent" ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-lg font-bold">{c.usageCount}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {c.maxUses > 0 ? `/ ${c.maxUses}` : "lượt"}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`font-semibold text-sm ${c.totalDiscount > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                              {c.totalDiscount > 0 ? formatCurrency(c.totalDiscount) : "0 ₫"}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            {usagePercent !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 50 ? "bg-amber-500" : "bg-blue-500"}`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{usagePercent}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Không giới hạn</span>
                            )}
                          </div>
                          <div className="col-span-1 text-center">
                            <Badge variant="outline" className={`text-[10px] ${statusColors[status]}`}>
                              {statusLabels[status] || status}
                            </Badge>
                          </div>
                        </div>

                        {/* Mobile: Stacked layout */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                {c.discountType === "percent"
                                  ? <Percent className="h-4 w-4 text-blue-500" />
                                  : <DollarSign className="h-4 w-4 text-green-500" />
                                }
                              </div>
                              <div>
                                <p className="font-mono font-bold">{c.code}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.discountType === "percent" ? `Giảm ${c.discountValue}%` : `Giảm ${formatCurrency(c.discountValue)}`}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${statusColors[status]}`}>
                              {statusLabels[status] || status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 bg-muted/50 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-lg font-bold">{c.usageCount}</p>
                              <p className="text-[10px] text-muted-foreground">Lượt dùng</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-rose-600">{c.totalDiscount > 0 ? `${Math.round(c.totalDiscount / 1000)}k` : "0"}</p>
                              <p className="text-[10px] text-muted-foreground">Giảm giá</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold">{usagePercent !== null ? `${usagePercent}%` : "∞"}</p>
                              <p className="text-[10px] text-muted-foreground">Tỷ lệ</p>
                            </div>
                          </div>
                          {usagePercent !== null && (
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 50 ? "bg-amber-500" : "bg-blue-500"}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Summary footer */}
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span>Tổng kết: <span className="font-medium text-foreground">{perCoupon.length}</span> mã giảm giá</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          Tổng lượt dùng: <span className="font-bold text-foreground">{overview.totalUsages}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Tổng giảm: <span className="font-bold text-rose-600">{formatCurrency(overview.totalDiscountGiven)}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-500" />
                {editingId ? "Sửa Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Mã giảm giá *</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE50" className="font-mono" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Loại giảm giá</Label>
                  <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="VD: Giảm 50% cho khách mới" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giá trị giảm *</Label>
                  <Input type="number" value={form.discountValue || ""} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} placeholder={form.discountType === "percent" ? "50" : "100000"} />
                </div>
                {form.discountType === "percent" && (
                  <div>
                    <Label>Giảm tối đa (VNĐ)</Label>
                    <Input type="number" value={form.maxDiscountAmount || ""} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: Number(e.target.value) }))} placeholder="0 = không giới hạn" />
                  </div>
                )}
                <div>
                  <Label>Đơn tối thiểu (VNĐ)</Label>
                  <Input type="number" value={form.minOrderAmount || ""} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tổng lượt dùng (0 = vô hạn)</Label>
                  <Input type="number" value={form.maxUses || ""} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} placeholder="0" />
                </div>
                <div>
                  <Label>Lượt/khách hàng</Label>
                  <Input type="number" value={form.maxUsesPerCustomer || ""} onChange={e => setForm(f => ({ ...f, maxUsesPerCustomer: Number(e.target.value) }))} placeholder="1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bắt đầu</Label>
                  <Input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <Label>Hết hạn</Label>
                  <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <Label>Kích hoạt ngay</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-blue-600 hover:bg-blue-700">
                {(createMut.isPending || updateMut.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang lưu...</>
                ) : editingId ? "Cập nhật" : "Tạo mã"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayoutCustom>
  );
}
