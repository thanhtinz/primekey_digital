import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { useState } from "react";

const monthlyRevenueData = [
  { month: "Tháng 1", revenue: 15000000, paid: 12000000 },
  { month: "Tháng 2", revenue: 18000000, paid: 16000000 },
  { month: "Tháng 3", revenue: 22000000, paid: 20000000 },
  { month: "Tháng 4", revenue: 19000000, paid: 17000000 },
  { month: "Tháng 5", revenue: 25000000, paid: 23000000 },
  { month: "Tháng 6", revenue: 28000000, paid: 26000000 },
];

const topCustomersData = [
  { name: "Công Ty ABC", amount: 50000000, invoices: 12 },
  { name: "Cửa Hàng XYZ", amount: 45000000, invoices: 8 },
  { name: "Nguyễn Văn A", amount: 25000000, invoices: 5 },
  { name: "Công Ty DEF", amount: 20000000, invoices: 4 },
];

const topProductsData = [
  { name: "Dịch vụ tư vấn", amount: 35000000, percentage: 28 },
  { name: "Thiết kế website", amount: 28000000, percentage: 22 },
  { name: "Sản phẩm A", amount: 25000000, percentage: 20 },
  { name: "Khác", amount: 37000000, percentage: 30 },
];

const paymentMethodsData = [
  { name: "PayOS", value: 85, color: "#0066CC" },
  { name: "PayPal", value: 10, color: "#003087" },
  { name: "Chuyển khoản", value: 5, color: "#666666" },
];

export default function Reports() {
  const [period, setPeriod] = useState("6months");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê</h1>
            <p className="text-gray-600">Phân tích chi tiết doanh thu và hiệu suất kinh doanh</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>

        {/* Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thismonth">Tháng này</SelectItem>
                <SelectItem value="lastmonth">Tháng trước</SelectItem>
                <SelectItem value="3months">3 tháng gần nhất</SelectItem>
                <SelectItem value="6months">6 tháng gần nhất</SelectItem>
                <SelectItem value="thisyear">Năm nay</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh Thu Theo Tháng</CardTitle>
            <CardDescription>So sánh doanh thu và tiền đã thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M VND`} />
                <Legend />
                <Bar dataKey="revenue" fill="#0066CC" name="Tổng Doanh Thu" />
                <Bar dataKey="paid" fill="#00AA44" name="Đã Thanh Toán" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Khách Hàng Hàng Đầu</CardTitle>
              <CardDescription>Khách hàng có doanh thu cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCustomersData.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-gray-600">{customer.invoices} hóa đơn</p>
                    </div>
                    <p className="font-bold">{(customer.amount / 1000000).toFixed(1)}M</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Phương Thức Thanh Toán</CardTitle>
              <CardDescription>Phân bố theo phương thức</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Sản Phẩm/Dịch Vụ Bán Chạy</CardTitle>
            <CardDescription>Sản phẩm có doanh thu cao nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsData.map((product, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.percentage}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(product.amount / 1000000).toFixed(1)}M VND
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold">125.5M VND</p>
              <p className="text-xs text-green-600 mt-1">+12% vs kỳ trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tổng Hóa Đơn</p>
              <p className="text-2xl font-bold">48</p>
              <p className="text-xs text-green-600 mt-1">+5 vs kỳ trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Tỷ Lệ Thanh Toán</p>
              <p className="text-2xl font-bold">72%</p>
              <p className="text-xs text-green-600 mt-1">+2.5% vs kỳ trước</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Khách Hàng Mới</p>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-green-600 mt-1">+3 vs kỳ trước</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
