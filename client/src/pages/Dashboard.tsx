import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, FileText, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

// Mock data
const revenueData = [
  { date: "24/03", revenue: 2500000, target: 3000000 },
  { date: "25/03", revenue: 3200000, target: 3000000 },
  { date: "26/03", revenue: 2800000, target: 3000000 },
  { date: "27/03", revenue: 4100000, target: 3000000 },
  { date: "28/03", revenue: 3500000, target: 3000000 },
  { date: "29/03", revenue: 3800000, target: 3000000 },
  { date: "30/03", revenue: 5500000, target: 3000000 },
];

const statusData = [
  { name: "Đã Thanh Toán", value: 35, color: "#10B981" },
  { name: "Chờ Thanh Toán", value: 10, color: "#F59E0B" },
  { name: "Quá Hạn", value: 3, color: "#EF4444" },
];

const recentInvoices = [
  { id: "INV001", customer: "Công Ty ABC", date: "30/03/26", amount: 5000000, status: "Paid", statusColor: "bg-green-100 text-green-800" },
  { id: "INV002", customer: "Nguyễn Văn A", date: "29/03/26", amount: 2500000, status: "Pending", statusColor: "bg-yellow-100 text-yellow-800" },
  { id: "INV003", customer: "Cửa Hàng XYZ", date: "28/03/26", amount: 10000000, status: "Paid", statusColor: "bg-green-100 text-green-800" },
  { id: "INV004", customer: "Công Ty DEF", date: "27/03/26", amount: 3500000, status: "Expired", statusColor: "bg-red-100 text-red-800" },
];

export default function Dashboard() {
  const stats = [
    {
      title: "Doanh Thu",
      value: "125,500,000",
      unit: "VND",
      change: "+12%",
      positive: true,
      icon: TrendingUp,
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-600",
    },
    {
      title: "Tổng Hóa Đơn",
      value: "48",
      unit: "hóa đơn",
      change: "+5",
      positive: true,
      icon: FileText,
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-600",
    },
    {
      title: "Đã Thanh Toán",
      value: "35",
      unit: "72%",
      change: "+2.5M",
      positive: true,
      icon: CheckCircle,
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-600",
    },
    {
      title: "Chờ Thanh Toán",
      value: "10",
      unit: "21%",
      change: "-3",
      positive: false,
      icon: Clock,
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-600",
    },
  ];

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
                      <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</span>
                      <span className="text-xs md:text-sm text-gray-600">{stat.unit}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {stat.positive ? (
                        <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                      )}
                      <span className={`text-xs md:text-sm font-semibold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 shadow-sm md:shadow-md border-0">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-lg md:text-xl">Doanh Thu Theo Ngày</CardTitle>
              <CardDescription className="text-xs md:text-sm">7 ngày gần nhất</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card className="shadow-sm md:shadow-md border-0">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-lg md:text-xl">Trạng Thái Hóa Đơn</CardTitle>
              <CardDescription className="text-xs md:text-sm">Phân bố hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-2 md:p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
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
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="shadow-sm md:shadow-md border-0">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg md:text-xl">Hóa Đơn Gần Đây</CardTitle>
                <CardDescription className="text-xs md:text-sm">Các hóa đơn mới nhất của bạn</CardDescription>
              </div>
              <a href="/invoices" className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm">
                Xem tất cả →
              </a>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700">Mã</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700 hidden sm:table-cell">Khách Hàng</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700 hidden md:table-cell">Ngày</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700">Số Tiền</th>
                    <th className="text-center py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-700">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 md:py-3 px-2 md:px-4 font-semibold text-gray-900">
                        <a href={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-700">
                          {invoice.id}
                        </a>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-700 hidden sm:table-cell">{invoice.customer}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden md:table-cell">{invoice.date}</td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-right font-semibold text-gray-900">
                        {(invoice.amount / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${invoice.statusColor}`}>
                          {invoice.status === "Paid" ? "✓" : invoice.status === "Pending" ? "⏳" : "✕"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <Card className="shadow-sm md:shadow-md border-0">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs md:text-sm text-gray-600 font-medium">Tỷ Lệ Thanh Toán</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">72%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3 md:mt-4">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "72%" }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">+5% vs tháng trước</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm md:shadow-md border-0">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs md:text-sm text-gray-600 font-medium">Khách Hàng Mới</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">5</p>
              <p className="text-xs text-gray-600 mt-3 md:mt-4">Tháng này</p>
              <p className="text-xs text-green-600 font-semibold">+3 vs tháng trước</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm md:shadow-md border-0">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs md:text-sm text-gray-600 font-medium">Giá Trị Trung Bình</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">2.6M</p>
              <p className="text-xs text-gray-600 mt-3 md:mt-4">VND / hóa đơn</p>
              <p className="text-xs text-green-600 font-semibold">+12% vs tháng trước</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
