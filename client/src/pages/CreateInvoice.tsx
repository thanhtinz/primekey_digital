import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayoutCustom";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function CreateInvoice() {
  const [currency, setCurrency] = useState("VND");
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ]);
  const [discountPercent, setDiscountPercent] = useState(0);

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
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tạo Hóa Đơn</h1>
          <p className="text-gray-600">Nhập thông tin hóa đơn mới</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Currency */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Cơ Bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Khách Hàng</label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Công Ty ABC</SelectItem>
                        <SelectItem value="2">Nguyễn Văn A</SelectItem>
                        <SelectItem value="3">Cửa Hàng XYZ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tiền Tệ</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND (PayOS)</SelectItem>
                        <SelectItem value="USD">USD (PayPal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Chi Tiết Hóa Đơn</CardTitle>
                <Button size="sm" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Thêm Dòng
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Mô Tả</th>
                        <th className="text-right py-2 px-2 w-20">SL</th>
                        <th className="text-right py-2 px-2 w-24">Đơn Giá</th>
                        <th className="text-right py-2 px-2 w-16">Thuế %</th>
                        <th className="text-right py-2 px-2 w-24">Tổng</th>
                        <th className="text-center py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const itemTotal = item.quantity * item.unitPrice;
                        const itemTax = (itemTotal * item.taxRate) / 100;
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="py-2 px-2">
                              <Input
                                placeholder="Mô tả sản phẩm/dịch vụ"
                                value={item.description}
                                onChange={(e) =>
                                  updateItem(item.id, "description", e.target.value)
                                }
                                className="text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(item.id, "quantity", parseFloat(e.target.value))
                                }
                                className="text-xs text-right"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(item.id, "unitPrice", parseFloat(e.target.value))
                                }
                                className="text-xs text-right"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                value={item.taxRate}
                                onChange={(e) =>
                                  updateItem(item.id, "taxRate", parseFloat(e.target.value))
                                }
                                className="text-xs text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-semibold text-xs">
                              {(itemTotal + itemTax).toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Tổng Cộng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Cộng Tiền:</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Thuế:</span>
                  <span className="font-semibold">{tax.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Giảm Giá ({discountPercent}%):</span>
                  <span className="font-semibold">-{discount.toLocaleString()} {currency}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Tổng Cộng:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {total.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="space-y-2 pt-4">
                  <label className="text-sm font-medium">Giảm Giá %</label>
                  <Input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Tạo Hóa Đơn
                  </Button>
                  <Button variant="outline" className="w-full">
                    Lưu Nháp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
