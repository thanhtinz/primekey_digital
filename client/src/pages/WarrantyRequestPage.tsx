import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { Shield, CheckCircle2, AlertCircle, Upload, Phone, Mail, ArrowLeft } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function WarrantyRequestPage() {
  const { customer, isLoggedIn } = useCustomerAuth();
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery();
  const { data: warrantySettings } = trpc.warranty.getSettings.useQuery();

  const submitMutation = trpc.warrantyRequest.create.useMutation({
    onSuccess: () => { setSubmitted(true); },
    onError: (e) => toast.error(e.message || "Gửi yêu cầu thất bại"),
  });

  const [form, setForm] = useState({
    invoiceCode: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    description: "",
    productName: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Tự điền email và tên từ session khi đã đăng nhập
  useEffect(() => {
    if (isLoggedIn && customer?.email) {
      setForm(f => ({
        ...f,
        customerEmail: f.customerEmail || customer.email,
        customerName: f.customerName || customer.name || "",
      }));
    }
  }, [isLoggedIn, customer?.email, customer?.name]);

  const logo = publicInfo?.logoUrl;
  const siteName = publicInfo?.companyName || "Invoice Prime";

  function handleSubmit() {
    if (!form.customerEmail || !form.description) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    submitMutation.mutate(form);
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100/50 to-emerald-100/50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Yêu Cầu Đã Được Gửi!</h1>
          <p className="text-slate-500 mb-2">Chúng tôi đã nhận được yêu cầu bảo hành của bạn.</p>
          <p className="text-slate-500 mb-6">Đội ngũ hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
          {warrantySettings?.contactInfo && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-slate-500 text-sm mb-2">Liên hệ trực tiếp:</p>
              <p className="text-slate-800 text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600" /> {warrantySettings.contactInfo}</p>
            </div>
          )}
          <Link href="/">
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" /> Về Trang Chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
      <ClientHeader />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Yêu Cầu Bảo Hành</h1>
          <p className="text-slate-500">Điền thông tin để gửi yêu cầu bảo hành sản phẩm</p>
        </div>

        {/* Warranty info */}
        {warrantySettings?.termsAndConditions && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-500 text-sm font-medium mb-1">Điều khoản bảo hành</p>
                <p className="text-slate-500 text-sm">{warrantySettings.termsAndConditions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-600 text-sm">Mã hóa đơn</Label>
              <Input value={form.invoiceCode} onChange={e => setForm(f => ({ ...f, invoiceCode: e.target.value }))} placeholder="INV-20260407-XXXXXX" className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400" />
            </div>
            <div>
              <Label className="text-slate-600 text-sm">Tên sản phẩm</Label>
              <Input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Tên sản phẩm cần bảo hành" className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400" />
            </div>
          </div>

          <div>
            <Label className="text-slate-600 text-sm">Họ và tên *</Label>
            <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nguyễn Văn A" className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-600 text-sm">Email *</Label>
              <Input type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@example.com" className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400" />
            </div>
            <div>
              <Label className="text-slate-600 text-sm">Số điện thoại</Label>
              <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="0901234567" className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400" />
            </div>
          </div>

          <div>
            <Label className="text-slate-600 text-sm">Mô tả vấn đề *</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm..."
              className="mt-1 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 resize-none"
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 gap-2"
          >
            <Shield className="w-4 h-4" />
            {submitMutation.isPending ? "Đang gửi..." : "Gửi Yêu Cầu Bảo Hành"}
          </Button>
        </div>

        {/* Contact */}
        {warrantySettings?.contactInfo && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-3">Hoặc liên hệ trực tiếp:</p>
            <div className="flex flex-wrap gap-4">
              <p className="text-blue-600 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4" /> {warrantySettings.contactInfo}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
