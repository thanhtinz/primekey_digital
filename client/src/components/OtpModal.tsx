import { useState, useRef, useEffect } from "react";
import { Shield, X, Loader2 } from "lucide-react";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  title?: string;
  description?: string;
  isPending?: boolean;
  error?: string | null;
}

export function OtpModal({
  open,
  onClose,
  onVerify,
  title = "Xác minh 2FA",
  description = "Nhập mã 6 số từ ứng dụng xác thực (Google Authenticator, Authy...)",
  isPending = false,
  error = null,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (v && idx === 5) {
      const code = [...next.slice(0, 5), v].join("");
      if (code.length === 6) onVerify(code);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === 6) onVerify(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      onVerify(pasted);
    }
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length === 6) onVerify(code);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isPending}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>

        {/* OTP Input boxes */}
        <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              disabled={isPending}
              className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                ${d ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-900"}
                ${error ? "border-red-400 bg-red-50" : ""}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                disabled:opacity-50`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-500 mb-3">{error}</p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={digits.join("").length < 6 || isPending}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác minh...</>
          ) : (
            <><Shield className="w-4 h-4" /> Xác minh</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Mã có hiệu lực trong 30 giây. Mở ứng dụng xác thực để lấy mã.
        </p>
      </div>
    </div>
  );
}
