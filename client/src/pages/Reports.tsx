import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Users, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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

export default function Reports() {
  const [period, setPeriod] = useState("12");

  const { data: stats, isLoading: statsLoading } = trpc.reports.getDashboardStats.useQuery();
  const { data: revenueData, isLoading: revenueLoading } = trpc.reports.getRevenueByMonth.useQuery();
  const { data: invoiceStats, isLoading: invoiceStatsLoading } = trpc.reports.getInvoiceStats.useQuery();
  const { data: customers = [], isLoading: customersLoading } = trpc.customers.list.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();

  // Process revenue data - last N months
  const processedRevenue = useMemo(() => {
    if (!revenueData) return [];
    const sorted = [...revenueData].sort((a, b) => a.month.localeCompare(b.month));
    const last = parseInt(period);
    const sliced = sorted.slice(-last);
    return sliced.map(item => {
      const parts = item.month.split("/");
      const monthKey = parts[0]?.padStart(2, "0") || item.month;
      return {
        month: MONTH_LABELS[monthKey] || item.month,
        revenue: item.revenue,
      };
    });
  }, [revenueData, period]);

  // Top customers by total invoices
  const topCustomers = useMemo(() => {
    const customerMap: Record<number, { name: string; total: number; count: number }> = {};
    invoices.forEach(inv => {
      if (!inv.customerId) return;
      const customer = customers.find(c => c.id === inv.customerId);
      if (!customer) return;
      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
      if (!customerMap[inv.customerId]) {
        customerMap[inv.customerId] = { name: customer.name, total: 0, count: 0 };
      }
      customerMap[inv.customerId].total += amount;
      customerMap[inv.customerId].count += 1;
    });
    return Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices, customers]);

  // Invoice status pie data
  const pieData = useMemo(() => {
    if (!invoiceStats) return [];
    return [
      { name: "Chờ TT", value: invoiceStats.PENDING, color: "#f59e0b" },
      { name: "Đã TT", value: invoiceStats.PAID, color: "#10b981" },
      { name: "Thất Bại", value: invoiceStats.FAILED, color: "#ef4444" },
      { name: "Hết Hạn", value: invoiceStats.EXPIRED, color: "#6b7280" },
    ].filter(d => d.value > 0);
  }, [invoiceStats]);

  const isLoading = statsLoading || revenueLoading || invoiceStatsLoading || customersLoading;

  const handleExport = (format: string) => {
    toast.info(`Tính năng xuất ${format} đang được phát triển`);
  };

  const totalRevenue = stats?.totalRevenue || 0;
  const totalInvoices = stats?.totalInvoices || 0;
  const paidInvoices = stats?.paidInvoices || 0;
  const paymentRate = stats?.paymentRate || 0;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê</h1>
            <p className="text-sm text-gray-500 mt-0.5">Phân tích doanh thu và hiệu suất kinh doanh</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 tháng gần đây</SelectItem>
                <SelectItem value="6">6 tháng gần đây</SelectItem>
                <SelectItem value="12">12 tháng gần đây</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => handleExport("Excel")} className="gap-1.5">
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("PDF")} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tổng Doanh Thu</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(totalRevenue)}đ
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DollarSign className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tổng Hóa Đơn</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{totalInvoices}</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Đã Thanh Toán</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{paidInvoices}</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-4.5 w-4.5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tỷ Lệ TT</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{paymentRate.toFixed(0)}%</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                    <TrendingDown className="h-4.5 w-4.5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 shadow-sm border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Doanh Thu Theo Tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-64 bg-gray-50 rounded animate-pulse" />
              ) : processedRevenue.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                  <p className="text-xs mt-1">Tạo hóa đơn để xem biểu đồ</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={processedRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: any) => [`${v.toLocaleString("vi-VN")}đ`, "Doanh Thu"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status Pie */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Trạng Thái Hóa Đơn</CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceStatsLoading ? (
                <div className="h-64 bg-gray-50 rounded animate-pulse" />
              ) : pieData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <FileText className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có hóa đơn</p>
                </div>
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [v, "Hóa đơn"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Top Khách Hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                  <Users className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((c.total / (topCustomers[0]?.total || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                        {formatCurrency(c.total)}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customers Bar Chart */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Doanh Thu Theo Khách Hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                  <Package className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topCustomers} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={55} />
                    <Tooltip formatter={(v: any) => [`${v.toLocaleString("vi-VN")}đ`, "Doanh Thu"]} />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
