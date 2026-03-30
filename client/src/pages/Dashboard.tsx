import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, FileText, CheckCircle, Clock } from "lucide-react";

// Mock data
const revenueData = [
  { date: "24/03", revenue: 2500000 },
  { date: "25/03", revenue: 3200000 },
  { date: "26/03", revenue: 2800000 },
  { date: "27/03", revenue: 4100000 },
  { date: "28/03", revenue: 3500000 },
  { date: "29/03", revenue: 3800000 },
  { date: "30/03", revenue: 5500000 },
];

const statusData = [
  { name: "Đã Thanh Toán", value: 35, color: "#00AA44" },
  { name: "Chờ Thanh Toán", value: 10, color: "#FF9900" },
  { name: "Quá Hạn", value: 3, color: "#FF4444" },
];

const recentInvoices = [
  { id: "INV001", customer: "Công Ty ABC", date: "30/03/26", amount: 5000000, status: "Paid" },
  { id: "INV002", customer: "Nguyễn Văn A", date: "29/03/26", amount: 2500000, status: "Pending" },
  { id: "INV003", customer: "Cửa Hàng XYZ", date: "28/03/26", amount: 10000000, status: "Paid" },
];

export default function Dashboard() {
  const stats = [
    {
      title: "Doanh Thu",
      value: "125,500,000 VND",
      change: "+12% vs tháng trước",
      icon: TrendingUp,
      color: "from-blue-600 to-blue-400",
    },
    {
      title: "Tổng Hóa Đơn",
      value: "48",
      change: "+5 vs tuần trước",
      icon: FileText,
      color: "from-purple-600 to-purple-400",
    },
    {
      title: "Đã Thanh Toán",
      value: "35 (72%)",
      change: "+2.5M VND",
      icon: CheckCircle,
      color: "from-green-600 to-green-400",
    },
    {
      title: "Chờ Thanh Toán",
      value: "10 (21%)",
      change: "8,500,000 VND",
      icon: Clock,
      color: "from-orange-600 to-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Xin chào! Đây là tổng quan doanh thu của bạn</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh Thu Theo Thời Gian</CardTitle>
            <CardDescription>7 ngày gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `${((value as number) / 1000000).toFixed(1)}M VND`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0066CC"
                  strokeWidth={2}
                  dot={{ fill: "#0066CC", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Doanh Thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Hóa Đơn</CardTitle>
            <CardDescription>Phân bố theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Hóa Đơn Gần Đây</CardTitle>
          <CardDescription>5 hóa đơn mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Khách Hàng</th>
                  <th className="text-left py-3 px-4 font-semibold">Ngày Tạo</th>
                  <th className="text-left py-3 px-4 font-semibold">Tổng Tiền</th>
                  <th className="text-left py-3 px-4 font-semibold">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600">{invoice.id}</td>
                    <td className="py-3 px-4">{invoice.customer}</td>
                    <td className="py-3 px-4">{invoice.date}</td>
                    <td className="py-3 px-4 font-semibold">
                      {((invoice.amount as number) / 1000000).toFixed(1)}M VND
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {invoice.status === "Paid" ? "✓ Đã Thanh Toán" : "⏳ Chờ Thanh Toán"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
