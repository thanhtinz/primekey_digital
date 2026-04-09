import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { ClientHeader } from "../components/ClientHeader";
import { ClientFooter } from "../components/ClientFooter";
import { CheckCircle, XCircle, Loader2 } from "@/components/Icon";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.customer.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(`Email ${data.email} đã được xác minh thành công!`);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Xác minh thất bại");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      verifyMutation.mutate({ token: t });
    } else {
      setStatus("error");
      setMessage("Không tìm thấy token xác minh");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      <div className="pt-14 pb-16 flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác minh email...</h2>
              <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Xác minh thành công!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate("/client-login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Đăng nhập ngay
              </button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Xác minh thất bại</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition"
              >
                Về trang chủ
              </button>
            </>
          )}
        </div>
      </div>
      <ClientFooter />
    </div>
  );
}
