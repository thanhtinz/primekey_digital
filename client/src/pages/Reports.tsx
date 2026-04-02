import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

const revenueData = [
  { month: "Jan", revenue: 40000000, target: 50000000 },
  { month: "Feb", revenue: 45000000, target: 50000000 },
  { month: "Mar", revenue: 52000000, target: 50000000 },
  { month: "Apr", revenue: 48000000, target: 50000000 },
];

const topCustomers = [
  { name: "Công Ty A", value: 25000000 },
  { name: "Công Ty B", value: 18000000 },
  { name: "Công Ty C", value: 15000000 },
  { name: "Công Ty D", value: 12000000 },
  { name: "Công Ty E", value: 10000000 },
];

const topProducts = [
  { name: "Dịch vụ tư vấn", value: 35 },
  { name: "Phát triển phần mềm", value: 28 },
  { name: "Thiết kế UI/UX", value: 22 },
  { name: "Quản lý dự án", value: 15 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

export default function Reports() {
  const handleExport = (format: string) => {
    toast.loading(`Đang xuất báo cáo ${format}...`);
    setTimeout(() => {
      toast.success(`Báo cáo ${format} đã được tải xuống!`);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê</h1>
            <p className="text-gray-600">Phân tích doanh thu, khách hàng, sản phẩm</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Bộ Lọc
            </Button>
            <Button onClick={() => handleExport("Excel")} className="gap-2">
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button onClick={() => handleExport("PDF")} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Doanh Thu Theo Tháng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
                  <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Doanh Thu Thực" />
              <Line type="monotone" dataKey="target" stroke="#10b981" name="Mục Tiêu" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Top 5 Khách Hàng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Top 4 Sản Phẩm/Dịch Vụ</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-gray-600 text-sm">Tổng Doanh Thu</p>
            <p className="text-2xl font-bold text-blue-600">185M VND</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% so với tháng trước</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-gray-600 text-sm">Số Hóa Đơn</p>
            <p className="text-2xl font-bold text-purple-600">48</p>
            <p className="text-xs text-green-600 mt-1">↑ 5 hóa đơn mới</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-gray-600 text-sm">Tỷ Lệ Thanh Toán</p>
            <p className="text-2xl font-bold text-green-600">72%</p>
            <p className="text-xs text-green-600 mt-1">↑ 2.5% so với tháng trước</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-gray-600 text-sm">Chờ Thanh Toán</p>
            <p className="text-2xl font-bold text-orange-600">10</p>
            <p className="text-xs text-red-600 mt-1">↓ 3 hóa đơn</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
