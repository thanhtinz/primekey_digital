import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Step = 1 | 2 | 3;

interface FormData {
  // Bước 1: Thông tin website
  companyName: string;
  siteTitle: string;
  siteDescription: string;
  companyEmail: string;
  companyPhone: string;
  hotline: string;
  companyAddress: string;
  website: string;
  // Bước 2: Tài khoản admin
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
}

const INITIAL_FORM: FormData = {
  companyName: "",
  siteTitle: "",
  siteDescription: "",
  companyEmail: "",
  companyPhone: "",
  hotline: "",
  companyAddress: "",
  website: "",
  adminName: "",
  adminUsername: "",
  adminEmail: "",
  adminPassword: "",
  adminPasswordConfirm: "",
};

const STEPS = [
  { id: 1, label: "Thông tin website", icon: "fa-globe" },
  { id: 2, label: "Tài khoản admin", icon: "fa-user-shield" },
  { id: 3, label: "Hoàn tất", icon: "fa-circle-check" },
];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [done, setDone] = useState(false);

  const completeMutation = trpc.setup.complete.useMutation({
    onSuccess: () => {
      setDone(true);
      setStep(3);
    },
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra khi cài đặt");
    },
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (!form.companyName.trim()) errs.companyName = "Tên website là bắt buộc";
    if (form.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
      errs.companyEmail = "Email không hợp lệ";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: typeof errors = {};
    if (!form.adminName.trim()) errs.adminName = "Tên admin là bắt buộc";
    if (!form.adminUsername.trim() || form.adminUsername.length < 3) errs.adminUsername = "Tên đăng nhập tối thiểu 3 ký tự";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) errs.adminEmail = "Email không hợp lệ";
    if (form.adminPassword.length < 6) errs.adminPassword = "Mật khẩu tối thiểu 6 ký tự";
    if (form.adminPassword !== form.adminPasswordConfirm) errs.adminPasswordConfirm = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) {
      completeMutation.mutate({
        companyName: form.companyName,
        siteTitle: form.siteTitle || form.companyName,
        siteDescription: form.siteDescription,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone,
        hotline: form.hotline,
        companyAddress: form.companyAddress,
        website: form.website,
        adminName: form.adminName,
        adminUsername: form.adminUsername,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <i className="fa-solid fa-store text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Cài Đặt Hệ Thống</h1>
          <p className="text-slate-400 mt-2">Thiết lập lần đầu — chỉ cần thực hiện một lần</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 ${step >= s.id ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  done && s.id === 3 ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                  step === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" :
                  step > s.id ? "bg-blue-500/50 text-white" : "bg-slate-700 text-slate-400"
                }`}>
                  {done && s.id === 3 ? <i className="fa-solid fa-check text-xs" /> :
                   step > s.id ? <i className="fa-solid fa-check text-xs" /> :
                   <i className={`fa-solid ${s.icon} text-xs`} />}
                </div>
                <span className="text-xs text-slate-400 hidden sm:block">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 transition-all duration-300 ${step > s.id ? "bg-blue-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card top accent */}
          <div className={`h-1 w-full ${step === 3 && done ? "bg-green-500" : "bg-blue-600"}`} />

          <div className="p-8">
            {/* Step 1: Thông tin website */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-globe text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Thông tin website</h2>
                    <p className="text-sm text-gray-500">Nhập thông tin cơ bản của cửa hàng</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyName" className="text-gray-700 font-medium">
                      Tên cửa hàng / website <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={set("companyName")}
                      placeholder="VD: PrimeKey Digital"
                      className={`mt-1 ${errors.companyName ? "border-red-400" : ""}`}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="siteTitle" className="text-gray-700 font-medium">Tiêu đề trang (SEO)</Label>
                    <Input
                      id="siteTitle"
                      value={form.siteTitle}
                      onChange={set("siteTitle")}
                      placeholder="VD: PrimeKey - Mua Key Bản Quyền"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyEmail" className="text-gray-700 font-medium">Email liên hệ</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={form.companyEmail}
                      onChange={set("companyEmail")}
                      placeholder="contact@yourshop.com"
                      className={`mt-1 ${errors.companyEmail ? "border-red-400" : ""}`}
                    />
                    {errors.companyEmail && <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>}
                  </div>

                  <div>
                    <Label htmlFor="companyPhone" className="text-gray-700 font-medium">Số điện thoại</Label>
                    <Input
                      id="companyPhone"
                      value={form.companyPhone}
                      onChange={set("companyPhone")}
                      placeholder="0xxx xxx xxx"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hotline" className="text-gray-700 font-medium">Hotline hỗ trợ</Label>
                    <Input
                      id="hotline"
                      value={form.hotline}
                      onChange={set("hotline")}
                      placeholder="1800 xxxx"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-gray-700 font-medium">Website chính thức</Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={set("website")}
                      placeholder="https://yourshop.com"
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="companyAddress" className="text-gray-700 font-medium">Địa chỉ</Label>
                    <Input
                      id="companyAddress"
                      value={form.companyAddress}
                      onChange={set("companyAddress")}
                      placeholder="Số nhà, đường, quận, thành phố"
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="siteDescription" className="text-gray-700 font-medium">Mô tả ngắn (SEO)</Label>
                    <Textarea
                      id="siteDescription"
                      value={form.siteDescription}
                      onChange={set("siteDescription")}
                      placeholder="Mô tả ngắn về cửa hàng của bạn..."
                      className="mt-1 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Tài khoản admin */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-user-shield text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Tài khoản quản trị</h2>
                    <p className="text-sm text-gray-500">Tạo tài khoản admin để quản lý hệ thống</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="adminName" className="text-gray-700 font-medium">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminName"
                      value={form.adminName}
                      onChange={set("adminName")}
                      placeholder="Nguyễn Văn A"
                      className={`mt-1 ${errors.adminName ? "border-red-400" : ""}`}
                    />
                    {errors.adminName && <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="adminUsername" className="text-gray-700 font-medium">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminUsername"
                      value={form.adminUsername}
                      onChange={set("adminUsername")}
                      placeholder="admin"
                      className={`mt-1 ${errors.adminUsername ? "border-red-400" : ""}`}
                    />
                    {errors.adminUsername && <p className="text-red-500 text-xs mt-1">{errors.adminUsername}</p>}
                    <p className="text-xs text-gray-400 mt-1">Dùng để đăng nhập vào hệ thống</p>
                  </div>

                  <div>
                    <Label htmlFor="adminEmail" className="text-gray-700 font-medium">
                      Email admin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={form.adminEmail}
                      onChange={set("adminEmail")}
                      placeholder="admin@yourshop.com"
                      className={`mt-1 ${errors.adminEmail ? "border-red-400" : ""}`}
                    />
                    {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
                  </div>

                  <div>
                    <Label htmlFor="adminPassword" className="text-gray-700 font-medium">
                      Mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={form.adminPassword}
                      onChange={set("adminPassword")}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`mt-1 ${errors.adminPassword ? "border-red-400" : ""}`}
                    />
                    {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
                  </div>

                  <div>
                    <Label htmlFor="adminPasswordConfirm" className="text-gray-700 font-medium">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminPasswordConfirm"
                      type="password"
                      value={form.adminPasswordConfirm}
                      onChange={set("adminPasswordConfirm")}
                      placeholder="Nhập lại mật khẩu"
                      className={`mt-1 ${errors.adminPasswordConfirm ? "border-red-400" : ""}`}
                    />
                    {errors.adminPasswordConfirm && <p className="text-red-500 text-xs mt-1">{errors.adminPasswordConfirm}</p>}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0" />
                    <span>Hãy lưu lại thông tin đăng nhập này. Đây là tài khoản quản trị duy nhất được tạo trong quá trình cài đặt.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Hoàn tất */}
            {step === 3 && done && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-circle-check text-green-500 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt hoàn tất!</h2>
                <p className="text-gray-500 mb-2">Hệ thống đã sẵn sàng. Bạn có thể đăng nhập ngay bây giờ.</p>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left max-w-sm mx-auto">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    <i className="fa-solid fa-key mr-2" />Thông tin đăng nhập
                  </p>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p><span className="font-medium">Email:</span> {form.adminEmail}</p>
                    <p><span className="font-medium">Mật khẩu:</span> ••••••••</p>
                  </div>
                </div>

                <Button
                  className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/30"
                  onClick={onComplete}
                >
                  <i className="fa-solid fa-right-to-bracket mr-2" />
                  Đăng nhập ngay
                </Button>
              </div>
            )}

            {/* Navigation buttons */}
            {step !== 3 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-0"
                >
                  <i className="fa-solid fa-arrow-left mr-2" />
                  Quay lại
                </Button>

                <div className="flex items-center gap-2">
                  {STEPS.slice(0, 2).map(s => (
                    <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${step === s.id ? "bg-blue-600 w-6" : step > s.id ? "bg-blue-400" : "bg-gray-200"}`} />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={completeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-semibold shadow-lg shadow-blue-600/20"
                >
                  {completeMutation.isPending ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : step === 2 ? (
                    <>
                      <i className="fa-solid fa-check mr-2" />
                      Hoàn tất cài đặt
                    </>
                  ) : (
                    <>
                      Tiếp theo
                      <i className="fa-solid fa-arrow-right ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          <i className="fa-solid fa-lock mr-1" />
          Thông tin được lưu trữ an toàn trong cơ sở dữ liệu của bạn
        </p>
      </div>
    </div>
  );
}
