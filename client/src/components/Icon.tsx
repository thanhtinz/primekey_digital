/**
 * Icon component - CSS-based icons using Font Awesome 6
 * Drop-in replacement for lucide-react icons
 * Usage: <Icon name="Home" className="w-5 h-5" />
 */

import React from "react";

// Mapping from lucide-react icon names to Font Awesome 6 CSS classes
const ICON_MAP: Record<string, string> = {
  Activity: "fa-solid fa-chart-line",
  AlertCircle: "fa-solid fa-circle-exclamation",
  AlertTriangle: "fa-solid fa-triangle-exclamation",
  ArrowDownCircle: "fa-solid fa-circle-arrow-down",
  ArrowDownLeft: "fa-solid fa-arrow-down-left",
  ArrowDownRight: "fa-solid fa-arrow-down-right",
  ArrowLeft: "fa-solid fa-arrow-left",
  ArrowRight: "fa-solid fa-arrow-right",
  ArrowUpCircle: "fa-solid fa-circle-arrow-up",
  ArrowUpRight: "fa-solid fa-arrow-up-right",
  Award: "fa-solid fa-award",
  Banknote: "fa-solid fa-money-bill",
  BarChart2: "fa-solid fa-chart-bar",
  BarChart3: "fa-solid fa-chart-column",
  Bell: "fa-solid fa-bell",
  BookOpen: "fa-solid fa-book-open",
  BookUser: "fa-solid fa-address-book",
  Bot: "fa-solid fa-robot",
  Building2: "fa-solid fa-building",
  Calendar: "fa-solid fa-calendar",
  CalendarClock: "fa-solid fa-calendar-clock",
  CalendarDays: "fa-solid fa-calendar-days",
  CalendarIcon: "fa-solid fa-calendar",
  Camera: "fa-solid fa-camera",
  Check: "fa-solid fa-check",
  CheckCircle: "fa-solid fa-circle-check",
  CheckCircle2: "fa-solid fa-circle-check",
  CheckIcon: "fa-solid fa-check",
  ChevronDown: "fa-solid fa-chevron-down",
  ChevronDownIcon: "fa-solid fa-chevron-down",
  ChevronLeft: "fa-solid fa-chevron-left",
  ChevronLeftIcon: "fa-solid fa-chevron-left",
  ChevronRight: "fa-solid fa-chevron-right",
  ChevronRightIcon: "fa-solid fa-chevron-right",
  ChevronUp: "fa-solid fa-chevron-up",
  ChevronUpIcon: "fa-solid fa-chevron-up",
  CircleIcon: "fa-solid fa-circle",
  ClipboardList: "fa-solid fa-clipboard-list",
  Clock: "fa-solid fa-clock",
  Code: "fa-solid fa-code",
  Copy: "fa-solid fa-copy",
  CopyPlus: "fa-solid fa-copy",
  CreditCard: "fa-solid fa-credit-card",
  Crown: "fa-solid fa-crown",
  Database: "fa-solid fa-database",
  DollarSign: "fa-solid fa-dollar-sign",
  Download: "fa-solid fa-download",
  Edit: "fa-solid fa-pen-to-square",
  Edit2: "fa-solid fa-pen",
  ExternalLink: "fa-solid fa-arrow-up-right-from-square",
  Eye: "fa-solid fa-eye",
  EyeOff: "fa-solid fa-eye-slash",
  FileBarChart2: "fa-solid fa-file-chart-column",
  FileSpreadsheet: "fa-solid fa-file-excel",
  FileStack: "fa-solid fa-layer-group",
  FileText: "fa-solid fa-file-lines",
  Files: "fa-solid fa-files",
  Filter: "fa-solid fa-filter",
  Flame: "fa-solid fa-fire",
  FolderOpen: "fa-solid fa-folder-open",
  FolderTree: "fa-solid fa-folder-tree",
  Gamepad2: "fa-solid fa-gamepad",
  Gift: "fa-solid fa-gift",
  Globe: "fa-solid fa-globe",
  Grid3X3: "fa-solid fa-table-cells",
  GripVertical: "fa-solid fa-grip-vertical",
  GripVerticalIcon: "fa-solid fa-grip-vertical",
  Headphones: "fa-solid fa-headphones",
  Heart: "fa-solid fa-heart",
  HelpCircle: "fa-solid fa-circle-question",
  History: "fa-solid fa-clock-rotate-left",
  Home: "fa-solid fa-house",
  Image: "fa-solid fa-image",
  ImageIcon: "fa-solid fa-image",
  ImagePlus: "fa-solid fa-image",
  Info: "fa-solid fa-circle-info",
  Key: "fa-solid fa-key",
  KeyRound: "fa-solid fa-key",
  Layers: "fa-solid fa-layer-group",
  Layout: "fa-solid fa-table-columns",
  LayoutDashboard: "fa-solid fa-gauge",
  LayoutGrid: "fa-solid fa-table-cells-large",
  Link: "fa-solid fa-link",
  Link2: "fa-solid fa-link",
  List: "fa-solid fa-list",
  ListChecks: "fa-solid fa-list-check",
  ListOrdered: "fa-solid fa-list-ol",
  Loader2: "fa-solid fa-spinner",
  Loader2Icon: "fa-solid fa-spinner",
  Lock: "fa-solid fa-lock",
  LogIn: "fa-solid fa-right-to-bracket",
  LogOut: "fa-solid fa-right-from-bracket",
  Mail: "fa-solid fa-envelope",
  MailCheck: "fa-solid fa-envelope-circle-check",
  MapPin: "fa-solid fa-location-dot",
  Medal: "fa-solid fa-medal",
  Megaphone: "fa-solid fa-bullhorn",
  Menu: "fa-solid fa-bars",
  MessageCircle: "fa-solid fa-message",
  MessageSquare: "fa-solid fa-comment",
  Minus: "fa-solid fa-minus",
  MinusIcon: "fa-solid fa-minus",
  Moon: "fa-solid fa-moon",
  MoreHorizontal: "fa-solid fa-ellipsis",
  MoreHorizontalIcon: "fa-solid fa-ellipsis",
  Package: "fa-solid fa-box",
  Palette: "fa-solid fa-palette",
  PanelLeft: "fa-solid fa-table-columns",
  PanelLeftIcon: "fa-solid fa-table-columns",
  PenLine: "fa-solid fa-pen-line",
  Pencil: "fa-solid fa-pencil",
  Percent: "fa-solid fa-percent",
  Phone: "fa-solid fa-phone",
  Plus: "fa-solid fa-plus",
  Printer: "fa-solid fa-print",
  QrCode: "fa-solid fa-qrcode",
  Receipt: "fa-solid fa-receipt",
  RefreshCw: "fa-solid fa-rotate",
  RotateCcw: "fa-solid fa-rotate-left",
  Save: "fa-solid fa-floppy-disk",
  Scale: "fa-solid fa-scale-balanced",
  Search: "fa-solid fa-magnifying-glass",
  SearchCode: "fa-solid fa-magnifying-glass-chart",
  SearchIcon: "fa-solid fa-magnifying-glass",
  Send: "fa-solid fa-paper-plane",
  Settings: "fa-solid fa-gear",
  Settings2: "fa-solid fa-sliders",
  Share2: "fa-solid fa-share-nodes",
  Shield: "fa-solid fa-shield",
  ShieldAlert: "fa-solid fa-shield-exclamation",
  ShieldCheck: "fa-solid fa-shield-check",
  ShieldX: "fa-solid fa-shield-xmark",
  ShoppingBag: "fa-solid fa-bag-shopping",
  ShoppingCart: "fa-solid fa-cart-shopping",
  Sparkles: "fa-solid fa-wand-magic-sparkles",
  Star: "fa-solid fa-star",
  Sun: "fa-solid fa-sun",
  Tag: "fa-solid fa-tag",
  TestTube: "fa-solid fa-flask",
  Ticket: "fa-solid fa-ticket",
  TicketCheck: "fa-solid fa-ticket",
  Timer: "fa-solid fa-stopwatch",
  ToggleLeft: "fa-solid fa-toggle-off",
  Trash: "fa-solid fa-trash",
  Trash2: "fa-solid fa-trash",
  TrendingDown: "fa-solid fa-trending-down",
  TrendingUp: "fa-solid fa-arrow-trend-up",
  Trophy: "fa-solid fa-trophy",
  Truck: "fa-solid fa-truck",
  Upload: "fa-solid fa-upload",
  User: "fa-solid fa-user",
  UserPlus: "fa-solid fa-user-plus",
  Users: "fa-solid fa-users",
  Users2: "fa-solid fa-user-group",
  Wallet: "fa-solid fa-wallet",
  Webhook: "fa-solid fa-webhook",
  Wrench: "fa-solid fa-wrench",
  X: "fa-solid fa-xmark",
  XCircle: "fa-solid fa-circle-xmark",
  XIcon: "fa-solid fa-xmark",
  Zap: "fa-solid fa-bolt",
  ZoomIn: "fa-solid fa-magnifying-glass-plus",
};

export interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  strokeWidth?: number; // ignored, for compatibility
  color?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

/**
 * CSS Icon component using Font Awesome 6
 * Drop-in replacement for lucide-react icons
 */
export function Icon({
  name,
  className = "",
  style,
  size,
  color,
  onClick,
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const faClass = ICON_MAP[name] || "fa-solid fa-question";

  // Convert size to font-size if provided
  const sizeStyle: React.CSSProperties = {};
  if (size) {
    if (typeof size === "number") {
      sizeStyle.fontSize = `${size}px`;
      sizeStyle.width = `${size}px`;
      sizeStyle.height = `${size}px`;
    } else {
      sizeStyle.fontSize = size;
    }
  }
  if (color) {
    sizeStyle.color = color;
  }

  return (
    <i
      className={`${faClass} ${className}`}
      style={{ ...sizeStyle, ...style }}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden !== undefined ? String(ariaHidden) as "true" | "false" : undefined}
    />
  );
}

// Named exports for each icon - drop-in replacement for lucide-react named exports
// Each returns a React component that renders a Font Awesome icon

type LucideProps = {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  onClick?: () => void;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

function makeIcon(name: string) {
  const Comp = (props: LucideProps) => <Icon name={name} {...props} />;
  Comp.displayName = name;
  return Comp;
}

export const Activity = makeIcon("Activity");
export const AlertCircle = makeIcon("AlertCircle");
export const AlertTriangle = makeIcon("AlertTriangle");
export const ArrowDownCircle = makeIcon("ArrowDownCircle");
export const ArrowDownLeft = makeIcon("ArrowDownLeft");
export const ArrowDownRight = makeIcon("ArrowDownRight");
export const ArrowLeft = makeIcon("ArrowLeft");
export const ArrowRight = makeIcon("ArrowRight");
export const ArrowUpCircle = makeIcon("ArrowUpCircle");
export const ArrowUpRight = makeIcon("ArrowUpRight");
export const Award = makeIcon("Award");
export const Banknote = makeIcon("Banknote");
export const BarChart2 = makeIcon("BarChart2");
export const BarChart3 = makeIcon("BarChart3");
export const Bell = makeIcon("Bell");
export const BookOpen = makeIcon("BookOpen");
export const BookUser = makeIcon("BookUser");
export const Bot = makeIcon("Bot");
export const Building2 = makeIcon("Building2");
export const Calendar = makeIcon("Calendar");
export const CalendarClock = makeIcon("CalendarClock");
export const CalendarDays = makeIcon("CalendarDays");
export const CalendarIcon = makeIcon("CalendarIcon");
export const Camera = makeIcon("Camera");
export const Check = makeIcon("Check");
export const CheckCircle = makeIcon("CheckCircle");
export const CheckCircle2 = makeIcon("CheckCircle2");
export const CheckIcon = makeIcon("CheckIcon");
export const ChevronDown = makeIcon("ChevronDown");
export const ChevronDownIcon = makeIcon("ChevronDownIcon");
export const ChevronLeft = makeIcon("ChevronLeft");
export const ChevronLeftIcon = makeIcon("ChevronLeftIcon");
export const ChevronRight = makeIcon("ChevronRight");
export const ChevronRightIcon = makeIcon("ChevronRightIcon");
export const ChevronUp = makeIcon("ChevronUp");
export const ChevronUpIcon = makeIcon("ChevronUpIcon");
export const CircleIcon = makeIcon("CircleIcon");
export const ClipboardList = makeIcon("ClipboardList");
export const Clock = makeIcon("Clock");
export const Code = makeIcon("Code");
export const Copy = makeIcon("Copy");
export const CopyPlus = makeIcon("CopyPlus");
export const CreditCard = makeIcon("CreditCard");
export const Crown = makeIcon("Crown");
export const Database = makeIcon("Database");
export const DollarSign = makeIcon("DollarSign");
export const Download = makeIcon("Download");
export const Edit = makeIcon("Edit");
export const Edit2 = makeIcon("Edit2");
export const ExternalLink = makeIcon("ExternalLink");
export const Eye = makeIcon("Eye");
export const EyeOff = makeIcon("EyeOff");
export const FileBarChart2 = makeIcon("FileBarChart2");
export const FileSpreadsheet = makeIcon("FileSpreadsheet");
export const FileStack = makeIcon("FileStack");
export const FileText = makeIcon("FileText");
export const Files = makeIcon("Files");
export const Filter = makeIcon("Filter");
export const Flame = makeIcon("Flame");
export const FolderOpen = makeIcon("FolderOpen");
export const FolderTree = makeIcon("FolderTree");
export const Gamepad2 = makeIcon("Gamepad2");
export const Gift = makeIcon("Gift");
export const Globe = makeIcon("Globe");
export const Grid3X3 = makeIcon("Grid3X3");
export const GripVertical = makeIcon("GripVertical");
export const GripVerticalIcon = makeIcon("GripVerticalIcon");
export const Headphones = makeIcon("Headphones");
export const Heart = makeIcon("Heart");
export const HelpCircle = makeIcon("HelpCircle");
export const History = makeIcon("History");
export const Home = makeIcon("Home");
export const Image = makeIcon("Image");
export const ImageIcon = makeIcon("ImageIcon");
export const ImagePlus = makeIcon("ImagePlus");
export const Info = makeIcon("Info");
export const Key = makeIcon("Key");
export const KeyRound = makeIcon("KeyRound");
export const Layers = makeIcon("Layers");
export const Layout = makeIcon("Layout");
export const LayoutDashboard = makeIcon("LayoutDashboard");
export const LayoutGrid = makeIcon("LayoutGrid");
export const Link = makeIcon("Link");
export const Link2 = makeIcon("Link2");
export const List = makeIcon("List");
export const ListChecks = makeIcon("ListChecks");
export const ListOrdered = makeIcon("ListOrdered");
export const Loader2 = makeIcon("Loader2");
export const Loader2Icon = makeIcon("Loader2Icon");
export const Lock = makeIcon("Lock");
export const LogIn = makeIcon("LogIn");
export const LogOut = makeIcon("LogOut");
export const Mail = makeIcon("Mail");
export const MailCheck = makeIcon("MailCheck");
export const MapPin = makeIcon("MapPin");
export const Medal = makeIcon("Medal");
export const Megaphone = makeIcon("Megaphone");
export const Menu = makeIcon("Menu");
export const MessageCircle = makeIcon("MessageCircle");
export const MessageSquare = makeIcon("MessageSquare");
export const Minus = makeIcon("Minus");
export const MinusIcon = makeIcon("MinusIcon");
export const Moon = makeIcon("Moon");
export const MoreHorizontal = makeIcon("MoreHorizontal");
export const MoreHorizontalIcon = makeIcon("MoreHorizontalIcon");
export const Package = makeIcon("Package");
export const Palette = makeIcon("Palette");
export const PanelLeft = makeIcon("PanelLeft");
export const PanelLeftIcon = makeIcon("PanelLeftIcon");
export const PenLine = makeIcon("PenLine");
export const Pencil = makeIcon("Pencil");
export const Percent = makeIcon("Percent");
export const Phone = makeIcon("Phone");
export const Plus = makeIcon("Plus");
export const Printer = makeIcon("Printer");
export const QrCode = makeIcon("QrCode");
export const Receipt = makeIcon("Receipt");
export const RefreshCw = makeIcon("RefreshCw");
export const RotateCcw = makeIcon("RotateCcw");
export const Save = makeIcon("Save");
export const Scale = makeIcon("Scale");
export const Search = makeIcon("Search");
export const SearchCode = makeIcon("SearchCode");
export const SearchIcon = makeIcon("SearchIcon");
export const Send = makeIcon("Send");
export const Settings = makeIcon("Settings");
export const Settings2 = makeIcon("Settings2");
export const Share2 = makeIcon("Share2");
export const Shield = makeIcon("Shield");
export const ShieldAlert = makeIcon("ShieldAlert");
export const ShieldCheck = makeIcon("ShieldCheck");
export const ShieldX = makeIcon("ShieldX");
export const ShoppingBag = makeIcon("ShoppingBag");
export const ShoppingCart = makeIcon("ShoppingCart");
export const Sparkles = makeIcon("Sparkles");
export const Star = makeIcon("Star");
export const Sun = makeIcon("Sun");
export const Tag = makeIcon("Tag");
export const TestTube = makeIcon("TestTube");
export const Ticket = makeIcon("Ticket");
export const TicketCheck = makeIcon("TicketCheck");
export const Timer = makeIcon("Timer");
export const ToggleLeft = makeIcon("ToggleLeft");
export const Trash = makeIcon("Trash");
export const Trash2 = makeIcon("Trash2");
export const TrendingDown = makeIcon("TrendingDown");
export const TrendingUp = makeIcon("TrendingUp");
export const Trophy = makeIcon("Trophy");
export const Truck = makeIcon("Truck");
export const Upload = makeIcon("Upload");
export const User = makeIcon("User");
export const UserPlus = makeIcon("UserPlus");
export const Users = makeIcon("Users");
export const Users2 = makeIcon("Users2");
export const Wallet = makeIcon("Wallet");
export const Webhook = makeIcon("Webhook");
export const Wrench = makeIcon("Wrench");
export const X = makeIcon("X");
export const XCircle = makeIcon("XCircle");
export const XIcon = makeIcon("XIcon");
export const Zap = makeIcon("Zap");
export const ZoomIn = makeIcon("ZoomIn");

export default Icon;
