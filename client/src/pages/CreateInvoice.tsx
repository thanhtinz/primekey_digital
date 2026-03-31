import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CreateInvoice() {
  const [currency, setCurrency] = useState("VND");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [template, setTemplate] = useState("default");

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * item.taxRate) / 100;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal + tax - discount;

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  const handleCreateInvoice = () => {
    if (!customerInfo.name.trim()) {
      alert("Vui lòng nhập tên khách hàng");
      return;
    }
    if (items.length === 0 || items.every((item) => !item.description.trim())) {
      alert("Vui lòng thêm ít nhất một sản phẩm/dịch vụ");
      return;
    }
    console.log({
      customerInfo,
      items,
      currency,
      discountPercent,
      notes,
      template,
      total,
    });
    alert("Hóa đơn đã được tạo thành công!");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency === "VND" ? "VND" : "USD",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tạo Hóa Đơn</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Tạo hóa đơn mới cho khách hàng</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Customer Information */}
            <Card className="shadow-sm md:shadow-md border-0">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Thông Tin Khách Hàng</CardTitle>
                <CardDescription className="text-xs md:text-sm">Nhập thông tin khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Khách Hàng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập tên khách hàng"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerChange("name", e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Nhập email khách hàng"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerChange("email", e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <Input
                    placeholder="Nhập số điện thoại"
                    value={customerInfo.phone}
                    onChange={(e) => handleCustomerChange("phone", e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa Chỉ
                  </label>
                  <textarea
                    placeholder="Nhập địa chỉ khách hàng"
                    value={customerInfo.address}
                    onChange={(e) => handleCustomerChange("address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="shadow-sm md:shadow-md border-0">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Sản Phẩm/Dịch Vụ</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Thêm các sản phẩm hoặc dịch vụ</CardDescription>
                  </div>
                  <Button
                    onClick={addItem}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Thêm</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3 md:p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sản phẩm {index + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Mô Tả
                      </label>
                      <Input
                        placeholder="Nhập mô tả sản phẩm/dịch vụ"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Quantity, Price, Tax */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Số Lượng
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Giá
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Thuế (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right text-xs md:text-sm">
                      <span className="text-gray-600">Thành tiền: </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-sm md:shadow-md border-0">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Ghi Chú</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Nhập ghi chú hoặc điều khoản thanh toán"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-4 md:space-y-6">
            {/* Settings */}
            <Card className="shadow-sm md:shadow-md border-0">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Cài Đặt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại Tiền Tệ
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND (Việt Nam)</SelectItem>
                      <SelectItem value="USD">USD (Mỹ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mẫu Hóa Đơn
                  </label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Mẫu Mặc Định</SelectItem>
                      <SelectItem value="modern">Mẫu Hiện Đại</SelectItem>
                      <SelectItem value="classic">Mẫu Cổ Điển</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giảm Giá (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="shadow-sm md:shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Tóm Tắt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Cộng:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Thuế:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Giảm Giá:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2 md:pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng Cộng:</span>
                  <span className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2 md:space-y-3">
              <Button
                onClick={handleCreateInvoice}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4" />
                Tạo Hóa Đơn
              </Button>
              <Button
                variant="outline"
                className="w-full"
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
