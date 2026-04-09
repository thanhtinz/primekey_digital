import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2, ShieldAlert } from "@/components/Icon";
import { trpc } from "@/lib/trpc";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

// Lazy load all pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const InvoiceHistory = lazy(() => import("./pages/InvoiceHistory"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Products = lazy(() => import("./pages/Products"));
const InvoiceTemplates = lazy(() => import("./pages/InvoiceTemplates"));
const EditInvoiceTemplate = lazy(() => import("./pages/EditInvoiceTemplate"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const PayOSSettings = lazy(() => import("./pages/PayOSSettings"));
const PayPalSettings = lazy(() => import("./pages/PayPalSettings"));
const SmtpSettings = lazy(() => import("./pages/SmtpSettings"));
const FeatureSettings = lazy(() => import("./pages/FeatureSettings"));
const FeedbacksAdmin = lazy(() => import("./pages/FeedbacksAdmin"));
const EmailTemplateEditor = lazy(() => import("./pages/EmailTemplateEditor"));

// Staff & Activity
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Reminders = lazy(() => import("./pages/Reminders"));
const EmailCampaigns = lazy(() => import("./pages/EmailCampaigns"));
// New feature pages
const RecurringInvoices = lazy(() => import("./pages/RecurringInvoices"));
const TelegramSettings = lazy(() => import("./pages/TelegramSettings"));
const ImportExcel = lazy(() => import("./pages/ImportExcel"));
const WarrantyLookup = lazy(() => import("./pages/WarrantyLookup"));
const ThankYouCustom = lazy(() => import("./pages/ThankYouCustom"));
const DataBackup = lazy(() => import("./pages/DataBackup"));
const AdvancedSearch = lazy(() => import("./pages/AdvancedSearch"));
const WeeklyReports = lazy(() => import("./pages/WeeklyReports"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget"));

// Batch 4: New pages
const WarrantySettingsPage = lazy(() => import("./pages/WarrantySettingsPage"));
const WarrantyManagement = lazy(() => import("./pages/WarrantyManagement"));
const FlashSaleSettings = lazy(() => import("./pages/FlashSaleSettings"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const FlashSalePage = lazy(() => import("./pages/FlashSalePage"));
const CouponSettings = lazy(() => import("./pages/CouponSettings"));

// Batch 6: New pages
const CategorySettings = lazy(() => import("./pages/CategorySettings"));
const TagSettings = lazy(() => import("./pages/TagSettings"));
const LoyaltySettings = lazy(() => import("./pages/LoyaltySettings"));
const WarrantyRequestManagement = lazy(() => import("./pages/WarrantyRequestManagement"));
const FAQSettings = lazy(() => import("./pages/FAQSettings"));
const FlashSaleSubscriberSettings = lazy(() => import("./pages/FlashSaleSubscriberSettings"));
const VATInvoicePage = lazy(() => import("./pages/VATInvoicePage"));
const TaxReportPage = lazy(() => import("./pages/TaxReportPage"));
const ReferralSettings = lazy(() => import("./pages/ReferralSettings"));
const BannerSettings = lazy(() => import("./pages/BannerSettings"));
const TaxSettings = lazy(() => import("./pages/TaxSettings"));
const ReferralWithdrawalsAdmin = lazy(() => import("./pages/ReferralWithdrawalsAdmin"));
// Batch 6: Public pages
const ProductCatalog = lazy(() => import("./pages/ProductCatalog"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const WarrantyRequestPage = lazy(() => import("./pages/WarrantyRequestPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const AnnouncementManagement = lazy(() => import("./pages/AnnouncementManagement"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));

// Client Portal
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const WalletHistoryPage = lazy(() => import("./pages/WalletHistoryPage"));
const WalletManagement = lazy(() => import("./pages/WalletManagement"));
import { CustomerGuard } from "./components/CustomerGuard";
import { FeatureGuard } from "./components/FeatureGuard";
import { SupportWidget } from "./components/SupportWidget";
const AvatarGalleryAdmin = lazy(() => import("./pages/AvatarGalleryAdmin"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const QueuePage = lazy(() => import("./pages/QueuePage"));
const SpinWheelPage = lazy(() => import("./pages/SpinWheelPage"));
const SpinWheelAdmin = lazy(() => import("./pages/SpinWheelAdmin"));
const LoyaltyRewardsAdmin = lazy(() => import("./pages/LoyaltyRewardsAdmin"));
const LoyaltyRewardsPage = lazy(() => import("./pages/LoyaltyRewardsPage"));
// Public pages (no auth required)
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const CouponStorePage = lazy(() => import("./pages/CouponStorePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const ProductReviewPage = lazy(() => import("./pages/ProductReviewPage"));
const PublicFeedbacks = lazy(() => import("./pages/PublicFeedbacks"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

// Forbidden page for non-admin access
const ForbiddenPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-4">
    <ShieldAlert className="h-16 w-16 text-red-400" />
    <h1 className="text-2xl font-bold">Không Có Quyền Truy Cập</h1>
    <p className="text-muted-foreground">Trang này chỉ dành cho quản trị viên.</p>
    <a href="/dashboard" className="text-blue-500 hover:underline">Quay về Dashboard</a>
  </div>
);

// Routes that never require admin auth (always accessible to public or customers)
const ALWAYS_PUBLIC = ["/", "/track-order", "/payment-cancel", "/order", "/feedbacks-public", "/review", "/product-review", "/thank-you", "/pay", "/warranty", "/leaderboard", "/wishlist", "/flash-sale", "/catalog", "/loyalty", "/warranty-request", "/faq", "/blog", "/client-login", "/my-account", "/product", "/cart", "/referral", "/coupons", "/support", "/wallet", "/wallet-history", "/verify-email", "/reset-password", "/spin-wheel", "/loyalty-rewards"];

function isAlwaysPublic(path: string) {
  return ALWAYS_PUBLIC.some(r => path === r || path.startsWith(r + "/"));
}

function Router() {
  const [location] = useLocation();

  // Use tRPC auth.me query - this uses credentials: "include" automatically
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  const handleLoginSuccess = () => {
    window.location.replace("/dashboard");
  };

  // Always-public routes
  if (isAlwaysPublic(location)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Fully public - no login required */}
          <Route path="/feedbacks-public" component={() => <PublicFeedbacks />} />
          <Route path="/review/:token" component={() => <ReviewPage />} />
          <Route path="/product-review/:token" component={() => <ProductReviewPage />} />
          <Route path="/thank-you" component={() => <ThankYou />} />
          <Route path="/pay/:invoiceId" component={() => <PaymentPage />} />
          <Route path="/warranty" component={() => <WarrantyLookup />} />
          <Route path="/leaderboard" component={() => <FeatureGuard featureKey="leaderboard"><LeaderboardPage /></FeatureGuard>} />
          <Route path="/spin-wheel" component={() => <FeatureGuard featureKey="spin_wheel"><CustomerGuard><SpinWheelPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/loyalty-rewards" component={() => <FeatureGuard featureKey="loyalty"><CustomerGuard><LoyaltyRewardsPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/wishlist" component={() => <FeatureGuard featureKey="wishlist"><CustomerGuard><WishlistPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/flash-sale" component={() => <FeatureGuard featureKey="flash_sale"><FlashSalePage /></FeatureGuard>} />
          <Route path="/catalog" component={() => <ProductCatalog />} />
          <Route path="/faq" component={() => <FeatureGuard featureKey="faq"><FAQPage /></FeatureGuard>} />
          <Route path="/blog" component={() => <FeatureGuard featureKey="blog"><BlogPage /></FeatureGuard>} />
          <Route path="/blog/:slug" component={() => <FeatureGuard featureKey="blog"><BlogPostPage /></FeatureGuard>} />
          <Route path="/client-login" component={() => <ClientLogin />} />
          <Route path="/product/:id" component={() => <ProductDetail />} />
          {/* Customer-only - requires customer login */}
          <Route path="/track-order" component={() => <CustomerGuard><TrackOrder /></CustomerGuard>} />
          <Route path="/payment-cancel" component={() => <CustomerGuard><PaymentCancel /></CustomerGuard>} />
          <Route path="/order/:invoiceNumber" component={() => <CustomerGuard><OrderDetailPage /></CustomerGuard>} />
          <Route path="/loyalty" component={() => <FeatureGuard featureKey="points"><CustomerGuard><LoyaltyPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/warranty-request" component={() => <FeatureGuard featureKey="warranty"><CustomerGuard><WarrantyRequestPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/my-account" component={() => <CustomerGuard><MyAccount /></CustomerGuard>} />
          <Route path="/cart" component={() => <CustomerGuard><CartPage /></CustomerGuard>} />
          <Route path="/referral" component={() => <FeatureGuard featureKey="referral"><CustomerGuard><ReferralPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/wallet" component={() => <FeatureGuard featureKey="wallet"><CustomerGuard><WalletPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/wallet-history" component={() => <FeatureGuard featureKey="wallet"><CustomerGuard><WalletHistoryPage /></CustomerGuard></FeatureGuard>} />
          <Route path="/coupons" component={() => <FeatureGuard featureKey="coupon"><CouponStorePage /></FeatureGuard>} />
          <Route path="/support" component={() => <SupportPage />} />
          <Route path="/verify-email" component={() => <VerifyEmailPage />} />
          <Route path="/reset-password" component={() => <ResetPasswordPage />} />
          <Route path="/" component={() => <LandingPage />} />
        </Switch>
      </Suspense>
    );
  }

  // Still loading auth state
  if (isLoading) {
    return <PageLoader />;
  }

  // Not authenticated: show landing page, client portal, or admin login
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={() => <LandingPage />} />
          <Route path="/login" component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
          {/* Client portal routes accessible without admin auth */}
          <Route path="/client-login" component={() => <ClientLogin />} />
          <Route path="/my-account" component={() => <CustomerGuard><MyAccount /></CustomerGuard>} />
          <Route component={() => <LandingPage />} />
        </Switch>
      </Suspense>
    );
  }

  // Authenticated: if on login or root page, redirect to dashboard
  if (location === "/login" || location === "/") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={() => <Dashboard />} />
        <Route path="/edit-invoice/:id" component={() => <EditInvoice />} />
        <Route path="/invoices/:id" component={() => <InvoiceDetail />} />
        <Route path="/invoices" component={() => <InvoiceHistory />} />
        {/* Admin-only routes */}
        <Route path="/customers/:id" component={() => isAdmin ? <CustomerDetail /> : <ForbiddenPage />} />
        <Route path="/customers" component={() => isAdmin ? <Customers /> : <ForbiddenPage />} />
        <Route path="/products" component={() => isAdmin ? <Products /> : <ForbiddenPage />} />
        <Route path="/templates/:id/edit" component={() => isAdmin ? <EditInvoiceTemplate /> : <ForbiddenPage />} />
        <Route path="/templates" component={() => isAdmin ? <InvoiceTemplates /> : <ForbiddenPage />} />
        <Route path="/reports" component={() => isAdmin ? <Reports /> : <ForbiddenPage />} />
        <Route path="/feedbacks" component={() => isAdmin ? <FeedbacksAdmin /> : <ForbiddenPage />} />
        <Route path="/settings/payos" component={() => isAdmin ? <PayOSSettings /> : <ForbiddenPage />} />
        <Route path="/settings/paypal" component={() => isAdmin ? <PayPalSettings /> : <ForbiddenPage />} />
        <Route path="/settings/smtp" component={() => isAdmin ? <SmtpSettings /> : <ForbiddenPage />} />
        <Route path="/settings/features" component={() => isAdmin ? <FeatureSettings /> : <ForbiddenPage />} />
        <Route path="/settings/email-templates" component={() => isAdmin ? <EmailTemplateEditor /> : <ForbiddenPage />} />
        <Route path="/settings/warranty" component={() => isAdmin ? <WarrantySettingsPage /> : <ForbiddenPage />} />
        <Route path="/settings/flash-sale" component={() => isAdmin ? <FlashSaleSettings /> : <ForbiddenPage />} />
        <Route path="/settings/coupons" component={() => isAdmin ? <CouponSettings /> : <ForbiddenPage />} />
        <Route path="/settings" component={() => isAdmin ? <Settings /> : <ForbiddenPage />} />
        <Route path="/warranties" component={() => isAdmin ? <WarrantyManagement /> : <ForbiddenPage />} />
        <Route path="/staff" component={() => isAdmin ? <StaffManagement /> : <ForbiddenPage />} />
        <Route path="/activity-log" component={() => isAdmin ? <ActivityLog /> : <ForbiddenPage />} />
        <Route path="/reminders" component={() => isAdmin ? <Reminders /> : <ForbiddenPage />} />
        <Route path="/campaigns" component={() => isAdmin ? <EmailCampaigns /> : <ForbiddenPage />} />
        <Route path="/recurring-invoices" component={() => isAdmin ? <RecurringInvoices /> : <ForbiddenPage />} />
        <Route path="/import-excel" component={() => isAdmin ? <ImportExcel /> : <ForbiddenPage />} />
        <Route path="/settings/telegram" component={() => isAdmin ? <TelegramSettings /> : <ForbiddenPage />} />
        <Route path="/settings/thank-you" component={() => isAdmin ? <ThankYouCustom /> : <ForbiddenPage />} />
        <Route path="/backup" component={() => isAdmin ? <DataBackup /> : <ForbiddenPage />} />
        <Route path="/advanced-search" component={() => isAdmin ? <AdvancedSearch /> : <ForbiddenPage />} />
        <Route path="/advanced-reports" component={() => isAdmin ? <WeeklyReports /> : <ForbiddenPage />} />
        <Route path="/embed-widget" component={() => isAdmin ? <EmbedWidget /> : <ForbiddenPage />} />
        {/* Batch 6 routes */}
        <Route path="/settings/categories" component={() => isAdmin ? <CategorySettings /> : <ForbiddenPage />} />
        <Route path="/settings/tags" component={() => isAdmin ? <TagSettings /> : <ForbiddenPage />} />
        <Route path="/settings/loyalty" component={() => isAdmin ? <LoyaltySettings /> : <ForbiddenPage />} />
        <Route path="/settings/faq" component={() => isAdmin ? <FAQSettings /> : <ForbiddenPage />} />
        <Route path="/settings/flash-sale-subscribers" component={() => isAdmin ? <FlashSaleSubscriberSettings /> : <ForbiddenPage />} />
        <Route path="/warranty-requests" component={() => isAdmin ? <WarrantyRequestManagement /> : <ForbiddenPage />} />
        <Route path="/vat-invoices" component={() => isAdmin ? <VATInvoicePage /> : <ForbiddenPage />} />
        <Route path="/tax-report" component={() => isAdmin ? <TaxReportPage /> : <ForbiddenPage />} />
        <Route path="/settings/referral" component={() => isAdmin ? <ReferralSettings /> : <ForbiddenPage />} />
        <Route path="/admin/referral-withdrawals" component={() => isAdmin ? <ReferralWithdrawalsAdmin /> : <ForbiddenPage />} />
        <Route path="/settings/banners" component={() => isAdmin ? <BannerSettings /> : <ForbiddenPage />} />
        <Route path="/settings/tax" component={() => isAdmin ? <TaxSettings /> : <ForbiddenPage />} />
        <Route path="/wallet-management" component={() => isAdmin ? <WalletManagement /> : <ForbiddenPage />} />
        <Route path="/admin/blog" component={() => isAdmin ? <BlogManagement /> : <ForbiddenPage />} />
        {/* Removed duplicate /blog-management route - use /admin/blog instead */}
        <Route path="/admin/announcements" component={() => isAdmin ? <AnnouncementManagement /> : <ForbiddenPage />} />
        {/* Removed duplicate /announcements route - use /admin/announcements instead */}
        <Route path="/admin/notifications" component={() => isAdmin ? <AdminNotifications /> : <ForbiddenPage />} />
        <Route path="/admin/avatar-gallery" component={() => isAdmin ? <AvatarGalleryAdmin /> : <ForbiddenPage />} />
        <Route path="/refunds" component={() => isAdmin ? <RefundPage /> : <ForbiddenPage />} />
        <Route path="/queue" component={() => isAdmin ? <QueuePage /> : <ForbiddenPage />} />
        <Route path="/admin/spin-wheel" component={() => isAdmin ? <SpinWheelAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty-rewards" component={() => isAdmin ? <LoyaltyRewardsAdmin /> : <ForbiddenPage />} />
        <Route path="/"><Redirect to="/dashboard" /></Route>
        <Route component={() => (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <h1 className="text-3xl font-bold mb-4">404 - Không Tìm Thấy</h1>
          </div>
        )} />
      </Switch>
    </Suspense>
  );
}

function GlobalBrandApplier() {
  const { data: publicInfo } = trpc.settings.getPublicInfo.useQuery(undefined, { staleTime: 300_000 });
  useEffect(() => {
    if (publicInfo?.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = publicInfo.faviconUrl;
    }
    if (publicInfo?.companyName) {
      document.title = publicInfo.companyName + " - Hệ Thống Quản Lý Hóa Đơn";
    }
  }, [publicInfo?.faviconUrl, publicInfo?.companyName]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <GlobalBrandApplier />
          <AnnouncementBanner />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
