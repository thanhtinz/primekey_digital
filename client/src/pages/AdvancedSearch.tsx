import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, FileText, User, DollarSign, Calendar } from "lucide-react";
import { useLocation } from "wouter";

const statusLabels: Record<string, string> = {
  CREATED: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  SHIPPING: "Đang giao",
  WARRANTY: "Bảo hành",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const statusColors: Record<string, string> = {
  CREATED: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  SHIPPING: "bg-blue-100 text-blue-700",
  WARRANTY: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-red-100 text-red-700",
};

export default function AdvancedSearch() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    keyword: "",
    status: "ALL",
    currency: "ALL",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    product: "",
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  const [searched, setSearched] = useState(false);

  const { data: invoices, isLoading } = trpc.invoices.listWithDateRange.useQuery(
    {
      status: activeFilters.status !== "ALL" ? activeFilters.status : undefined,
      currency: activeFilters.currency !== "ALL" ? activeFilters.currency : undefined,
      fromDate: activeFilters.dateFrom || undefined,
      toDate: activeFilters.dateTo || undefined,
    },
    { enabled: searched }
  );

  const handleSearch = () => {
    setActiveFilters({ ...filters });
    setSearched(true);
  };

  const handleReset = () => {
    setFilters({ keyword: "", status: "ALL", currency: "ALL", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "", product: "" });
    setSearched(false);
  };

  // Client-side filtering for keyword, amount range, product
  const filteredInvoices = invoices?.filter(inv => {
    if (activeFilters.keyword) {
      const kw = activeFilters.keyword.toLowerCase();
      const match = (inv.invoiceNumber || "").toLowerCase().includes(kw) ||
        ((inv as any).customerName || "").toLowerCase().includes(kw) ||
        ((inv as any).notes || "").toLowerCase().includes(kw);
      if (!match) return false;
    }
    if (activeFilters.minAmount && Number(inv.totalAmount) < Number(activeFilters.minAmount)) return false;
    if (activeFilters.maxAmount && Number(inv.totalAmount) > Number(activeFilters.maxAmount)) return false;
    return true;
  }) || [];

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tìm Kiếm Nâng Cao</h1>
          <p className="text-muted-foreground text-sm mt-1">Tìm kiếm hóa đơn với nhiều bộ lọc kết hợp</p>
        </div>

        {/* Filter form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ Lọc Tìm Kiếm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Từ Khóa</Label>
                <Input
                  placeholder="Mã HĐ, tên khách hàng, ghi chú..."
                  value={filters.keyword}
                  onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
                />
              </div>
              <div>
                <Label>Trạng Thái</Label>
                <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Từ Ngày</Label>
                <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
              </div>
              <div>
                <Label>Đến Ngày</Label>
                <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
              </div>
              <div>
                <Label>Tiền Tệ</Label>
                <Select value={filters.currency} onValueChange={v => setFilters(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Khoảng Tiền</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Từ" value={filters.minAmount} onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))} />
                  <Input type="number" placeholder="Đến" value={filters.maxAmount} onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleSearch} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? "Đang tìm..." : "Tìm Kiếm"}
              </Button>
              <Button variant="outline" onClick={handleReset}>Xóa Bộ Lọc</Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Kết Quả ({filteredInvoices.length} hóa đơn)</h2>
            </div>

            {filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy hóa đơn phù hợp</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map(inv => (
                  <Card
                    key={inv.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-mono font-medium text-sm">{inv.invoiceNumber}</p>
                            {(inv as any).customerName && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" />{(inv as any).customerName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {Number(inv.totalAmount).toLocaleString("vi-VN")} {inv.currency}
                            </p>
                            {inv.createdAt && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </div>
                          <Badge className={`text-xs ${statusColors[inv.status || ""] || "bg-gray-100 text-gray-700"}`}>
                            {statusLabels[inv.status || ""] || inv.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
