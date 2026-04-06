import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ComposedChart, Line, ReferenceLine
} from "recharts";
import {
  Download, TrendingUp, DollarSign, FileText, Users, Package,
  Loader2, Trophy, CalendarDays, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Star, BarChart3, Activity
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

const MONTH_LABELS: Record<string, string> = {
  "01": "T1", "02": "T2", "03": "T3", "04": "T4",
  "05": "T5", "06": "T6", "07": "T7", "08": "T8",
  "09": "T9", "10": "T10", "11": "T11", "12": "T12",
};

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("vi-VN");
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl p-3 text-sm min-w-[140px] max-w-[200px]">
      <p className="font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-100 text-xs">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500 text-xs">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-800 text-xs">
            {typeof p.value === "number" && (p.name?.includes("Doanh") || p.name?.includes("Thu"))
              ? formatCurrency(p.value) + "đ"
              : p.name?.includes("%") || p.name?.includes("Rate") || p.name?.includes("Tỷ")
              ? p.value + "%"
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-gray-700">{item.name}</span>
      </div>
      <p className="text-gray-500 mt-1">Số lượng: <span className="font-bold text-gray-800">{item.value}</span></p>
      {item.payload.percent !== undefined && (
        <p className="text-gray-500">Tỷ lệ: <span className="font-bold text-gray-800">{item.payload.percent}%</span></p>
      )}
    </div>
  );
};

