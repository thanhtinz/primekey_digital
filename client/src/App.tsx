import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const PayOSSettings = lazy(() => import("./pages/PayOSSettings"));
const PayPalSettings = lazy(() => import("./pages/PayPalSettings"));
const SmtpSettings = lazy(() => import("./pages/SmtpSettings"));
const FeedbacksAdmin = lazy(() => import("./pages/FeedbacksAdmin"));
const EmailTemplateEditor = lazy(() => import("./pages/EmailTemplateEditor"));

// Public pages (no auth required)
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const PublicFeedbacks = lazy(() => import("./pages/PublicFeedbacks"));

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

// Routes that never require auth (always accessible)
const ALWAYS_PUBLIC = ["/track-order", "/feedbacks-public", "/review"];

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
    // After login, navigate to dashboard using hard redirect
    // This triggers a full page reload which re-runs the tRPC auth.me query
    window.location.replace("/dashboard");
  };

  // Always-public routes (track order, review, public feedbacks)
  if (isAlwaysPublic(location)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/track-order" component={() => <TrackOrder />} />
          <Route path="/feedbacks-public" component={() => <PublicFeedbacks />} />
          <Route path="/review/:token" component={() => <ReviewPage />} />
        </Switch>
      </Suspense>
    );
  }

  // Still loading auth state
  if (isLoading) {
    return <PageLoader />;
  }

  // Not authenticated: show landing page or login
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={() => <LandingPage />} />
          <Route path="/login" component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
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
        <Route path="/create-invoice" component={() => <CreateInvoice />} />
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
        <Route path="/settings/email-templates" component={() => isAdmin ? <EmailTemplateEditor /> : <ForbiddenPage />} />
        <Route path="/settings" component={() => isAdmin ? <Settings /> : <ForbiddenPage />} />
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
