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
const ProductConfig = lazy(() => import("./pages/ProductConfig"));
const ProductEdit = lazy(() => import("./pages/ProductEdit"));
const ProductPackages = lazy(() => import("./pages/ProductPackages"));
const ProductFields = lazy(() => import("./pages/ProductFields"));
const InvoiceTemplates = lazy(() => import("./pages/InvoiceTemplates"));
const EditInvoiceTemplate = lazy(() => import("./pages/EditInvoiceTemplate"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const PayOSSettings = lazy(() => import("./pages/PayOSSettings"));
const SmtpSettings = lazy(() => import("./pages/SmtpSettings"));
const FeatureSettings = lazy(() => import("./pages/FeatureSettings"));
const FeedbacksAdmin = lazy(() => import("./pages/FeedbacksAdmin"));
const EmailTemplateEditor = lazy(() => import("./pages/EmailTemplateEditor"));

// Staff & Activity
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const TopupHistory = lazy(() => import("./pages/TopupHistory"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
// New feature pages
const TelegramSettings = lazy(() => import("./pages/TelegramSettings"));
const WarrantyLookup = lazy(() => import("./pages/WarrantyLookup"));
const ThankYouCustom = lazy(() => import("./pages/ThankYouCustom"));
const Custom404Admin = lazy(() => import("./pages/Custom404Admin"));
const ContactWidget = lazy(() => import("./pages/ContactWidget"));
const Automations = lazy(() => import("./pages/Automations"));
const BlockIpAdmin = lazy(() => import("./pages/BlockIpAdmin"));
const MailCampaigns = lazy(() => import("./pages/MailCampaigns"));

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
const ReferralSettings = lazy(() => import("./pages/ReferralSettings"));
const BannerSettings = lazy(() => import("./pages/BannerSettings"));
const NotificationsAdmin = lazy(() => import("./pages/NotificationsAdmin"));
const BannerManagement = lazy(() => import("./pages/BannerManagement"));
const TaxSettings = lazy(() => import("./pages/TaxSettings"));
const ReferralWithdrawalsAdmin = lazy(() => import("./pages/ReferralWithdrawalsAdmin"));
// Batch 6: Public pages
const ProductCatalog = lazy(() => import("./pages/ProductCatalog"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const WarrantyRequestPage = lazy(() => import("./pages/WarrantyRequestPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AnnouncementManagement = lazy(() => import("./pages/AnnouncementManagement"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));

// Client Portal
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const Client404Page = lazy(() => import("./pages/Client404Page"));
const SetupWizard = lazy(() => import("./pages/SetupWizard"));
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
import AffiliateConfig from "@/pages/AffiliateConfig";
import AffiliateCommissions from "@/pages/AffiliateCommissions";
import AffiliateWithdrawals from "@/pages/AffiliateWithdrawals";
import LoyaltyConfig from "@/pages/LoyaltyConfig";
import LoyaltyHistory from "@/pages/LoyaltyHistory";
import LoyaltyRewards from "@/pages/LoyaltyRewards";
import BlogCategories from "@/pages/BlogCategories";
import BlogNewPost from "@/pages/BlogNewPost";
import BlogPosts from "@/pages/BlogPosts";
import ImageLibrary from "@/pages/ImageLibrary";
const AvatarGalleryAdmin = lazy(() => import("./pages/AvatarGalleryAdmin"));
const BroadcastsAdmin = lazy(() => import("./pages/BroadcastsAdmin"));
const LicenseSetup = lazy(() => import("./pages/LicenseSetup"));
const LicenseAdmin = lazy(() => import("./pages/LicenseAdmin"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const RedisConsole = lazy(() => import("./pages/RedisConsole"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const Extensions = lazy(() => import("./pages/Extensions"));
const TicketAdmin = lazy(() => import("./pages/TicketAdmin"));
const PageBuilder = lazy(() => import("./pages/PageBuilder"));
const MenuManager = lazy(() => import("./pages/MenuManager"));
const InventoryManagement = lazy(() => import("./pages/InventoryManagement"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const SpinWheelPage = lazy(() => import("./pages/SpinWheelPage"));
const SpinWheelAdmin = lazy(() => import("./pages/SpinWheelAdmin"));
const LoyaltyRewardsAdmin = lazy(() => import("./pages/LoyaltyRewardsAdmin"));
const LoyaltyRewardsPage = lazy(() => import("./pages/LoyaltyRewardsPage"));
// Merged admin pages
const WarrantyAdmin = lazy(() => import("./pages/WarrantyAdmin"));
const ReferralAdmin = lazy(() => import("./pages/ReferralAdmin"));
const LoyaltyAdmin = lazy(() => import("./pages/LoyaltyAdmin"));
const FlashSaleAdmin = lazy(() => import("./pages/FlashSaleAdmin"));
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
  // License gate check
  const { data: licenseStatus } = trpc.license.getStatus.useQuery(undefined, {
    staleTime: 300_000, // Cache 5 minutes
    retry: false,
  });
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const handleLoginSuccess = () => {
    window.location.replace("/dashboard");
  };
  // License gate: if license not activated and user is admin, redirect to setup
  // Only block admin routes, not public routes
  if (
    licenseStatus !== undefined &&
    !licenseStatus.activated &&
    !isAlwaysPublic(location) &&
    location !== "/license-setup" &&
    location !== "/login" &&
    location !== "/register" &&
    location !== "/verify-email" &&
    location !== "/reset-password"
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LicenseSetup onActivated={() => window.location.reload()} />
      </Suspense>
    );
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
          <Route component={() => <Client404Page />} />
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
        <Route path="/products/:id/config" component={() => isAdmin ? <ProductConfig /> : <ForbiddenPage />} />
        <Route path="/products/:id/edit" component={() => isAdmin ? <ProductEdit /> : <ForbiddenPage />} />
        <Route path="/products/:id/packages" component={() => isAdmin ? <ProductPackages /> : <ForbiddenPage />} />
        <Route path="/products/:id/fields" component={() => isAdmin ? <ProductFields /> : <ForbiddenPage />} />
        <Route path="/templates/:id/edit" component={() => isAdmin ? <EditInvoiceTemplate /> : <ForbiddenPage />} />
        <Route path="/templates" component={() => isAdmin ? <InvoiceTemplates /> : <ForbiddenPage />} />
        <Route path="/reports" component={() => isAdmin ? <Reports /> : <ForbiddenPage />} />
        <Route path="/feedbacks" component={() => isAdmin ? <FeedbacksAdmin /> : <ForbiddenPage />} />
        <Route path="/settings/payos" component={() => isAdmin ? <PayOSSettings /> : <ForbiddenPage />} />
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

        <Route path="/settings/telegram" component={() => isAdmin ? <TelegramSettings /> : <ForbiddenPage />} />
        <Route path="/settings/thank-you" component={() => isAdmin ? <ThankYouCustom /> : <ForbiddenPage />} />
        <Route path="/settings/custom-404" component={() => isAdmin ? <Custom404Admin /> : <ForbiddenPage />} />

        <Route path="/contact-settings" component={() => isAdmin ? <ContactWidget /> : <ForbiddenPage />} />
        {/* Batch 6 routes */}
        <Route path="/settings/categories" component={() => isAdmin ? <CategorySettings /> : <ForbiddenPage />} />
        <Route path="/settings/tags" component={() => isAdmin ? <TagSettings /> : <ForbiddenPage />} />
        <Route path="/admin/automations" component={() => isAdmin ? <Automations /> : <ForbiddenPage />} />
        <Route path="/admin/block-ip" component={() => isAdmin ? <BlockIpAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/mail-campaigns" component={() => isAdmin ? <MailCampaigns /> : <ForbiddenPage />} />
        <Route path="/settings/loyalty" component={() => isAdmin ? <LoyaltySettings /> : <ForbiddenPage />} />
        <Route path="/settings/faq" component={() => isAdmin ? <FAQSettings /> : <ForbiddenPage />} />
        <Route path="/settings/flash-sale-subscribers" component={() => isAdmin ? <FlashSaleSubscriberSettings /> : <ForbiddenPage />} />
        <Route path="/warranty-requests" component={() => isAdmin ? <WarrantyRequestManagement /> : <ForbiddenPage />} />
        <Route path="/vat-invoices" component={() => isAdmin ? <VATInvoicePage /> : <ForbiddenPage />} />

        <Route path="/settings/referral" component={() => isAdmin ? <ReferralSettings /> : <ForbiddenPage />} />
        <Route path="/admin/referral-withdrawals" component={() => isAdmin ? <ReferralWithdrawalsAdmin /> : <ForbiddenPage />} />
        <Route path="/settings/banners" component={() => isAdmin ? <BannerSettings /> : <ForbiddenPage />} />
        <Route path="/settings/tax" component={() => isAdmin ? <TaxSettings /> : <ForbiddenPage />} />
        <Route path="/wallet-management" component={() => isAdmin ? <WalletManagement /> : <ForbiddenPage />} />
        <Route path="/admin/blog" component={() => isAdmin ? <BlogPosts /> : <ForbiddenPage />} />
               {/* Trang mới: gộp 3 loại thông báo */}
        <Route path="/admin/notifications" component={() => isAdmin ? <NotificationsAdmin /> : <ForbiddenPage />} />
        {/* Trang mới: gộp 3 loại banner */}
        <Route path="/admin/banners" component={() => isAdmin ? <BannerManagement /> : <ForbiddenPage />} />
        {/* Legacy routes - redirect sang trang mới */}
        <Route path="/admin/announcements" component={() => isAdmin ? <NotificationsAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/broadcasts" component={() => isAdmin ? <NotificationsAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/license" component={() => isAdmin ? <LicenseAdmin /> : <ForbiddenPage />} />
        <Route path="/license-setup" component={() => <LicenseSetup onActivated={() => window.location.reload()} />} />
        <Route path="/refunds" component={() => isAdmin ? <RefundPage /> : <ForbiddenPage />} />

        <Route path="/admin/spin-wheel" component={() => isAdmin ? <SpinWheelAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty-rewards" component={() => isAdmin ? <LoyaltyRewardsAdmin /> : <ForbiddenPage />} />
        {/* Merged admin pages */}
        <Route path="/admin/warranty" component={() => isAdmin ? <WarrantyAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/referral" component={() => isAdmin ? <ReferralAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty" component={() => isAdmin ? <LoyaltyAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/flash-sale" component={() => isAdmin ? <FlashSaleAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/affiliate/config" component={() => isAdmin ? <AffiliateConfig /> : <ForbiddenPage />} />
        <Route path="/admin/affiliate/commissions" component={() => isAdmin ? <AffiliateCommissions /> : <ForbiddenPage />} />
        <Route path="/admin/affiliate/withdrawals" component={() => isAdmin ? <AffiliateWithdrawals /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty/config" component={() => isAdmin ? <LoyaltyConfig /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty/history" component={() => isAdmin ? <LoyaltyHistory /> : <ForbiddenPage />} />
        <Route path="/admin/loyalty/rewards" component={() => isAdmin ? <LoyaltyRewards /> : <ForbiddenPage />} />
        <Route path="/admin/blog/posts" component={() => isAdmin ? <BlogPosts /> : <ForbiddenPage />} />
        <Route path="/admin/blog/new" component={() => isAdmin ? <BlogNewPost /> : <ForbiddenPage />} />
        <Route path="/admin/blog/edit/:id" component={() => isAdmin ? <BlogNewPost /> : <ForbiddenPage />} />
        <Route path="/admin/blog/categories" component={() => isAdmin ? <BlogCategories /> : <ForbiddenPage />} />
        <Route path="/admin/image-library" component={() => isAdmin ? <ImageLibrary /> : <ForbiddenPage />} />
        <Route path="/admin/topup-history" component={() => isAdmin ? <TopupHistory /> : <ForbiddenPage />} />
        {/* BlogHub legacy route removed - use /admin/blog instead */}
        <Route path="/admin/system-status" component={() => isAdmin ? <SystemStatus /> : <ForbiddenPage />} />
        <Route path="/admin/redis" component={() => isAdmin ? <RedisConsole /> : <ForbiddenPage />} />
        <Route path="/admin/console" component={() => isAdmin ? <AdminConsole /> : <ForbiddenPage />} />
        <Route path="/admin/extensions" component={() => isAdmin ? <Extensions /> : <ForbiddenPage />} />
        <Route path="/admin/tickets" component={() => isAdmin ? <TicketAdmin /> : <ForbiddenPage />} />
        <Route path="/admin/page-builder" component={() => isAdmin ? <PageBuilder /> : <ForbiddenPage />} />
        <Route path="/admin/menu-manager" component={() => isAdmin ? <MenuManager /> : <ForbiddenPage />} />
        <Route path="/admin/inventory" component={() => isAdmin ? <InventoryManagement /> : <ForbiddenPage />} />
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
      document.title = publicInfo.companyName;
    }
    // Apply brand colors as CSS variables
    const root = document.documentElement;
    if ((publicInfo as any)?.themeColor) {
      root.style.setProperty("--brand-primary", (publicInfo as any).themeColor);
    }
    if ((publicInfo as any)?.themeColor1) {
      root.style.setProperty("--brand-secondary", (publicInfo as any).themeColor1);
    }
    // Apply font family
    if ((publicInfo as any)?.fontFamily) {
      root.style.setProperty("--font-brand", (publicInfo as any).fontFamily);
      document.body.style.fontFamily = `'${(publicInfo as any).fontFamily}', sans-serif`;
    }
  }, [publicInfo]);
  return null;
}

function SetupGate({ children }: { children: React.ReactNode }) {
  const { data: setupStatus, isLoading } = trpc.setup.check.useQuery(undefined, {
    staleTime: Infinity, // Cache vĩnh viễn - chỉ cần check 1 lần
    retry: false,
  });

  if (isLoading) return <PageLoader />;

  if (setupStatus?.setupRequired) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SetupWizard onComplete={() => window.location.replace("/client-login")} />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <SetupGate>
            <GlobalBrandApplier />
            <AnnouncementBanner />
            <Router />
          </SetupGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
