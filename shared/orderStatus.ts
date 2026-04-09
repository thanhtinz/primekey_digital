/**
 * Shared order status constants used across client and server.
 * Single source of truth for status labels, colors, and step ordering.
 */

export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "SHIPPING"
  | "COMPLETED"
  | "WARRANTY"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED"
  | "EXPIRED";

export const ORDER_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    labelShort: string;
    color: string;         // text + bg + border (Tailwind classes)
    textColor: string;     // text only
    bgColor: string;       // bg only
    borderColor: string;   // border only
    badgeClass: string;    // combined badge classes
    step: number;          // 0 = terminal, 1-5 = progress
  }
> = {
  CREATED: {
    label: "Chờ xác nhận",
    labelShort: "Chờ xác nhận",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    step: 1,
  },
  PAID: {
    label: "Đang xử lý",
    labelShort: "Đang xử lý",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    step: 2,
  },
  SHIPPING: {
    label: "Đang giao hàng",
    labelShort: "Đang giao",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    step: 3,
  },
  COMPLETED: {
    label: "Hoàn thành",
    labelShort: "Hoàn thành",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    step: 4,
  },
  WARRANTY: {
    label: "Bảo hành",
    labelShort: "Bảo hành",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    badgeClass: "bg-purple-100 text-purple-700 border border-purple-200",
    step: 5,
  },
  FAILED: {
    label: "Thất bại",
    labelShort: "Thất bại",
    color: "text-red-600 bg-red-50 border-red-200",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    badgeClass: "bg-red-100 text-red-600 border border-red-200",
    step: 0,
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    labelShort: "Hoàn tiền",
    color: "text-teal-700 bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    badgeClass: "bg-teal-100 text-teal-700 border border-teal-200",
    step: 0,
  },
  CANCELLED: {
    label: "Đã hủy",
    labelShort: "Đã hủy",
    color: "text-slate-600 bg-slate-100 border-slate-200",
    textColor: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    step: 0,
  },
  EXPIRED: {
    label: "Hết hạn",
    labelShort: "Hết hạn",
    color: "text-gray-500 bg-gray-100 border-gray-200",
    textColor: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    badgeClass: "bg-gray-100 text-gray-500 border border-gray-200",
    step: 0,
  },
};

/** Danh sách các bước tiến trình chính (không bao gồm trạng thái terminal) */
export const ORDER_PROGRESS_STEPS = [
  { key: "CREATED",   label: "Tạo đơn" },
  { key: "PAID",      label: "Đang xử lý" },
  { key: "SHIPPING",  label: "Đang giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

/** Tất cả trạng thái hợp lệ cho invoice enum */
export const ALL_ORDER_STATUSES = [
  "CREATED", "PAID", "SHIPPING", "COMPLETED", "WARRANTY",
  "FAILED", "REFUNDED", "CANCELLED", "EXPIRED",
] as const;

/** Trạng thái cho phép chuyển tiếp (không phải terminal) */
export const ACTIVE_ORDER_STATUSES = ["CREATED", "PAID", "SHIPPING"] as const;

/** Nhãn rút gọn dùng trong server-side (email, notification) */
export const ORDER_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => [k, v.label])
);