function KpiCard({ title, value, sub, icon: Icon, color, trend, trendValue }: {
  title: string; value: string; sub?: string; icon: any; color: string; trend?: "up" | "down"; trendValue?: string;
}) {
  return (
    <Card className="shadow-sm border-0 bg-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-5 translate-x-5"
        style={{ backgroundColor: color }} />
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: color + "18" }}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
              trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"
            }`}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="hidden sm:inline">{trendValue}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomXAxisTick = ({ x, y, payload }: any) => (
  <text x={x} y={y + 12} textAnchor="middle" fill="#9ca3af" fontSize={10}>{payload.value}</text>
);

export default function Reports() {
  const [period, setPeriod] = useState("12");
  const [customerPeriod, setCustomerPeriod] = useState<"1" | "7" | "30">("7");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: stats, isLoading: statsLoading } = trpc.reports.getDashboardStats.useQuery();
  const { data: revenueData, isLoading: revenueLoading } = trpc.reports.getRevenueByMonth.useQuery();
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = trpc.reports.getInvoiceStats.useQuery();
  const { data: topProductsDaily = [], isLoading: productsLoading } = trpc.reports.topProductsDaily.useQuery({ date: selectedDate });
  const { data: topCustomers = [], isLoading: customersLoading } = trpc.reports.topCustomersByPeriod.useQuery({ days: parseInt(customerPeriod) });
  const { data: monthlyComparison = [], isLoading: comparisonLoading } = trpc.reports.getMonthlyComparison.useQuery();

  const processedRevenue = useMemo(() => {
    if (!revenueData) return [];
    const sorted = [...revenueData].sort((a, b) => a.month.localeCompare(b.month));
    return sorted.slice(-parseInt(period)).map(item => {
      const parts = item.month.split("/");
      const monthKey = parts[0]?.padStart(2, "0") || item.month;
      return { month: MONTH_LABELS[monthKey] || item.month, revenue: item.revenue };
    });
  }, [revenueData, period]);

  const avgRevenue = useMemo(() => {
    if (!processedRevenue.length) return 0;
    return Math.round(processedRevenue.reduce((s, d) => s + d.revenue, 0) / processedRevenue.length);
  }, [processedRevenue]);

  const pieData = useMemo(() => {
    if (!invoiceStats) return [];
    const total = Object.values(invoiceStats).reduce((s, v) => s + v, 0);
    return [
      { name: "Tạo Đơn", value: invoiceStats.CREATED, color: "#6366f1" },
      { name: "Đã TT", value: invoiceStats.PAID, color: "#10b981" },
      { name: "Đang Giao", value: invoiceStats.SHIPPING, color: "#f59e0b" },
      { name: "Bảo Hành", value: invoiceStats.WARRANTY, color: "#8b5cf6" },
      { name: "Thất Bại", value: invoiceStats.FAILED, color: "#ef4444" },
      { name: "Hết Hạn", value: invoiceStats.EXPIRED, color: "#9ca3af" },
    ]
      .filter(d => d.value > 0)
      .map(d => ({ ...d, percent: total > 0 ? Math.round(d.value / total * 100) : 0 }));
  }, [invoiceStats]);

  const sortedProducts = useMemo(() => [...topProductsDaily].sort((a, b) => a.totalRevenue - b.totalRevenue), [topProductsDaily]);
  const maxProductRevenue = useMemo(() => sortedProducts.reduce((m, p) => Math.max(m, p.totalRevenue), 0), [sortedProducts]);

  const exportExcel = trpc.excel.exportReport.useMutation();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const data = await exportExcel.mutateAsync({ period: `${period} tháng gần đây` });
      const byteCharacters = atob(data.buffer);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = data.filename || "bao-cao.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo Excel thành công!");
    } catch (err: any) {
      toast.error(err.message || "Xuất Excel thất bại");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const totalRevenue = stats?.totalRevenue || 0;
  const totalInvoices = stats?.totalInvoices || 0;
  const paidInvoices = stats?.paidInvoices || 0;
  const paymentRate = stats?.paymentRate || 0;
  const isLoading = statsLoading || revenueLoading || invoiceStatsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
              Báo Cáo & Phân Tích
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">Tổng quan hiệu suất kinh doanh</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28 sm:w-36 h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 tháng</SelectItem>
                <SelectItem value="6">6 tháng</SelectItem>
                <SelectItem value="12">12 tháng</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExportingExcel} className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3">
              {isExportingExcel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Excel
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 sm:h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard title="Tổng Doanh Thu" value={formatCurrency(totalRevenue) + "đ"} sub="Tất cả thời gian" icon={DollarSign} color="#6366f1" trend="up" trendValue="Tổng tích lũy" />
            <KpiCard title="Tổng Hóa Đơn" value={totalInvoices.toString()} sub={`${paidInvoices} đã thanh toán`} icon={FileText} color="#10b981" />
            <KpiCard title="Tỷ Lệ Thanh Toán" value={`${paymentRate}%`} sub="Tỷ lệ chuyển đổi" icon={TrendingUp} color="#f59e0b"
              trend={paymentRate >= 50 ? "up" : "down"} trendValue={`${paymentRate}%`} />
            <KpiCard title="Khách Hàng" value={(stats as any)?.totalCustomers?.toString() || "0"} sub="Đã đăng ký" icon={Users} color="#8b5cf6" />
          </div>
        )}

        {/* Revenue Area Chart */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Doanh Thu Theo Tháng
                </CardTitle>
                {avgRevenue > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    TB: <span className="font-medium text-indigo-600">{formatCurrency(avgRevenue)}đ/tháng</span>
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            {revenueLoading ? (
              <div className="h-52 sm:h-64 bg-gray-50 rounded-xl animate-pulse" />
            ) : processedRevenue.length === 0 ? (
              <div className="h-52 sm:h-64 flex flex-col items-center justify-center text-gray-400">
                <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu doanh thu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={processedRevenue} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={<CustomXAxisTick />} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<CustomTooltip />} />
                  {avgRevenue > 0 && (
                    <ReferenceLine y={avgRevenue} stroke="#6366f1" strokeDasharray="6 3" strokeOpacity={0.5}
                      label={{ value: "TB", position: "right", fill: "#6366f1", fontSize: 9 }} />
                  )}
                  <Area type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#6366f1" strokeWidth={2}
                    fill="url(#revenueGrad)" dot={{ fill: "#6366f1", r: 3, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ComposedChart: Đơn tạo vs Đã TT + Tỷ lệ */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              So Sánh Đơn Tạo vs Đã Thanh Toán
            </CardTitle>
            <p className="text-xs text-gray-400">Cột: số lượng đơn — Đường: tỷ lệ chuyển đổi (%)</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            {comparisonLoading ? (
              <div className="h-48 sm:h-56 bg-gray-50 rounded-xl animate-pulse" />
            ) : monthlyComparison.length === 0 ? (
              <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthlyComparison} margin={{ top: 10, right: 28, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="shortMonth" tick={<CustomXAxisTick />} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={24} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={v => v + "%"} tick={{ fontSize: 10, fill: "#f59e0b" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar yAxisId="left" dataKey="created" name="Tạo Đơn" fill="url(#createdGrad)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar yAxisId="left" dataKey="paid" name="Đã TT" fill="url(#paidGrad)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Tỷ Lệ %" stroke="#f59e0b" strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 3, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 4, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="products">
          {/* Tabs list cuộn ngang trên mobile */}
          <div className="overflow-x-auto -mx-1 px-1 mb-3 sm:mb-4">
            <TabsList className="bg-gray-100/80 rounded-xl p-1 w-max min-w-full">
              <TabsTrigger value="products" className="gap-1 sm:gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-4">
                <ShoppingBag className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">Sản Phẩm</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="gap-1 sm:gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-4">
                <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">Khách Hàng</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="gap-1 sm:gap-1.5 rounded-lg data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-4">
                <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">Trạng Thái</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Top Products Daily */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-amber-500" />
                        Doanh Thu Sản Phẩm
                      </CardTitle>
                      <p className="text-xs text-gray-400 mt-0.5">Thấp → Cao (ngày được chọn)</p>
                    </div>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                  </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-4">
                  {productsLoading ? (
                    <div className="h-48 sm:h-56 bg-gray-50 rounded-xl animate-pulse" />
                  ) : sortedProducts.length === 0 ? (
                    <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-gray-400">
                      <Package className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">Không có đơn hàng ngày này</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(180, sortedProducts.length * 44)}>
                      <BarChart data={sortedProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} width={85} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalRevenue" name="Doanh Thu" fill="url(#barGrad)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    Chi Tiết Sản Phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4">
                  {productsLoading ? (
                    <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                  ) : sortedProducts.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                      <p className="text-sm">Không có dữ liệu</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...sortedProducts].reverse().map((product, i) => {
                        const pct = maxProductRevenue > 0 ? Math.round(product.totalRevenue / maxProductRevenue * 100) : 0;
                        const rankColors = ["#f59e0b", "#9ca3af", "#cd7c2f"];
                        return (
                          <div key={i} className="p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                              <div className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: i < 3 ? rankColors[i] + "20" : "#f3f4f6", color: i < 3 ? rankColors[i] : "#6b7280" }}>
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">{product.orderCount} đơn</p>
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-amber-600 flex-shrink-0">{formatCurrency(product.totalRevenue)}đ</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Top Customers */}
          <TabsContent value="customers">
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3 px-4 sm:px-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Bảng Xếp Hạng Khách Hàng
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {(["1", "7", "30"] as const).map(d => (
                      <button key={d} onClick={() => setCustomerPeriod(d)}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                          customerPeriod === d
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {d === "1" ? "Hôm nay" : d === "7" ? "7 ngày" : "30 ngày"}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4">
                {customersLoading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                ) : topCustomers.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                    <Trophy className="h-14 w-14 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Chưa có dữ liệu</p>
                    <p className="text-xs mt-1">Chưa có đơn hàng trong khoảng thời gian này</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topCustomers.slice(0, 10).map((customer, i) => {
                      const rankColors = ["#f59e0b", "#9ca3af", "#cd7c2f"];
                      const rankBg = i === 0 ? "bg-amber-50 border-amber-200" : i === 1 ? "bg-gray-50 border-gray-200" : i === 2 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100";
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${rankBg} hover:shadow-sm transition-all`}>
                          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: i < 3 ? rankColors[i] + "20" : "#f3f4f6", color: i < 3 ? rankColors[i] : "#6b7280" }}>
                            {i < 3 ? <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ fill: rankColors[i], color: rankColors[i] }} /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">{customer.customerName}</p>
                            <p className="text-xs text-gray-400 truncate">{customer.customerEmail || "Không có email"}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-indigo-600 text-sm">{formatCurrency(customer.totalSpent)}đ</p>
                            <p className="text-xs text-gray-400">{customer.orderCount} đơn · {customer.paidCount} TT</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Invoice Status */}
          <TabsContent value="status">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Phân Bổ Trạng Thái Hóa Đơn
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4">
                  {invoiceStatsLoading ? (
                    <div className="h-56 sm:h-64 bg-gray-50 rounded-xl animate-pulse" />
                  ) : pieData.length === 0 ? (
                    <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-gray-400">
                      <FileText className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-sm">Chưa có hóa đơn</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <defs>
                            {pieData.map((entry, i) => (
                              <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={`url(#pieGrad${i})`} stroke="none" />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                        {pieData.map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-600">{item.name}: <span className="font-semibold text-gray-800">{item.value}</span>
                              <span className="text-gray-400 ml-0.5">({item.percent}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-purple-500" />
                    Số Lượng Theo Trạng Thái
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-4">
                  {invoiceStatsLoading ? (
                    <div className="h-56 sm:h-64 bg-gray-50 rounded-xl animate-pulse" />
                  ) : pieData.length === 0 ? (
                    <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-gray-400">
                      <p className="text-sm">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={pieData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                        <defs>
                          {pieData.map((entry, i) => (
                            <linearGradient key={i} id={`statusGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.95} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={24} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Số lượng" radius={[8, 8, 0, 0]} maxBarSize={44}>
                          {pieData.map((_, i) => <Cell key={i} fill={`url(#statusGrad${i})`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
