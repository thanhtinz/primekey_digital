import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2, Copy, Check, Gift, TrendingUp, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function ReferralPage() {
  const { customer } = useCustomerAuth();
  const email = customer?.email || "";
  const [copied, setCopied] = useState(false);

  const { data: settings } = trpc.referral.getSettings.useQuery();
  const { data: myCode, isLoading: loadingCode } = trpc.referral.getMyCode.useQuery(
    { email },
    { enabled: !!email }
  );
  const { data: stats, isLoading: loadingStats } = trpc.referral.getStats.useQuery(
    { email },
    { enabled: !!email }
  );

  const handleCopy = () => {
    if (myCode?.code) {
      navigator.clipboard.writeText(myCode.code);
      setCopied(true);
      toast.success("Đã sao chép mã giới thiệu!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (myCode?.code) {
      const shareUrl = `${window.location.origin}/catalog?ref=${myCode.code}`;
      if (navigator.share) {
        navigator.share({ title: "Mã giới thiệu", text: `Sử dụng mã ${myCode.code} để nhận ưu đãi!`, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Đã sao chép link giới thiệu!");
      }
    }
  };

  if (!settings?.isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader backHref="/my-account" backLabel="Tài khoản" title="Giới Thiệu Bạn Bè" />
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
          <Users2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chương trình giới thiệu chưa được kích hoạt</p>
          <p className="text-sm mt-1">Vui lòng quay lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader backHref="/my-account" backLabel="Tài khoản" title="Giới Thiệu Bạn Bè" />
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-2">Giới Thiệu Bạn Bè - Nhận Thưởng</h2>
            <p className="text-sm opacity-80 max-w-md mx-auto">
              {settings.description || `Giới thiệu bạn bè và nhận ${settings.rewardType === "percentage" ? settings.rewardAmount + "% giảm giá" : settings.rewardType === "points" ? settings.rewardAmount + " điểm" : new Intl.NumberFormat("vi-VN").format(Number(settings.rewardAmount)) + "₫"} cho mỗi lượt giới thiệu thành công!`}
            </p>
          </CardContent>
        </Card>

        {/* My code */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Mã Giới Thiệu Của Bạn</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCode ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
                  <span className="text-2xl font-bold tracking-widest text-blue-600">{myCode?.code || "..."}</span>
                </div>
                <Button onClick={handleCopy} variant="outline" className="gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Button>
                <Button onClick={handleShare} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                  <Share2 className="h-4 w-4" /> Chia sẻ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-5 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
              <p className="text-sm text-gray-500">Lượt giới thiệu</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-5 text-center">
              <Gift className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900">
                {settings.rewardType === "points" ? (stats?.totalRewards || "0") + " điểm" : new Intl.NumberFormat("vi-VN").format(Number(stats?.totalRewards || 0)) + "₫"}
              </p>
              <p className="text-sm text-gray-500">Tổng thưởng</p>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Lịch Sử Giới Thiệu</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
            ) : !stats?.history || stats.history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có lượt giới thiệu nào</p>
            ) : (
              <div className="space-y-2">
                {stats.history.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{r.refereeEmail}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status === "completed" ? "Hoàn thành" : "Chờ xử lý"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
