import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

const revenueData = [
  { month: "Jan", revenue: 45000000 },
  { month: "Feb", revenue: 52000000 },
  { month: "Mar", revenue: 48000000 },
  { month: "Apr", revenue: 61000000 },
  { month: "May", revenue: 55000000 },
  { month: "Jun", revenue: 67000000 },
];

const topCustomers = [
  { name: "Cửa Hàng XYZ", value: 380000000 },
  { name: "Công Ty ABC", value: 250000000 },
  { name: "Nguyễn Văn A", value: 45000000 },
  { name: "Khác", value: 125000000 },
];

const topProducts = [
  { name: "Thiết kế web", value: 45 },
  { name: "Tư vấn", value: 28 },
  { name: "Phần mềm", value: 15 },
  { name: "Support", value: 12 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function Reports() {
  const handleExportExcel = () => {
    toast.loading("Đang xuất báo cáo Excel...");
    setTimeout(() => {
      toast.success("Báo cáo Excel đã được tải xuống!");
    }, 1500);
  };

  const handleExportPDF = () => {
    toast.loading("Đang xuất báo cáo PDF...");
    setTimeout(() => {
      toast.success("Báo cáo PDF đã được tải xuống!");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê</h1>
            <p className="text-gray-600">Phân tích doanh thu và hiệu suất kinh doanh</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} className="gap-2">
              <FileText className="h-4 w-4" />
              Xuất Excel
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Xuất PDF
            </Button>
          </div>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh Thu Theo Tháng</CardTitle>
            <CardDescription>6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                  <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                  name="Doanh Thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Khách Hàng</CardTitle>
              <CardDescription>Khách hàng chi tiêu nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topCustomers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value / 1000000).toFixed(0)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topCustomers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Sản Phẩm Bán Chạy Nhất</CardTitle>
              <CardDescription>Số lượng bán ra</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" name="Số Lượng" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold">800M VND</p>
              <p className="text-xs text-green-600 mt-2">↑ 12% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tổng Hóa Đơn</p>
              <p className="text-2xl font-bold">150</p>
              <p className="text-xs text-green-600 mt-2">↑ 8% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tổng Khách Hàng</p>
              <p className="text-2xl font-bold">45</p>
              <p className="text-xs text-green-600 mt-2">↑ 5% so với tháng trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tỷ Lệ Thanh Toán</p>
              <p className="text-2xl font-bold">92%</p>
              <p className="text-xs text-green-600 mt-2">↑ 3% so với tháng trước</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
