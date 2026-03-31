import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "expired";
  currency: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV001",
    customer: "Công Ty ABC",
    date: "30/03/26",
    dueDate: "06/04/26",
    amount: 5000000,
    status: "paid",
    currency: "VND",
  },
  {
    id: "2",
    invoiceNumber: "INV002",
    customer: "Nguyễn Văn A",
    date: "29/03/26",
    dueDate: "05/04/26",
    amount: 2500000,
    status: "pending",
    currency: "VND",
  },
  {
    id: "3",
    invoiceNumber: "INV003",
    customer: "Cửa Hàng XYZ",
    date: "28/03/26",
    dueDate: "04/04/26",
    amount: 10000000,
    status: "paid",
    currency: "VND",
  },
  {
    id: "4",
    invoiceNumber: "INV004",
    customer: "John Doe",
    date: "27/03/26",
    dueDate: "03/04/26",
    amount: 500,
    status: "expired",
    currency: "USD",
  },
];

export default function InvoiceHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchesCurrency = filterCurrency === "all" || invoice.currency === filterCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: "bg-green-100", text: "text-green-800", label: "✓ Đã Thanh Toán" },
      pending: { bg: "bg-orange-100", text: "text-orange-800", label: "⏳ Chờ Thanh Toán" },
      expired: { bg: "bg-red-100", text: "text-red-800", label: "✕ Quá Hạn" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleDelete = (invoiceNumber: string) => {
    toast.error(`Xác nhận xóa hóa đơn ${invoiceNumber}?`, {
      action: {
        label: "Xóa",
        onClick: () => {
          toast.loading("Đang xóa...");
          setTimeout(() => {
            toast.success(`Hóa đơn ${invoiceNumber} đã được xóa thành công!`);
          }, 800);
        },
      },
    });
  };

  const handleDownload = (invoiceNumber: string) => {
    toast.loading(`Đang tải xuống hóa đơn ${invoiceNumber}...`);
    setTimeout(() => {
      toast.success(`Hóa đơn ${invoiceNumber} đã được tải xuống!`);
    }, 1200);
  };

  const handleView = (invoiceNumber: string) => {
    toast.info(`Đang mở chi tiết hóa đơn ${invoiceNumber}...`);
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lịch Sử Hóa Đơn</h1>
          <p className="text-gray-600">Quản lý tất cả hóa đơn của bạn</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo số hóa đơn hoặc khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                  <SelectItem value="paid">Đã Thanh Toán</SelectItem>
                  <SelectItem value="pending">Chờ Thanh Toán</SelectItem>
                  <SelectItem value="expired">Quá Hạn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Tiền tệ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Tiền Tệ</SelectItem>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterCurrency("all");
                  toast.success("Đã reset bộ lọc!");
                }}
              >
                Reset Bộ Lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Hóa Đơn</CardTitle>
            <CardDescription>Tổng cộng: {filteredInvoices.length} hóa đơn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Số Hóa Đơn</th>
                    <th className="text-left py-3 px-4 font-semibold">Khách Hàng</th>
                    <th className="text-left py-3 px-4 font-semibold">Ngày Tạo</th>
                    <th className="text-left py-3 px-4 font-semibold">Hạn Thanh Toán</th>
                    <th className="text-right py-3 px-4 font-semibold">Số Tiền</th>
                    <th className="text-left py-3 px-4 font-semibold">Trạng Thái</th>
                    <th className="text-center py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4">{invoice.customer}</td>
                        <td className="py-3 px-4">{invoice.date}</td>
                        <td className="py-3 px-4">{invoice.dueDate}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(invoice.invoiceNumber)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(invoice.invoiceNumber)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(invoice.invoiceNumber)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Không tìm thấy hóa đơn nào
                      </td>
                    </tr>
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
