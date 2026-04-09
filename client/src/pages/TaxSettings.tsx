import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Receipt, Percent } from "@/components/Icon";

export default function TaxSettings() {
  const [taxName, setTaxName] = useState("VAT");
  const [taxRate, setTaxRate] = useState(10);
  const [isEnabled, setIsEnabled] = useState(false);

  const { data: settings, isLoading } = trpc.tax.getSettings.useQuery();
  const saveMutation = trpc.tax.save.useMutation({
    onSuccess: () => toast.success("Đã lưu cấu hình thuế"),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (settings) {
      setTaxName(settings.taxName || "VAT");
      setTaxRate(parseFloat(settings.taxRate || "10"));
      setIsEnabled(settings.isEnabled ?? false);
    }
  }, [settings]);

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu Hình Thuế</h1>
        <p className="text-muted-foreground text-sm mt-1">Thuế sẽ được tự động tính khi khách hàng thanh toán</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Cài Đặt Thuế
          </CardTitle>
          <CardDescription>
            Khi bật, thuế sẽ được cộng vào tổng tiền khi thanh toán và hiển thị trên hóa đơn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Kích hoạt thuế</p>
              <p className="text-sm text-muted-foreground">Bật/tắt tính thuế khi thanh toán</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thuế</Label>
              <Input
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                placeholder="VD: VAT, GST, Thuế GTGT"
                disabled={!isEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Tỷ lệ thuế (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="pr-10"
                  disabled={!isEnabled}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                VD: Đơn hàng 100,000đ với thuế {taxRate}% → Tổng thanh toán: {(100000 * (1 + taxRate / 100)).toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          {isEnabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Lưu ý:</strong> Thuế {taxName} {taxRate}% sẽ được hiển thị và tính vào tổng tiền trên trang thanh toán và hóa đơn.
              </p>
            </div>
          )}

          <Button
            onClick={() => saveMutation.mutate({ taxName, taxRate, isEnabled })}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? "Đang lưu..." : "Lưu Cấu Hình"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
