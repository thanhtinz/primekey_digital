import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayoutCustom from "@/components/DashboardLayoutCustom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WarrantySettingsPage() {
  const { data: settings, isLoading } = trpc.warranty.getSettings.useQuery(undefined, { staleTime: 30_000 });
  const updateMutation = trpc.warranty.updateSettings.useMutation({
    onSuccess: () => toast.success("Đã lưu cấu hình bảo hành"),
    onError: (e) => toast.error(e.message),
  });

  const [defaultMonths, setDefaultMonths] = useState(12);
  const [terms, setTerms] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [autoActivate, setAutoActivate] = useState(true);

  useEffect(() => {
    if (settings) {
      setDefaultMonths(settings.defaultMonths || 12);
      setTerms(settings.termsAndConditions || "");
      setContactInfo(settings.contactInfo || "");
      setAutoActivate(settings.autoActivateOnPaid ?? true);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      defaultMonths,
      termsAndConditions: terms,
      contactInfo,
      autoActivateOnPaid: autoActivate,
    });
  };

  return (
    <DashboardLayoutCustom>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            Cấu Hình Bảo Hành
          </h1>
          <p className="text-muted-foreground mt-1">Thiết lập thời hạn, điều khoản và thông tin liên hệ bảo hành</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Thời Hạn Mặc Định</CardTitle>
                <CardDescription>Thời hạn bảo hành mặc định cho sản phẩm mới (có thể ghi đè ở từng sản phẩm)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label className="w-40">Số tháng bảo hành</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={defaultMonths}
                    onChange={(e) => setDefaultMonths(parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">tháng</span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-40">Tự động kích hoạt</Label>
                  <Switch checked={autoActivate} onCheckedChange={setAutoActivate} />
                  <span className="text-muted-foreground text-sm">
                    {autoActivate ? "Tự động kích hoạt bảo hành khi đơn hàng được thanh toán" : "Kích hoạt thủ công"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Điều Khoản Bảo Hành</CardTitle>
                <CardDescription>Nội dung điều khoản sẽ hiển thị trên trang tra cứu bảo hành công khai</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Ví dụ: Sản phẩm được bảo hành trong trường hợp lỗi từ nhà sản xuất. Không áp dụng cho hư hỏng do người dùng..."
                  rows={6}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Liên Hệ Bảo Hành</CardTitle>
                <CardDescription>Thông tin hỗ trợ khi khách hàng cần bảo hành</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Ví dụ: Hotline: 0123 456 789 | Email: warranty@company.com | Địa chỉ: 123 Nguyễn Huệ, Q1, TP.HCM"
                  rows={3}
                />
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu Cấu Hình
            </Button>
          </>
        )}
      </div>
    </DashboardLayoutCustom>
  );
}
