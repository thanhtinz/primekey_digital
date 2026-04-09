import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus, Trash2, Loader2, Clock, Tag, Edit } from "@/components/Icon";
import { toast } from "sonner";

function formatCurrency(amount: string | number | null | undefined) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function FlashSaleSettings() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("0");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const { data: flashSales = [], isLoading } = trpc.flashSale.list.useQuery(undefined, { staleTime: 10_000 });
  const { data: products = [] } = trpc.products.list.useQuery(undefined, { staleTime: 60_000 });

  const createMutation = trpc.flashSale.create.useMutation({
    onSuccess: () => { toast.success("Tạo Flash Sale thành công"); utils.flashSale.list.invalidate(); setShowCreate(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.flashSale.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật"); utils.flashSale.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.flashSale.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa"); utils.flashSale.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setSelectedProduct(""); setSalePrice(""); setDiscountPercent(""); setStartTime(""); setEndTime(""); setMaxQuantity("0"); setDescription("");
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id.toString() === productId);
    if (product && discountPercent) {
      const disc = parseInt(discountPercent);
      const price = parseFloat(product.price || "0");
      setSalePrice(Math.round(price * (1 - disc / 100)).toString());
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPercent(val);
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product && val) {
      const disc = parseInt(val);
      const price = parseFloat(product.price || "0");
      setSalePrice(Math.round(price * (1 - disc / 100)).toString());
    }
  };

  const handleCreate = () => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product || !salePrice || !startTime || !endTime || !discountPercent) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createMutation.mutate({
      productId: product.id,
      productName: product.name,
      originalPrice: product.price || "0",
      salePrice,
      discountPercent: parseInt(discountPercent),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      maxQuantity: parseInt(maxQuantity) || 0,
      description,
    });
  };

  const toggleActive = (sale: any) => {
    updateMutation.mutate({ id: sale.id, isActive: !sale.isActive });
  };

  return (
    <DashboardLayoutCustom>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-red-500" />
              Quản Lý Flash Sale
            </h1>
            <p className="text-muted-foreground mt-1">Tạo và quản lý các chương trình giảm giá có thời hạn</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Flash Sale
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : flashSales.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Chưa có Flash Sale nào</p>
              <p className="text-sm mt-1">Nhấn "Tạo Flash Sale" để bắt đầu</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {flashSales.map((sale) => {
              const now = new Date();
              const isLive = sale.isActive && new Date(sale.startTime) <= now && new Date(sale.endTime) > now;
              const isUpcoming = sale.isActive && new Date(sale.startTime) > now;
              const isExpired = new Date(sale.endTime) <= now;
              return (
                <Card key={sale.id} className={`transition-shadow hover:shadow-md ${!sale.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{sale.productName}</span>
                          <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                            <Tag className="h-3 w-3 mr-1" />
                            -{sale.discountPercent}%
                          </Badge>
                          {isLive && <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">LIVE</Badge>}
                          {isUpcoming && <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Sắp diễn ra</Badge>}
                          {isExpired && <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Đã kết thúc</Badge>}
                          {!sale.isActive && <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Tắt</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-red-500 font-bold">{formatCurrency(sale.salePrice)}</span>
                          <span className="text-muted-foreground line-through text-xs">{formatCurrency(sale.originalPrice)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(sale.startTime)} → {formatDate(sale.endTime)}
                        </p>
                        {sale.maxQuantity && sale.maxQuantity > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Đã bán: {sale.soldQuantity || 0}/{sale.maxQuantity}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Bật</Label>
                          <Switch checked={sale.isActive ?? true} onCheckedChange={() => toggleActive(sale)} />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => { if (confirm("Xóa Flash Sale này?")) deleteMutation.mutate({ id: sale.id }); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              Tạo Flash Sale Mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sản Phẩm</Label>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn sản phẩm..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} — {formatCurrency(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giảm giá (%)</Label>
                <Input type="number" min={1} max={99} value={discountPercent} onChange={(e) => handleDiscountChange(e.target.value)} className="mt-1" placeholder="20" />
              </div>
              <div>
                <Label>Giá sale</Label>
                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="mt-1" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bắt đầu</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Kết thúc</Label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Số lượng tối đa (0 = không giới hạn)</Label>
              <Input type="number" min={0} value={maxQuantity} onChange={(e) => setMaxQuantity(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Mô tả ngắn về chương trình..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Tạo Flash Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayoutCustom>
  );
}
