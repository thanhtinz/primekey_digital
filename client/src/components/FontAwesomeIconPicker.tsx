import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, X } from "@/components/Icon";

// Curated list of FontAwesome icons suitable for e-commerce categories
const FA_ICONS = [
  // Entertainment
  { class: "fa-solid fa-film", label: "Phim" },
  { class: "fa-solid fa-tv", label: "TV" },
  { class: "fa-solid fa-music", label: "Âm nhạc" },
  { class: "fa-solid fa-headphones", label: "Tai nghe" },
  { class: "fa-solid fa-gamepad", label: "Game" },
  { class: "fa-solid fa-dice", label: "Trò chơi" },
  { class: "fa-solid fa-puzzle-piece", label: "Puzzle" },
  { class: "fa-solid fa-masks-theater", label: "Kịch" },
  { class: "fa-solid fa-guitar", label: "Guitar" },
  { class: "fa-solid fa-compact-disc", label: "Đĩa" },
  { class: "fa-solid fa-video", label: "Video" },
  { class: "fa-solid fa-play", label: "Play" },
  { class: "fa-solid fa-podcast", label: "Podcast" },
  { class: "fa-solid fa-photo-film", label: "Media" },
  { class: "fa-solid fa-clapperboard", label: "Phim ảnh" },

  // Software & Tech
  { class: "fa-solid fa-laptop", label: "Laptop" },
  { class: "fa-solid fa-desktop", label: "Desktop" },
  { class: "fa-solid fa-mobile-screen", label: "Mobile" },
  { class: "fa-solid fa-tablet-screen-button", label: "Tablet" },
  { class: "fa-solid fa-code", label: "Code" },
  { class: "fa-solid fa-terminal", label: "Terminal" },
  { class: "fa-solid fa-microchip", label: "Chip" },
  { class: "fa-solid fa-server", label: "Server" },
  { class: "fa-solid fa-database", label: "Database" },
  { class: "fa-solid fa-cloud", label: "Cloud" },
  { class: "fa-solid fa-wifi", label: "Wifi" },
  { class: "fa-solid fa-robot", label: "Robot" },
  { class: "fa-solid fa-bug", label: "Bug" },
  { class: "fa-solid fa-shield-halved", label: "Bảo mật" },
  { class: "fa-solid fa-lock", label: "Khóa" },

  // Education & Work
  { class: "fa-solid fa-graduation-cap", label: "Học tập" },
  { class: "fa-solid fa-book", label: "Sách" },
  { class: "fa-solid fa-book-open", label: "Sách mở" },
  { class: "fa-solid fa-pen", label: "Bút" },
  { class: "fa-solid fa-pencil", label: "Bút chì" },
  { class: "fa-solid fa-chalkboard-user", label: "Giảng dạy" },
  { class: "fa-solid fa-briefcase", label: "Công việc" },
  { class: "fa-solid fa-building", label: "Tòa nhà" },
  { class: "fa-solid fa-chart-line", label: "Biểu đồ" },
  { class: "fa-solid fa-chart-pie", label: "Thống kê" },
  { class: "fa-solid fa-file-lines", label: "Tài liệu" },
  { class: "fa-solid fa-folder", label: "Thư mục" },
  { class: "fa-solid fa-clipboard", label: "Clipboard" },
  { class: "fa-solid fa-calendar", label: "Lịch" },
  { class: "fa-solid fa-clock", label: "Đồng hồ" },

  // Design & Creative
  { class: "fa-solid fa-palette", label: "Thiết kế" },
  { class: "fa-solid fa-paintbrush", label: "Cọ vẽ" },
  { class: "fa-solid fa-pen-nib", label: "Ngòi bút" },
  { class: "fa-solid fa-bezier-curve", label: "Đường cong" },
  { class: "fa-solid fa-camera", label: "Camera" },
  { class: "fa-solid fa-image", label: "Ảnh" },
  { class: "fa-solid fa-icons", label: "Icons" },
  { class: "fa-solid fa-wand-magic-sparkles", label: "Magic" },
  { class: "fa-solid fa-swatchbook", label: "Mẫu" },
  { class: "fa-solid fa-vector-square", label: "Vector" },

  // Shopping & Commerce
  { class: "fa-solid fa-cart-shopping", label: "Giỏ hàng" },
  { class: "fa-solid fa-bag-shopping", label: "Túi mua" },
  { class: "fa-solid fa-store", label: "Cửa hàng" },
  { class: "fa-solid fa-tag", label: "Nhãn" },
  { class: "fa-solid fa-tags", label: "Nhãn nhiều" },
  { class: "fa-solid fa-gift", label: "Quà tặng" },
  { class: "fa-solid fa-box", label: "Hộp" },
  { class: "fa-solid fa-boxes-stacked", label: "Kho" },
  { class: "fa-solid fa-receipt", label: "Hóa đơn" },
  { class: "fa-solid fa-barcode", label: "Barcode" },
  { class: "fa-solid fa-percent", label: "Giảm giá" },
  { class: "fa-solid fa-money-bill", label: "Tiền" },
  { class: "fa-solid fa-credit-card", label: "Thẻ" },
  { class: "fa-solid fa-wallet", label: "Ví" },
  { class: "fa-solid fa-coins", label: "Xu" },

  // Communication
  { class: "fa-solid fa-envelope", label: "Email" },
  { class: "fa-solid fa-phone", label: "Điện thoại" },
  { class: "fa-solid fa-comment", label: "Chat" },
  { class: "fa-solid fa-comments", label: "Hội thoại" },
  { class: "fa-solid fa-bell", label: "Thông báo" },
  { class: "fa-solid fa-share-nodes", label: "Chia sẻ" },
  { class: "fa-solid fa-globe", label: "Web" },
  { class: "fa-solid fa-link", label: "Link" },
  { class: "fa-solid fa-at", label: "Email @" },
  { class: "fa-solid fa-paper-plane", label: "Gửi" },

  // Health & Lifestyle
  { class: "fa-solid fa-heart", label: "Tim" },
  { class: "fa-solid fa-heart-pulse", label: "Sức khỏe" },
  { class: "fa-solid fa-dumbbell", label: "Gym" },
  { class: "fa-solid fa-utensils", label: "Ăn uống" },
  { class: "fa-solid fa-mug-hot", label: "Cà phê" },
  { class: "fa-solid fa-wine-glass", label: "Rượu" },
  { class: "fa-solid fa-apple-whole", label: "Trái cây" },
  { class: "fa-solid fa-spa", label: "Spa" },

  // Travel & Transport
  { class: "fa-solid fa-plane", label: "Máy bay" },
  { class: "fa-solid fa-car", label: "Xe hơi" },
  { class: "fa-solid fa-bicycle", label: "Xe đạp" },
  { class: "fa-solid fa-train", label: "Tàu" },
  { class: "fa-solid fa-ship", label: "Tàu biển" },
  { class: "fa-solid fa-map", label: "Bản đồ" },
  { class: "fa-solid fa-location-dot", label: "Vị trí" },
  { class: "fa-solid fa-compass", label: "La bàn" },
  { class: "fa-solid fa-earth-americas", label: "Thế giới" },
  { class: "fa-solid fa-mountain-sun", label: "Núi" },

  // Misc
  { class: "fa-solid fa-star", label: "Ngôi sao" },
  { class: "fa-solid fa-fire", label: "Lửa" },
  { class: "fa-solid fa-bolt", label: "Sét" },
  { class: "fa-solid fa-crown", label: "Vương miện" },
  { class: "fa-solid fa-gem", label: "Kim cương" },
  { class: "fa-solid fa-trophy", label: "Cúp" },
  { class: "fa-solid fa-medal", label: "Huy chương" },
  { class: "fa-solid fa-award", label: "Giải thưởng" },
  { class: "fa-solid fa-thumbs-up", label: "Thích" },
  { class: "fa-solid fa-check", label: "Đã xong" },
  { class: "fa-solid fa-circle-check", label: "Hoàn thành" },
  { class: "fa-solid fa-gear", label: "Cài đặt" },
  { class: "fa-solid fa-sliders", label: "Tùy chỉnh" },
  { class: "fa-solid fa-wrench", label: "Sửa chữa" },
  { class: "fa-solid fa-screwdriver-wrench", label: "Công cụ" },
  { class: "fa-solid fa-key", label: "Chìa khóa" },
  { class: "fa-solid fa-user", label: "Người dùng" },
  { class: "fa-solid fa-users", label: "Nhóm" },
  { class: "fa-solid fa-house", label: "Nhà" },
  { class: "fa-solid fa-sun", label: "Mặt trời" },
  { class: "fa-solid fa-moon", label: "Mặt trăng" },

  // Brands
  { class: "fa-brands fa-youtube", label: "YouTube" },
  { class: "fa-brands fa-spotify", label: "Spotify" },
  { class: "fa-brands fa-netflix", label: "Netflix" },
  { class: "fa-brands fa-apple", label: "Apple" },
  { class: "fa-brands fa-google", label: "Google" },
  { class: "fa-brands fa-microsoft", label: "Microsoft" },
  { class: "fa-brands fa-amazon", label: "Amazon" },
  { class: "fa-brands fa-facebook", label: "Facebook" },
  { class: "fa-brands fa-instagram", label: "Instagram" },
  { class: "fa-brands fa-tiktok", label: "TikTok" },
  { class: "fa-brands fa-twitter", label: "Twitter" },
  { class: "fa-brands fa-discord", label: "Discord" },
  { class: "fa-brands fa-telegram", label: "Telegram" },
  { class: "fa-brands fa-steam", label: "Steam" },
  { class: "fa-brands fa-playstation", label: "PlayStation" },
  { class: "fa-brands fa-xbox", label: "Xbox" },
  { class: "fa-brands fa-figma", label: "Figma" },
  { class: "fa-brands fa-github", label: "GitHub" },
  { class: "fa-brands fa-docker", label: "Docker" },
  { class: "fa-brands fa-aws", label: "AWS" },
  { class: "fa-brands fa-dropbox", label: "Dropbox" },
  { class: "fa-brands fa-slack", label: "Slack" },
  { class: "fa-brands fa-trello", label: "Trello" },
  { class: "fa-brands fa-wordpress", label: "WordPress" },
  { class: "fa-brands fa-shopify", label: "Shopify" },
  { class: "fa-brands fa-cc-visa", label: "Visa" },
  { class: "fa-brands fa-cc-mastercard", label: "Mastercard" },
];

