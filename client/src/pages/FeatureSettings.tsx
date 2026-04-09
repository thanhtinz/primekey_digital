import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trpc } from "@/lib/trpc";
import {
  Star, Shield, Users2, ShoppingBag, Heart, Trophy, BookOpen,
  Ticket, Wallet, MessageSquare, Loader2, ToggleLeft
} from "lucide-react";

const FEATURE_ICONS: Record<string, React.ElementType> = {
  points: Star,
  warranty: Shield,
  referral: Users2,
  flash_sale: ShoppingBag,
  wishlist: Heart,
  leaderboard: Trophy,
  blog: BookOpen,
  coupon: Ticket,
  wallet: Wallet,
  review: MessageSquare,
};

const CATEGORY_LABELS: Record<string, string> = {
  loyalty: "Khách hàng thân thiết",
  service: "Dịch vụ",
  marketing: "Marketing & Khuyến mãi",
  ux: "Trải nghiệm người dùng",
  gamification: "Gamification",
  content: "Nội dung",
  payment: "Thanh toán",
  general: "Chung",
};

const CATEGORY_COLORS: Record<string, string> = {
  loyalty: "bg-yellow-100 text-yellow-800",
  service: "bg-blue-100 text-blue-800",
  marketing: "bg-pink-100 text-pink-800",
  ux: "bg-purple-100 text-purple-800",
  gamification: "bg-orange-100 text-orange-800",
  content: "bg-green-100 text-green-800",
  payment: "bg-teal-100 text-teal-800",
  general: "bg-slate-100 text-slate-800",
};

export default function FeatureSettings() {
  const { data: flags, isLoading, refetch } = trpc.featureFlags.getAll.useQuery();
  const updateFlag = trpc.featureFlags.update.useMutation();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleToggle = async (key: string, enabled: boolean) => {
    setLoadingKey(key);
    try {
      await updateFlag.mutateAsync({ key, enabled });
      await refetch();
      toast.success(`Đã ${enabled ? "bật" : "tắt"} tính năng thành công`);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoadingKey(null);
    }
  };

  // Group flags by category
  const grouped: Record<string, typeof flags> = {};
  if (flags) {
    for (const flag of flags) {
      const cat = flag.category || "general";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat]!.push(flag);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <ToggleLeft className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản lý tính năng</h1>
              <p className="text-sm text-slate-500">Bật/tắt các tính năng hiển thị ngoài client</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <Card key={category} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[category] || CATEGORY_COLORS.general}`}>
                      {CATEGORY_LABELS[category] || category}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(items || []).map((flag) => {
                    const Icon = FEATURE_ICONS[flag.key] || ToggleLeft;
                    const isUpdating = loadingKey === flag.key;
                    return (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${flag.enabled ? "bg-blue-100" : "bg-slate-100"}`}>
                            <Icon className={`h-4 w-4 ${flag.enabled ? "text-blue-600" : "text-slate-400"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-800">{flag.label}</p>
                              <Badge variant={flag.enabled ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                                {flag.enabled ? "Đang bật" : "Đã tắt"}
                              </Badge>
                            </div>
                            {flag.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{flag.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={(checked) => handleToggle(flag.key, checked)}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <CardDescription className="text-blue-700 text-sm">
              <strong>Lưu ý:</strong> Khi tắt một tính năng, nó sẽ bị ẩn ngay lập tức trên giao diện khách hàng. Dữ liệu liên quan vẫn được giữ nguyên trong hệ thống và có thể bật lại bất kỳ lúc nào.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
