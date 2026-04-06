import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, User, Phone, Mail, MapPin,
  FileText, DollarSign, TrendingUp, Loader2, Calendar
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CREATED: { label: "Tạo Đơn", variant: "secondary" },
  PAID: { label: "Đã TT", variant: "default" },
  SHIPPING: { label: "Đang Giao", variant: "secondary" },
  WARRANTY: { label: "Bảo Hành", variant: "outline" },
  FAILED: { label: "Thất Bại", variant: "destructive" },
  EXPIRED: { label: "Hết Hạn", variant: "outline" },
};

function formatCurrency(amount: string | number | null | undefined, currency = "VND") {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") return `$${num.toFixed(2)}`;
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
}

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const customerId = parseInt(params.id || "0");

  const { data: customer, isLoading: customerLoading } = trpc.customers.get.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  );

  const { data: allInvoices = [], isLoading: invoicesLoading } = trpc.invoices.list.useQuery();

  const customerInvoices = useMemo(() => {
    return allInvoices.filter(inv => inv.customerId === customerId);
  }, [allInvoices, customerId]);

  const stats = useMemo(() => {
    const paid = customerInvoices.filter(inv => inv.status === "PAID");
    const totalRevenue = paid.reduce((sum, inv) => {
      const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
      return sum + amount;
    }, 0);
    return {
      totalInvoices: customerInvoices.length,
      paidInvoices: paid.length,
      pendingInvoices: customerInvoices.filter(inv => inv.status === "CREATED").length,
      totalRevenue,
    };
  }, [customerInvoices]);

  const isLoading = customerLoading || invoicesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <User className="h-14 w-14 mb-3 opacity-20" />
          <p className="font-medium text-foreground">Không tìm thấy khách hàng</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay Lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Quay Lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Chi tiết khách hàng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Thông Tin Khách Hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    {customer.taxCode && (
                      <p className="text-xs text-muted-foreground">MST: {customer.taxCode}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Tham gia: {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Tổng HĐ</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalInvoices}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Đã TT</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
                </CardContent>
              </Card>
              <Card className="border border-border col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Tổng Doanh Thu</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoice History */}
          <div className="lg:col-span-2">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Lịch Sử Hóa Đơn ({customerInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {customerInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                    <p className="font-medium text-foreground">Chưa có hóa đơn nào</p>
                    <p className="text-sm mt-1">Khách hàng này chưa có giao dịch</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-y border-border">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Số HĐ</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Ngày Tạo</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trạng Thái</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tổng Cộng</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerInvoices.map((inv) => {
                          const statusInfo = STATUS_MAP[inv.status || "PENDING"] || STATUS_MAP.PENDING;
                          return (
                            <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-medium text-foreground text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {inv.invoiceNumber}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground hidden md:table-cell">
                                {formatDate(inv.createdAt)}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant={statusInfo.variant} className="text-xs">
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                                {formatCurrency(inv.totalAmount, inv.currency || "VND")}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setLocation(`/invoices/${inv.id}`)}
                                >
                                  Xem
                                </Button>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
