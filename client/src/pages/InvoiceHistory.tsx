import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Download, Trash2, Search } from "lucide-react";
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

              <Button className="bg-blue-600 hover:bg-blue-700">
                Tạo Hóa Đơn Mới
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Hóa Đơn</CardTitle>
            <CardDescription>Tổng cộng {filteredInvoices.length} hóa đơn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Số HĐ</th>
                    <th className="text-left py-3 px-4 font-semibold">Khách Hàng</th>
                    <th className="text-left py-3 px-4 font-semibold">Ngày Tạo</th>
                    <th className="text-left py-3 px-4 font-semibold">Hạn Thanh Toán</th>
                    <th className="text-right py-3 px-4 font-semibold">Tổng Tiền</th>
                    <th className="text-left py-3 px-4 font-semibold">Trạng Thái</th>
                    <th className="text-center py-3 px-4 font-semibold">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">{invoice.customer}</td>
                      <td className="py-3 px-4">{invoice.date}</td>
                      <td className="py-3 px-4">{invoice.dueDate}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {invoice.amount.toLocaleString()} {invoice.currency}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1 hover:bg-gray-200 rounded" title="Xem chi tiết">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded" title="Tải PDF">
                            <Download className="h-4 w-4 text-green-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded" title="Xóa">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Không tìm thấy hóa đơn nào phù hợp với bộ lọc</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
