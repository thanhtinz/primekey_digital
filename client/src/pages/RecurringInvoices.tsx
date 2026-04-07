import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RefreshCw, Plus, Trash2, Calendar, User, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

const intervalLabels: Record<string, string> = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  quarterly: "Hàng quý",
};

export default function RecurringInvoices() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    currency: "VND",
    recurringInterval: "monthly",
    recurringStartDate: new Date().toISOString().split("T")[0],
    notes: "",
    items: [{ name: "", quantity: 1, unitPrice: 0 }],
  });

  const { data: invoices, refetch } = trpc.invoices.listRecurring.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  const createMutation = trpc.invoices.createRecurring.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo hóa đơn định kỳ");
      setOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.customerId) return toast.error("Vui lòng chọn khách hàng");
    const validItems = form.items.filter(i => i.name && i.unitPrice > 0);
    if (!validItems.length) return toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
    createMutation.mutate({
      customerId: Number(form.customerId),
      currency: form.currency as "VND" | "USD",
      recurringInterval: form.recurringInterval as "weekly" | "monthly" | "quarterly",
      recurringStartDate: form.recurringStartDate,
      notes: form.notes,
      items: validItems,
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: "", quantity: 1, unitPrice: 0 }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: string, value: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  return (
    <DashboardLayoutCustom>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hóa Đơn Định Kỳ</h1>
            <p className="text-muted-foreground text-sm mt-1">Tự động tạo lại hóa đơn theo chu kỳ</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Tạo Định Kỳ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Hóa Đơn Định Kỳ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Khách Hàng *</Label>
                  <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Chu Kỳ</Label>
                    <Select value={form.recurringInterval} onValueChange={v => setForm(f => ({ ...f, recurringInterval: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                        <SelectItem value="monthly">Hàng tháng</SelectItem>
                        <SelectItem value="quarterly">Hàng quý</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tiền Tệ</Label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Ngày Bắt Đầu</Label>
                  <Input type="date" value={form.recurringStartDate} onChange={e => setForm(f => ({ ...f, recurringStartDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Sản Phẩm / Dịch Vụ</Label>
                  <div className="space-y-2 mt-1">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input placeholder="Tên" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} className="flex-1" />
                        <Input type="number" placeholder="SL" value={item.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))} className="w-16" />
                        <Input type="number" placeholder="Giá" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", Number(e.target.value))} className="w-24" />
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Thêm dòng</Button>
                  </div>
                </div>
                <div>
                  <Label>Ghi Chú</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo Hóa Đơn Định Kỳ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!invoices?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Chưa có hóa đơn định kỳ</p>
              <p className="text-muted-foreground text-sm mt-1">Tạo hóa đơn định kỳ để tự động tái tạo theo chu kỳ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invoices.map(inv => (
              <Card key={inv.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/invoices/${inv.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{inv.invoiceNumber}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {intervalLabels[(inv as any).recurringInterval] || "Định kỳ"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>{(inv as any).customerName || "Khách hàng"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{Number(inv.totalAmount).toLocaleString("vi-VN")} {inv.currency}</span>
                  </div>
                  {(inv as any).recurringNextDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Kỳ tiếp: {new Date((inv as any).recurringNextDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
