import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users2, Copy, Check, Gift, TrendingUp, Loader2, Share2, Wallet, Building2, Download, Clock, CheckCircle, XCircle } from "@/components/Icon";
import { toast } from "sonner";
import { ClientHeader } from "@/components/ClientHeader";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

function formatRewardLabel(settings: any) {
  if (!settings) return "";
  if (settings.rewardType === "percentage") return `${settings.rewardAmount}% hoa hồng`;
  if (settings.rewardType === "points") return `${settings.rewardAmount} điểm`;
  return formatVND(Number(settings.rewardAmount));
}

export default function ReferralPage() {
  const { customer, token } = useCustomerAuth();
  const email = customer?.email || "";

  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"wallet" | "atm">("wallet");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const { data: settings } = trpc.referral.getSettings.useQuery();
  const { data: myCode, isLoading: loadingCode, refetch: refetchCode } = trpc.referral.getMyCode.useQuery(
    { email },
    { enabled: !!email }
  );
  const { data: stats, isLoading: loadingStats } = trpc.referral.getStats.useQuery(
    { email },
    { enabled: !!email }
  );
  const { data: myWithdrawals, refetch: refetchWithdrawals } = trpc.referralWithdrawals.myList.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const withdrawMutation = trpc.referralWithdrawals.create.useMutation({
    onSuccess: (data: any) => {
      if (data.status === "completed") {
        toast.success("Đã chuyển thưởng vào ví thành công!");
      } else {
        toast.success("Yêu cầu rút thưởng đã được gửi! Admin sẽ xử lý trong 1-3 ngày làm việc.");
      }
      setShowWithdraw(false);
      setWithdrawAmount("");
      setBankName(""); setBankAccount(""); setBankHolder("");
      refetchCode();
      refetchWithdrawals();
    },
    onError: (err: any) => toast.error(err.message),
  });

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

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
    if (amount > referralBalance) { toast.error(`Số dư hoa hồng không đủ. Bạn có ${formatVND(referralBalance)}`); return; }
    if (withdrawType === "atm" && (!bankName || !bankAccount || !bankHolder)) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng"); return;
    }
    withdrawMutation.mutate({
      token: token || "",
      customerName: customer?.name || customer?.email || "",
      amount,
      withdrawType,
      bankName: withdrawType === "atm" ? bankName : undefined,
      bankAccount: withdrawType === "atm" ? bankAccount : undefined,
      bankHolder: withdrawType === "atm" ? bankHolder : undefined,
    });
  };

  const referralBalance = parseFloat((myCode as any)?.totalRewards?.toString() || "0");

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Hoàn thành</span>;
      case "processing": return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><Clock className="w-3 h-3" />Đang xử lý</span>;
      case "rejected": return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Từ chối</span>;
      default: return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Chờ xử lý</span>;
    }
  };

  if (!settings?.isEnabled) {
    return (
      <div className="min-h-screen pt-14 bg-gray-50">
        <ClientHeader />
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
          <Users2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chương trình giới thiệu chưa được kích hoạt</p>
          <p className="text-sm mt-1">Vui lòng quay lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 bg-gray-50">
      <ClientHeader />
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Hero */}
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-2">Giới Thiệu Bạn Bè - Nhận Thưởng</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
              <i className="fa-solid fa-percent text-yellow-300 text-sm" />
              <span className="text-sm font-semibold text-yellow-200">
                Nhận {formatRewardLabel(settings)} mỗi lượt giới thiệu thành công
              </span>
            </div>
            <p className="text-sm opacity-80 max-w-md mx-auto">
              {settings.description || "Chia sẻ mã của bạn với bạn bè và nhận hoa hồng khi họ mua hàng thành công!"}
            </p>
            {settings.minOrderAmount && Number(settings.minOrderAmount) > 0 && (
              <p className="text-xs opacity-60 mt-2">
                Đơn hàng tối thiểu: {formatVND(Number(settings.minOrderAmount))}
              </p>
            )}
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
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-5 text-center">
              <TrendingUp className="h-7 w-7 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
              <p className="text-xs text-gray-500">Lượt giới thiệu</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-5 text-center">
              <Gift className="h-7 w-7 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-bold text-gray-900">
                {settings.rewardType === "points"
                  ? (stats?.totalRewards || "0") + " điểm"
                  : formatVND(Number(stats?.totalRewards || 0))}
              </p>
              <p className="text-xs text-gray-500">Tổng thưởng tích lũy</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-100 ring-2 ring-purple-200">
            <CardContent className="p-5 text-center">
              <Wallet className="h-7 w-7 mx-auto mb-2 text-purple-500" />
              <p className="text-lg font-bold text-purple-700">{formatVND(referralBalance)}</p>
              <p className="text-xs text-gray-500">Số dư hoa hồng</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw section */}
        {email && (
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  Đổi Thưởng
                </CardTitle>
                {!showWithdraw && referralBalance > 0 && (
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowWithdraw(true)}>
                    <Download className="h-4 w-4 mr-1" /> Rút thưởng
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {referralBalance <= 0 && !showWithdraw ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Bạn chưa có hoa hồng để rút. Hãy giới thiệu bạn bè để tích lũy thưởng!
                </p>
              ) : showWithdraw ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setWithdrawType("wallet")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${withdrawType === "wallet" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <Wallet className={`h-6 w-6 ${withdrawType === "wallet" ? "text-purple-600" : "text-gray-400"}`} />
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${withdrawType === "wallet" ? "text-purple-700" : "text-gray-600"}`}>Vào số dư ví</p>
                        <p className="text-xs text-gray-400">Nhận ngay lập tức</p>
                      </div>
                    </button>
                    <button type="button" onClick={() => setWithdrawType("atm")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${withdrawType === "atm" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <Building2 className={`h-6 w-6 ${withdrawType === "atm" ? "text-blue-600" : "text-gray-400"}`} />
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${withdrawType === "atm" ? "text-blue-700" : "text-gray-600"}`}>Chuyển khoản</p>
                        <p className="text-xs text-gray-400">1-3 ngày làm việc</p>
                      </div>
                    </button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Số tiền rút <span className="text-gray-400 font-normal">(Số dư: {formatVND(referralBalance)})</span>
                    </Label>
                    <Input type="number" placeholder="Nhập số tiền..." value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} min={1} max={referralBalance} />
                    <div className="flex gap-2 mt-2">
                      {[50000, 100000, 200000, 500000].map(v => (
                        <button key={v} type="button" onClick={() => setWithdrawAmount(Math.min(v, referralBalance).toString())}
                          className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                          {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}K`}
                        </button>
                      ))}
                      <button type="button" onClick={() => setWithdrawAmount(referralBalance.toString())}
                        className="text-xs px-2.5 py-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors">
                        Tất cả
                      </button>
                    </div>
                  </div>

                  {withdrawType === "atm" && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm font-medium text-blue-800">Thông tin ngân hàng</p>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tên ngân hàng</Label>
                        <Input placeholder="VD: Vietcombank, BIDV, Techcombank..." value={bankName} onChange={e => setBankName(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Số tài khoản</Label>
                        <Input placeholder="Nhập số tài khoản..." value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tên chủ tài khoản</Label>
                        <Input placeholder="Nhập tên chủ tài khoản..." value={bankHolder} onChange={e => setBankHolder(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowWithdraw(false); setWithdrawAmount(""); }}>Huỷ</Button>
                    <Button
                      className={`flex-1 ${withdrawType === "wallet" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
                      onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                      {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                      {withdrawType === "wallet" ? "Chuyển vào ví" : "Gửi yêu cầu"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  Số dư hoa hồng của bạn: <span className="font-bold text-purple-700">{formatVND(referralBalance)}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Withdrawal history */}
        {myWithdrawals && (myWithdrawals as any[]).length > 0 && (
          <Card className="shadow-sm border border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Lịch Sử Rút Thưởng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(myWithdrawals as any[]).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {w.withdrawType === "wallet"
                        ? <Wallet className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        : <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {w.withdrawType === "wallet" ? "Rút vào ví" : `Chuyển khoản ${w.bankName || ""}`}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString("vi-VN")}</p>
                        {w.adminNote && <p className="text-xs text-red-500 mt-0.5">{w.adminNote}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatVND(Number(w.amount))}</p>
                      {statusBadge(w.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral history */}
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
