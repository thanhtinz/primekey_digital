import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ArrowLeft, User, Package } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const [currency, setCurrency] = useState<"VND" | "USD">("VND");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [useExistingCustomer, setUseExistingCustomer] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customers and templates
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: templates = [] } = trpc.invoiceTemplates.list.useQuery();

  const createInvoiceMutation = trpc.invoices.create.useMutation();
  const createCustomerMutation = trpc.customers.create.useMutation();
  const utils = trpc.useUtils();

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, taxRate: 10 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const customer = customers.find(c => c.id.toString() === id);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerEmail(customer.email || "");
      setCustomerPhone(customer.phone || "");
      setCustomerAddress(customer.address || "");
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  };

  const handleCreateInvoice = async () => {
    if (!customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!customerEmail.trim()) {
      toast.error("Vui lòng nhập email khách hàng");
      return;
    }
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm/dịch vụ");
      return;
    }
    for (const item of validItems) {
      if (item.quantity <= 0) { toast.error("Số lượng phải lớn hơn 0"); return; }
      if (item.unitPrice < 0) { toast.error("Giá không thể âm"); return; }
    }
    if (discountPercent < 0 || discountPercent > 100) {
      toast.error("Giảm giá phải từ 0-100%");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = customerId ? parseInt(customerId) : 0;

      // Create new customer if not using existing
      if (!useExistingCustomer || !customerId) {
        const result = await createCustomerMutation.mutateAsync({
          name: customerName,
          email: customerEmail,
          phone: customerPhone || undefined,
          address: customerAddress || undefined,
        });
        // Refresh customers to get the new ID
        await utils.customers.list.invalidate();
        const updatedCustomers = await utils.customers.list.fetch();
        const newCustomer = updatedCustomers.find(c => c.email === customerEmail);
        if (newCustomer) finalCustomerId = newCustomer.id;
      }

      if (!finalCustomerId) {
        toast.error("Không thể xác định khách hàng");
        return;
      }

      await createInvoiceMutation.mutateAsync({
        customerId: finalCustomerId,
        invoiceNumber: generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        currency,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount: total,
        status: "PENDING",
        notes: notes || undefined,
      });

      await utils.invoices.list.invalidate();
      toast.success("Hóa đơn đã được tạo thành công!", {
        description: `Tổng tiền: ${formatCurrency(total)}`,
      });
      setLocation("/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo hóa đơn thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency === "VND" ? "VND" : "USD",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/invoices")} className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Hóa Đơn Mới</h1>
            <p className="text-sm text-gray-500">Điền thông tin để tạo hóa đơn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Information */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Thông Tin Khách Hàng
                  </CardTitle>
                  {customers.length > 0 && (
                    <button
                      onClick={() => setUseExistingCustomer(!useExistingCustomer)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {useExistingCustomer ? "Nhập thủ công" : "Chọn từ danh sách"}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {useExistingCustomer && customers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Khách Hàng</label>
                    <Select value={customerId} onValueChange={handleSelectCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name} - {c.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên Khách Hàng <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                    <Input
                      placeholder="0901234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa Chỉ</label>
                    <Input
                      placeholder="123 Đường ABC, TP.HCM"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Sản Phẩm / Dịch Vụ
                  </CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Thêm Dòng
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                  <div className="col-span-4">Mô tả</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-3 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Thuế %</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                    <div className="col-span-12 sm:col-span-4">
                      <Input
                        placeholder={`Sản phẩm ${index + 1}`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="bg-white text-sm h-9"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                        className="bg-white text-sm h-9 text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="bg-white text-sm h-9"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                        className="bg-white text-sm h-9 text-center"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Line total */}
                    <div className="col-span-12 text-right text-xs text-gray-500 pr-1">
                      Thành tiền: <span className="font-medium text-gray-800">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Ghi Chú</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Ghi chú, điều khoản thanh toán, hoặc thông tin bổ sung..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Settings */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Cài Đặt Hóa Đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại Tiền Tệ</label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as "VND" | "USD")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">🇻🇳 VND - Việt Nam Đồng</SelectItem>
                      <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mẫu Hóa Đơn</label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mẫu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name} {t.isDefault ? "(Mặc định)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Giảm Giá (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="shadow-sm border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-blue-900">Tóm Tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thuế:</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá ({discountPercent}%):</span>
                    <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2.5 flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng Cộng:</span>
                  <span className="text-xl font-bold text-blue-700">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleCreateInvoice}
                disabled={isSubmitting}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-11"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Đang tạo...</>
                ) : (
                  <><Save className="h-4 w-4" />Tạo Hóa Đơn</>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/invoices")}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
