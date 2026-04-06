import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, FileText, CheckCircle, Clock, ArrowUpRight, Plus, RefreshCw, Package, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-10 w-10 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full bg-gray-100 rounded-xl" />
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Tạo Đơn",
  PAID: "Đã TT",
  SHIPPING: "Đang Giao",
  WARRANTY: "Bảo Hành",
  FAILED: "Thất Bại",
  EXPIRED: "Hết Hạn",
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPING: "bg-yellow-100 text-yellow-800",
  WARRANTY: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = trpc.reports.getDashboardStats.useQuery();
  const { data: revenueByMonth, isLoading: revenueLoading } = trpc.reports.getRevenueByMonth.useQuery();
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = trpc.reports.getInvoiceStats.useQuery();
  const { data: recentInvoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery();
  const { data: topProducts } = trpc.reports.getTopProducts.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  const revenueData = (revenueByMonth || []).map(item => ({
    month: item.month,
    revenue: typeof item.revenue === "string" ? parseFloat(item.revenue) : (item.revenue || 0),
  }));

  const statusData = invoiceStats ? [
    { name: "Đã Thanh Toán", value: invoiceStats.PAID || 0, color: "#10B981" },
    { name: "Tạo Đơn", value: invoiceStats.CREATED || 0, color: "#3B82F6" },
    { name: "Đang Giao", value: invoiceStats.SHIPPING || 0, color: "#F59E0B" },
    { name: "Bảo Hành", value: invoiceStats.WARRANTY || 0, color: "#8B5CF6" },
    { name: "Thất Bại", value: invoiceStats.FAILED || 0, color: "#EF4444" },
    { name: "Hết Hạn", value: invoiceStats.EXPIRED || 0, color: "#8B5CF6" },
  ].filter(d => d.value > 0) : [];

  const totalRevenue = typeof dashboardStats?.totalRevenue === "string"
    ? parseFloat(dashboardStats.totalRevenue)
    : (dashboardStats?.totalRevenue || 0);

  const paymentRate = dashboardStats?.totalInvoices
    ? Math.round((dashboardStats.paidInvoices / dashboardStats.totalInvoices) * 100)
    : 0;

  const pendingRate = dashboardStats?.totalInvoices
    ? Math.round((dashboardStats.pendingInvoices / dashboardStats.totalInvoices) * 100)
    : 0;

  const kpiCards = [
    {
      title: "Tổng Doanh Thu",
      value: totalRevenue.toLocaleString("vi-VN"),
      unit: "VND",
      change: "+12.5%",
      positive: true,
      icon: TrendingUp,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Tổng Hóa Đơn",
      value: (dashboardStats?.totalInvoices || 0).toString(),
      unit: "hóa đơn",
      change: `+${dashboardStats?.totalInvoices || 0} tổng`,
      positive: true,
      icon: FileText,
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Đã Thanh Toán",
      value: (dashboardStats?.paidInvoices || 0).toString(),
      unit: `${paymentRate}% tỷ lệ`,
      change: `${paymentRate}% tỷ lệ TT`,
      positive: true,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Chờ Thanh Toán",
      value: (dashboardStats?.pendingInvoices || 0).toString(),
      unit: `${pendingRate}% tổng`,
      change: `${pendingRate}% chờ xử lý`,
      positive: false,
      icon: Clock,
      gradient: "from-orange-500 to-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const latestInvoices = (recentInvoices || []).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tổng quan hoạt động kinh doanh</p>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              className="gap-1.5 h-8 px-2.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setLocation("/create-invoice")}
              className="gap-1.5 h-8 px-2.5 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sm:hidden">Tạo Đơn</span>
              <span className="hidden sm:inline">Tạo Hóa Đơn</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <Card key={i} className={`${card.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <div className={`bg-gradient-to-br ${card.gradient} p-2.5 rounded-xl shadow-sm`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                        <span className="text-xs text-gray-500">{card.unit}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${card.positive ? "text-green-600" : "text-orange-600"}`}>
                        <ArrowUpRight className="h-3 w-3" />
                        {card.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Doanh Thu Theo Tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <ChartSkeleton />
              ) : revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                  <p className="text-xs mt-1">Tạo hóa đơn đầu tiên để xem biểu đồ</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                      formatter={(v) => [`${(v as number).toLocaleString("vi-VN")} VND`, "Doanh Thu"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Trạng Thái Hóa Đơn</CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceStatsLoading ? (
                <ChartSkeleton />
              ) : statusData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chưa có hóa đơn nào</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={false}>
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} hóa đơn`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {statusData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products + Customer Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  Sản Phẩm Bán Chạy
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/products")} className="text-blue-600 hover:text-blue-700 text-xs">Xem tất cả →</Button>
              </div>
            </CardHeader>
            <CardContent>
              {!topProducts || topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Package className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-orange-600">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-orange-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (p.price / (topProducts[0]?.price || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold">{(p.price || 0).toLocaleString("vi-VN")}</p>
                        <p className="text-xs text-gray-400">VND</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Stats */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Khách Hàng
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/customers")} className="text-blue-600 hover:text-blue-700 text-xs">Xem tất cả →</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{customers?.length || 0}</p>
                  <p className="text-xs text-blue-500">Tổng khách hàng</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{dashboardStats?.paidInvoices || 0}</p>
                  <p className="text-xs text-green-500">Đơn đã thanh toán</p>
                </div>
              </div>
              {customers && customers.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Khách hàng gần đây</p>
                  {customers.slice(0, 4).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => setLocation(`/customers/${c.id}`)}>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{(c.name || "?").charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email || c.phone || ""}</p>
                      </div>
                      {c.totalInvoices > 0 && (
                        <span className="text-xs text-gray-400">{c.totalInvoices} đơn</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Users className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Chưa có khách hàng</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Hóa Đơn Gần Đây</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="text-blue-600 hover:text-blue-700 text-xs">
                Xem tất cả →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 py-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-32 flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : latestInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Chưa có hóa đơn nào</p>
                <p className="text-xs mt-1 mb-4">Tạo hóa đơn đầu tiên để bắt đầu</p>
                <Button size="sm" onClick={() => setLocation("/create-invoice")} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Tạo Hóa Đơn
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Số HĐ</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium hidden sm:table-cell">Ngày</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Số Tiền</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestInvoices.map((inv) => {
                      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
                      const status = inv.status || "CREATED";
                      return (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 font-medium text-blue-600">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3 text-gray-500 hidden sm:table-cell">
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            {amount.toLocaleString("vi-VN")} {inv.currency || "VND"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