interface FontAwesomeIconPickerProps {
  value: string;
  onChange: (iconClass: string) => void;
}

export function FontAwesomeIcon({ iconClass, className = "" }: { iconClass: string; className?: string }) {
  if (!iconClass || !iconClass.startsWith("fa-")) {
    return null;
  }
  return <i className={`${iconClass} ${className}`} />;
}

export function isFontAwesomeIcon(value: string): boolean {
  return value?.startsWith("fa-") || false;
}

export default function FontAwesomeIconPicker({ value, onChange }: FontAwesomeIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return FA_ICONS;
    const q = search.toLowerCase();
    return FA_ICONS.filter(
      (icon) =>
        icon.label.toLowerCase().includes(q) ||
        icon.class.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedIcon = FA_ICONS.find((i) => i.class === value);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-10 px-3 flex-1 justify-start"
        >
          {value && isFontAwesomeIcon(value) ? (
            <>
              <i className={`${value} text-lg text-blue-600`} />
              <span className="text-sm text-gray-600 truncate">{selectedIcon?.label || value}</span>
            </>
          ) : value ? (
            <>
              <span className="text-lg">{value}</span>
              <span className="text-sm text-gray-400">Emoji</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Chọn icon...</span>
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="h-10 w-10 p-0 text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn Icon Danh Mục</DialogTitle>
            <DialogDescription>Chọn icon FontAwesome hoặc nhập emoji tùy ý</DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm icon... (VD: game, phim, youtube)"
              className="pl-9"
            />
          </div>

          {/* Custom emoji input */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-gray-500">Hoặc nhập emoji:</span>
            <Input
              value={!isFontAwesomeIcon(value) ? value : ""}
              onChange={(e) => {
                onChange(e.target.value);
                if (e.target.value) setOpen(false);
              }}
              placeholder="VD: 🎬 💻 🎮"
              className="w-32 h-8 text-center text-lg"
              maxLength={4}
            />
          </div>

          {/* Icon grid */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-6 gap-1 p-1">
              {filteredIcons.map((icon) => (
                <button
                  key={icon.class}
                  type="button"
                  onClick={() => {
                    onChange(icon.class);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-blue-50 ${
                    value === icon.class
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                  title={icon.label}
                >
                  <i className={`${icon.class} text-xl ${value === icon.class ? "text-blue-600" : "text-gray-600"}`} />
                  <span className="text-[10px] text-gray-500 truncate w-full text-center">{icon.label}</span>
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Không tìm thấy icon phù hợp
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
