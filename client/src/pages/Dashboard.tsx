import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, FileText, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = trpc.reports.getDashboardStats.useQuery();
  const { data: revenueByMonth, isLoading: revenueLoading } = trpc.reports.getRevenueByMonth.useQuery();
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = trpc.reports.getInvoiceStats.useQuery();

  // Format revenue data for chart
  const revenueData = (revenueByMonth || []).map(item => ({
    month: item.month,
    revenue: typeof item.revenue === "string" ? parseFloat(item.revenue) : item.revenue,
  }));

  // Format invoice status data for pie chart
  const statusData = invoiceStats ? [
    { name: "Đã Thanh Toán", value: invoiceStats.PAID || 0, color: "#10B981" },
    { name: "Chờ Thanh Toán", value: invoiceStats.PENDING || 0, color: "#F59E0B" },
    { name: "Thất Bại", value: invoiceStats.FAILED || 0, color: "#EF4444" },
    { name: "Hết Hạn", value: invoiceStats.EXPIRED || 0, color: "#8B5CF6" },
  ] : [];

  const stats = [
    {
      title: "Doanh Thu",
      value: dashboardStats?.totalRevenue ? (dashboardStats.totalRevenue as number).toLocaleString("vi-VN") : "0",
      unit: "VND",
      change: dashboardStats?.totalRevenue ? "+12%" : "0%",
      positive: true,
      icon: TrendingUp,
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-600",
    },
    {
      title: "Tổng Hóa Đơn",
      value: dashboardStats?.totalInvoices || 0,
      unit: "hóa đơn",
      change: dashboardStats?.totalInvoices ? "+5" : "0",
      positive: true,
      icon: FileText,
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-600",
    },
    {
      title: "Đã Thanh Toán",
      value: dashboardStats?.paidInvoices || 0,
      unit: dashboardStats?.paymentRate ? `${Math.round(dashboardStats.paymentRate)}%` : "0%",
      change: dashboardStats?.paidInvoices ? "+2.5M" : "0",
      positive: true,
      icon: CheckCircle,
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-600",
    },
    {
      title: "Chờ Thanh Toán",
      value: dashboardStats?.pendingInvoices || 0,
      unit: dashboardStats?.totalInvoices ? `${Math.round((dashboardStats.pendingInvoices / dashboardStats.totalInvoices) * 100)}%` : "0%",
      change: dashboardStats?.pendingInvoices ? "-3" : "0",
      positive: false,
      icon: Clock,
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-600",
    },
  ];

  if (statsLoading || revenueLoading || invoiceStatsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="px-0 md:px-0">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Xin chào! Đây là tổng quan doanh thu của bạn</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-sm md:shadow-md hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-gray-600">{stat.title}</p>
                    </div>
                    <div className={`${stat.iconBg} p-2 md:p-3 rounded-lg text-white`}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                  
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-baseline gap-1 md:gap-2">
                      <span className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</span>
                      <span className="text-xs md:text-sm text-gray-600">{stat.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                      {stat.positive ? <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" /> : <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4" />}
                      {stat.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 shadow-sm md:shadow-md">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Doanh Thu Theo Ngày</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    formatter={(value) => [(value as number).toLocaleString("vi-VN"), "Doanh Thu"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Status Pie Chart */}
          <Card className="shadow-sm md:shadow-md">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Trạng Thái Hóa Đơn</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} hóa đơn`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
