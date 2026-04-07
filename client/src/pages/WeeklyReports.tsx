import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, Package, BarChart2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function WeeklyReports() {
  const [period, setPeriod] = useState("30");

  const { data: topCustomers } = trpc.reports.topCustomersByPeriod.useQuery({ days: Number(period) });
  const { data: conversionData } = trpc.reports.conversionByProduct.useQuery();
  const { data: monthlyComparison } = trpc.reports.getMonthlyComparison.useQuery();

  const customerChartData = topCustomers?.map(c => ({
    name: c.customerName?.split(" ").slice(-1)[0] || "N/A",
    fullName: c.customerName || "N/A",
    revenue: Number(c.totalSpent),
    invoices: c.orderCount,
  })) || [];

  const conversionChartData = conversionData?.map(p => ({
    name: p.name?.length > 15 ? p.name.slice(0, 15) + "..." : p.name || "N/A",
    fullName: p.name || "N/A",
    total: p.totalOrders,
    paid: p.paidOrders,
    rate: Math.round(p.conversionRate),
  })) || [];

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Báo Cáo Nâng Cao</h1>
            <p className="text-muted-foreground text-sm mt-1">Phân tích doanh thu theo khách hàng và sản phẩm</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
              <SelectItem value="90">90 ngày qua</SelectItem>
              <SelectItem value="365">1 năm qua</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="customers">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="customers"><Users className="w-4 h-4 mr-1.5" />Khách Hàng</TabsTrigger>
            <TabsTrigger value="products"><Package className="w-4 h-4 mr-1.5" />Sản Phẩm</TabsTrigger>
            <TabsTrigger value="monthly"><BarChart2 className="w-4 h-4 mr-1.5" />So Sánh Tháng</TabsTrigger>
          </TabsList>

          {/* Customer Revenue Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Khách Hàng Theo Doanh Thu ({period} ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerChartData.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={customerChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v)} width={55} />
                      <Tooltip formatter={(value: number) => [`${Number(value).toLocaleString("vi-VN")} VND`, "Doanh thu"]} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Table */}
            {customerChartData.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Khách Hàng</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Doanh Thu</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Hóa Đơn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers?.map((c, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{c.customerName || "N/A"}</td>
                            <td className="py-2 text-right font-medium">{Number(c.totalSpent).toLocaleString("vi-VN")}</td>
                            <td className="py-2 text-right text-muted-foreground">{c.orderCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Product Conversion Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Tỷ Lệ Chuyển Đổi Theo Sản Phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversionChartData.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={conversionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={35} />
                      <Tooltip formatter={(value: number) => [value, "Số hóa đơn"]} />
                        <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="total" />
                        <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="paid" />
                      </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={conversionChartData.slice(0, 6)}
                          dataKey="paid"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, rate }) => `${name}: ${rate}%`}
                          labelLine={false}
                        >
                          {conversionChartData.slice(0, 6).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} HĐ`, "Đã thanh toán"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Comparison Tab */}
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Doanh Thu Theo Tháng (12 tháng gần nhất)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!monthlyComparison?.length ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                ) : (() => {
                  const last = monthlyComparison[monthlyComparison.length - 1];
                  const prev = monthlyComparison[monthlyComparison.length - 2];
                  const growth = prev && prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue * 100) : 0;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Tháng Trước</p>
                          <p className="text-xl font-bold mt-1">{Number(prev?.revenue || 0).toLocaleString("vi-VN")}</p>
                          <p className="text-xs text-muted-foreground">VND</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Tháng Này</p>
                          <p className="text-xl font-bold mt-1 text-blue-600">{Number(last?.revenue || 0).toLocaleString("vi-VN")}</p>
                          <p className="text-xs text-muted-foreground">VND</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg text-center text-sm font-medium ${growth >= 0 ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"}`}>
                        {growth >= 0 ? "📈" : "📉"} {growth >= 0 ? "Tăng" : "Giảm"} {Math.abs(growth).toFixed(1)}% so với tháng trước
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="shortMonth" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} width={55} />
                          <Tooltip formatter={(v: number) => [`${v.toLocaleString("vi-VN")} VND`, "Doanh thu"]} labelFormatter={l => `Tháng ${l}`} />
                          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayoutCustom>
  );
}
