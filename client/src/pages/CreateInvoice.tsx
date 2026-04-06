import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2, ArrowLeft, User, Package, Eye, Calendar, Search, PenLine, BookUser, ListChecks } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface InvoiceItem {
  id: string;
  productId: string; // "" = nhập thủ công
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  useExistingProduct: boolean;
}

// Format date to YYYY-MM-DD for input[type=date]
function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const [currency, setCurrency] = useState<"VND" | "USD">("VND");

  // Customer state
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [useExistingCustomer, setUseExistingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 10, useExistingProduct: false },
  ]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Due date: default 7 ngày từ hôm nay
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [dueDateStr, setDueDateStr] = useState<string>(toDateInputValue(defaultDueDate));

  // Load customers, products and templates
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: templates = [] } = trpc.invoiceTemplates.list.useQuery();

  const createInvoiceMutation = trpc.invoices.create.useMutation();
  const createCustomerMutation = trpc.customers.create.useMutation();
  const previewPDFMutation = trpc.pdf.previewInvoice.useMutation();
  const utils = trpc.useUtils();

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
      useExistingProduct: products.length > 0,
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSelectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      const price = typeof product.price === "string" ? parseFloat(product.price) : (product.price || 0);
      setItems(prev => prev.map(item => item.id === itemId ? {
        ...item,
        productId,
        description: product.name,
        unitPrice: price,
      } : item));
    }
  };

  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const customer = customers.find(c => c.id.toString() === id);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerEmail(customer.email || "");
      setCustomerPhone(customer.phone || "");
      setCustomerAddress(customer.address || "");
      setCustomerSearch("");
    }
  };

  const handleToggleCustomerMode = (mode: "list" | "manual") => {
    setUseExistingCustomer(mode === "list");
    if (mode === "manual") {
      // Reset về thủ công
      setCustomerId("");
      setCustomerSearch("");
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  };

  const getDueDate = (): Date => {
    if (dueDateStr) {
      const d = new Date(dueDateStr);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  };

  const handlePreviewPDF = async () => {
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm/dịch vụ để xem trước");
      return;
    }
    setIsPreviewing(true);
    try {
      const result = await previewPDFMutation.mutateAsync({
        invoiceNumber: generateInvoiceNumber(),
        dueDate: getDueDate(),
        customerName: customerName || "Khách Hàng",
        customerEmail: customerEmail || "email@example.com",
        customerAddress: customerAddress || undefined,
        currency,
        items: validItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        discountPercent: discountPercent || undefined,
        notes: notes || undefined,
      });

      const byteArray = Uint8Array.from(atob(result.buffer), c => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = result.filename || "preview.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("PDF đã được tải xuống để xem trước!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo xem trước PDF");
    } finally {
      setIsPreviewing(false);
    }
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
        await createCustomerMutation.mutateAsync({
          name: customerName,
          email: customerEmail,
          phone: customerPhone || undefined,
          address: customerAddress || undefined,
        });
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
        dueDate: getDueDate(),
        currency,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount: total,
        status: "CREATED",
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

  // Filtered customers for search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || "").includes(customerSearch)
  );

  const selectedCustomer = customers.find(c => c.id.toString() === customerId);

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
            <p className="text-sm text-gray-500 hidden sm:block">Điền thông tin để tạo hóa đơn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* ===== CUSTOMER SECTION ===== */}
            <Card className="shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Thông Tin Khách Hàng
                  </CardTitle>
                  {/* Mode toggle tabs */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    <button
                      onClick={() => handleToggleCustomerMode("manual")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        !useExistingCustomer
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <PenLine className="h-3 w-3" />
                      Nhập thủ công
                    </button>
                    <button
                      onClick={() => handleToggleCustomerMode("list")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        useExistingCustomer
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <BookUser className="h-3 w-3" />
                      Từ danh sách
                      {customers.length > 0 && (
                        <span className="bg-blue-100 text-blue-600 rounded-full px-1.5 text-xs">{customers.length}</span>
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mode: Chọn từ danh sách */}
                {useExistingCustomer && (
                  <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    {/* Customer list */}
                    {customers.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Chưa có khách hàng nào. Hãy nhập thủ công.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-gray-100 p-1.5">
                        {filteredCustomers.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">Không tìm thấy khách hàng</div>
                        ) : (
                          filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectCustomer(c.id.toString())}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                                customerId === c.id.toString()
                                  ? "bg-blue-50 border border-blue-200 text-blue-900"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                <span>{c.email}</span>
                                {c.phone && <span>· {c.phone}</span>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {/* Selected customer badge */}
                    {selectedCustomer && (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-blue-900 truncate">{selectedCustomer.name}</div>
                          <div className="text-xs text-blue-600 truncate">{selectedCustomer.email}</div>
                        </div>
                        <button
                          onClick={() => { setCustomerId(""); setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setCustomerAddress(""); }}
                          className="text-blue-400 hover:text-blue-600 text-xs flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Fields: luôn hiện để chỉnh sửa, tự điền khi chọn từ danh sách */}
                <div className={`space-y-3 ${useExistingCustomer && !selectedCustomer ? "opacity-50 pointer-events-none" : ""}`}>
                  {useExistingCustomer && selectedCustomer && (
                    <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                      Thông tin đã được điền từ danh sách. Bạn có thể chỉnh sửa nếu cần.
                    </p>
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
                </div>
              </CardContent>
            </Card>

            {/* ===== INVOICE ITEMS SECTION ===== */}
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
                {/* Header row - desktop only */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                  <div className="col-span-4">Mô tả / Sản phẩm</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Thuế VAT (%)</div>
                  <div className="col-span-1 text-center">Thành tiền</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {/* Product mode toggle */}
                    {products.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
                          <button
                            onClick={() => updateItem(item.id, "useExistingProduct", false)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                              !item.useExistingProduct
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <PenLine className="h-3 w-3" />
                            Thủ công
                          </button>
                          <button
                            onClick={() => updateItem(item.id, "useExistingProduct", true)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                              item.useExistingProduct
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <ListChecks className="h-3 w-3" />
                            Từ danh sách
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">Dòng {index + 1}</span>
                      </div>
                    )}

                    {/* Row: Description / Product selector */}
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-11 sm:col-span-4">
                        {item.useExistingProduct && products.length > 0 ? (
                          <div className="space-y-1.5">
                            <Select
                              value={item.productId}
                              onValueChange={(val) => handleSelectProduct(item.id, val)}
                            >
                              <SelectTrigger className="bg-white text-sm h-9">
                                <SelectValue placeholder="Chọn sản phẩm..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(p => {
                                  const price = typeof p.price === "string" ? parseFloat(p.price) : (p.price || 0);
                                  return (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-gray-400 ml-2 text-xs">
                                        {price.toLocaleString("vi-VN")} {currency}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {/* Vẫn cho phép sửa tên sau khi chọn */}
                            {item.productId && (
                              <Input
                                placeholder="Chỉnh sửa tên sản phẩm nếu cần..."
                                value={item.description}
                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                className="bg-white text-xs h-8"
                              />
                            )}
                          </div>
                        ) : (
                          <Input
                            placeholder={`Tên sản phẩm / dịch vụ ${index + 1}`}
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="bg-white text-sm h-9"
                          />
                        )}
                      </div>

                      {/* Delete button - visible on mobile */}
                      <div className="col-span-1 sm:hidden flex justify-end pt-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Desktop: remaining columns */}
                      <div className="hidden sm:contents">
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                            className="bg-white text-sm h-9 text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="bg-white text-sm h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={item.taxRate.toString()}
                            onValueChange={(v) => updateItem(item.id, "taxRate", parseFloat(v))}
                          >
                            <SelectTrigger className="bg-white text-sm h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="8">8%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile: quantity, price, tax */}
                    <div className="sm:hidden grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Số lượng</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                          className="bg-white text-sm h-9 text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Đơn giá</label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="bg-white text-sm h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Thuế VAT</label>
                        <Select
                          value={item.taxRate.toString()}
                          onValueChange={(v) => updateItem(item.id, "taxRate", parseFloat(v))}
                        >
                          <SelectTrigger className="bg-white text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="8">8%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Mobile: total */}
                    <div className="sm:hidden flex justify-between items-center pt-1 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Thành tiền:</span>
                      <span className="text-sm font-semibold text-blue-700">
                        {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                      </span>
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
                  placeholder="Ghi chú thêm cho hóa đơn (tùy chọn)..."
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

                {/* Due Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    Ngày Hết Hạn Thanh Toán
                  </label>
                  <Input
                    type="date"
                    value={dueDateStr}
                    min={toDateInputValue(new Date())}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Mặc định: 7 ngày kể từ hôm nay
                  </p>
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
                onClick={handlePreviewPDF}
                disabled={isPreviewing || isSubmitting}
                variant="outline"
                className="w-full gap-2 h-10 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {isPreviewing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Đang tạo xem trước...</>
                ) : (
                  <><Eye className="h-4 w-4" />Xem Trước PDF</>
                )}
              </Button>

              <Button
                onClick={handleCreateInvoice}
                disabled={isSubmitting || isPreviewing}
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
                disabled={isSubmitting || isPreviewing}
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
