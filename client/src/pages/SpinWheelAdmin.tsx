import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, RotateCcw, Save } from "@/components/Icon";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";

const DEFAULT_COLORS = ["#4F46E5", "#7C3AED", "#DB2777", "#DC2626", "#D97706", "#059669", "#0284C7", "#6B7280"];

export default function SpinWheelAdmin() {
  const [config, setConfig] = useState({ isEnabled: false, pointsPerSpin: 50, spinsPerDay: 1 });
  const [items, setItems] = useState<any[]>([]);

  const { data: wheelData, refetch } = trpc.spinWheel.getConfig.useQuery();
  const saveConfigMutation = trpc.spinWheel.saveConfig.useMutation({ onSuccess: () => { toast.success("Đã lưu cấu hình vòng quay"); refetch(); } });
  const saveItemsMutation = trpc.spinWheel.saveItems.useMutation({ onSuccess: () => { toast.success("Đã lưu các ô"); refetch(); } });

  useEffect(() => {
    if (wheelData) {
      if (wheelData.config) setConfig({ isEnabled: wheelData.config.isEnabled ?? false, pointsPerSpin: wheelData.config.pointsPerSpin ?? 50, spinsPerDay: wheelData.config.spinsPerDay ?? 1 });
      if (wheelData.items) setItems(wheelData.items.map((i: any) => ({ ...i, prizeValue: parseFloat(i.prizeValue || "0"), probability: parseFloat(i.probability || "10") })));
    }
  }, [wheelData]);

  const addItem = () => {
    setItems(prev => [...prev, { label: "Ô mới", prizeType: "points", prizeValue: 10, probability: 10, color: DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length], isActive: true, sortOrder: prev.length }]);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const totalProb = items.reduce((sum, i) => sum + (i.probability || 0), 0);

  return (
    <DashboardLayoutCustom>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="ak-page-header">
          <div>
            <h1 className="ak-page-title">Vòng Quay May Mắn</h1>
            <p className="ak-page-subtitle">Cấu hình vòng quay và phần thưởng</p>
          </div>
        </div>
        </div>

        {/* Config */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Cài đặt chung</h2>
          <div className="flex items-center gap-3">
            <Switch checked={config.isEnabled} onCheckedChange={v => setConfig(c => ({ ...c, isEnabled: v }))} />
            <Label>Bật vòng quay</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Điểm mỗi lượt quay (0 = miễn phí)</Label><Input type="number" min={0} value={config.pointsPerSpin} onChange={e => setConfig(c => ({ ...c, pointsPerSpin: parseInt(e.target.value) || 0 }))} /></div>
            <div><Label>Số lượt quay tối đa/ngày</Label><Input type="number" min={1} value={config.spinsPerDay} onChange={e => setConfig(c => ({ ...c, spinsPerDay: parseInt(e.target.value) || 1 }))} /></div>
          </div>
          <Button onClick={() => saveConfigMutation.mutate(config)} disabled={saveConfigMutation.isPending}>
            <Save className="w-4 h-4 mr-2" /> Lưu cài đặt
          </Button>
        </div>

        {/* Items */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Các ô trong vòng quay</h2>
              <p className="text-sm text-gray-400">Tổng xác suất: <span className={totalProb !== 100 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{totalProb}%</span> (cần = 100%)</p>
            </div>
            <Button size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Thêm ô</Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="color" value={item.color || "#4F46E5"} onChange={e => updateItem(idx, "color", e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                  <Input value={item.label} onChange={e => updateItem(idx, "label", e.target.value)} placeholder="Tên ô" className="flex-1" />
                  <Button size="sm" variant="destructive" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Loại thưởng</Label>
                    <Select value={item.prizeType} onValueChange={v => updateItem(idx, "prizeType", v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Điểm</SelectItem>
                        <SelectItem value="wallet_credit">Cộng ví</SelectItem>
                        <SelectItem value="coupon">Mã giảm giá</SelectItem>
                        <SelectItem value="nothing">Không trúng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Giá trị</Label>
                    <Input type="number" min={0} value={item.prizeValue} onChange={e => updateItem(idx, "prizeValue", parseFloat(e.target.value) || 0)} className="h-8" disabled={item.prizeType === "nothing"} />
                  </div>
                  <div>
                    <Label className="text-xs">Xác suất (%)</Label>
                    <Input type="number" min={0} max={100} step={0.1} value={item.probability} onChange={e => updateItem(idx, "probability", parseFloat(e.target.value) || 0)} className="h-8" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.isActive} onCheckedChange={v => updateItem(idx, "isActive", v)} />
                  <Label className="text-xs">Hiển thị</Label>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-center text-gray-400 py-4">Chưa có ô nào. Thêm ô để bắt đầu!</p>}
          </div>

          <Button onClick={() => saveItemsMutation.mutate(items)} disabled={saveItemsMutation.isPending || totalProb !== 100} className="w-full">
            <Save className="w-4 h-4 mr-2" /> Lưu các ô ({totalProb !== 100 ? `Tổng xác suất phải = 100%` : "Sẵn sàng"})
          </Button>
        </div>
      </div>
    </DashboardLayoutCustom>
  );
}
