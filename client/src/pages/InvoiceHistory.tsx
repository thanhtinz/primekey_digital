import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";

export default function InvoiceHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  // Fetch invoices
  const { data: invoices = [], isLoading, refetch } = trpc.invoices.list.useQuery();

  // Mutations
  const updateInvoice = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật hóa đơn thành công!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi cập nhật hóa đơn");
    },
  });

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Xóa hóa đơn thành công!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi xóa hóa đơn");
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchesCurrency = filterCurrency === "all" || invoice.currency === filterCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: "bg-green-100", text: "text-green-800", label: "✓ Đã Thanh Toán" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "⏳ Chờ Thanh Toán" },
      FAILED: { bg: "bg-red-100", text: "text-red-800", label: "✗ Thất Bại" },
      EXPIRED: { bg: "bg-gray-100", text: "text-gray-800", label: "⏱ Hết Hạn" },
    };
    return badges[status] || badges.PENDING;
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa hóa đơn này?")) {
      deleteInvoice.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lịch Sử Hóa Đơn</h1>
          <p className="text-gray-600">Xem và quản lý tất cả hóa đơn đã tạo</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm số hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="PAID">Đã Thanh Toán</SelectItem>
              <SelectItem value="PENDING">Chờ Thanh Toán</SelectItem>
              <SelectItem value="FAILED">Thất Bại</SelectItem>
              <SelectItem value="EXPIRED">Hết Hạn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo tiền tệ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tiền tệ</SelectItem>
              <SelectItem value="VND">VND</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Hóa Đơn</CardTitle>
            <CardDescription>Tổng cộng {filteredInvoices.length} hóa đơn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Số Hóa Đơn</th>
                    <th className="text-left py-3 px-4 font-semibold">Ngày Tạo</th>
                    <th className="text-left py-3 px-4 font-semibold">Hạn Thanh Toán</th>
                    <th className="text-left py-3 px-4 font-semibold">Số Tiền</th>
                    <th className="text-left py-3 px-4 font-semibold">Trạng Thái</th>
                    <th className="text-left py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Không có hóa đơn nào
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(invoice => {
                      const badge = getStatusBadge(invoice.status || "PENDING");
                      const amount = typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount;
                      return (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4">{new Date(invoice.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="py-3 px-4">{invoice.expiresAt ? new Date(invoice.expiresAt).toLocaleDateString("vi-VN") : "-"}</td>
                          <td className="py-3 px-4">{amount.toLocaleString("vi-VN")} {invoice.currency}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Xem
                              </Button>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Tải
                              </Button>
                              <Button onClick={() => handleDelete(invoice.id)} variant="outline" size="sm" className="gap-2 text-red-600" disabled={deleteInvoice.isPending}>
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
