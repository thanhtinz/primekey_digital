import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2, ShieldAlert } from "lucide-react";

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

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/track-order", "/feedbacks", "/review", "/login"];
// Admin-only routes
const ADMIN_ROUTES = [
  "/customers", "/products", "/templates", "/reports",
  "/settings", "/feedbacks-admin"
];

function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + "/"));
}

function isAdminRoute(path: string) {
  return ADMIN_ROUTES.some(r => path === r || path.startsWith(r + "/"));
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const user = await response.json();
        setIsAuthenticated(true);
        setUserRole(user?.role || "user");
        return user;
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        return null;
      }
    } catch {
      setIsAuthenticated(false);
      setUserRole(null);
      return null;
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const handleLoginSuccess = async () => {
    const user = await fetchUser();
    // Navigate to dashboard after successful login
    setLocation("/dashboard");
  };

  // Always render public routes without auth check
  // But if user is already authenticated and tries to access /login, redirect to dashboard
  if (isPublicRoute(location)) {
    if (location === "/login" && isAuthenticated === true) {
      return <Redirect to="/dashboard" />;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/track-order" component={() => <TrackOrder />} />
          <Route path="/feedbacks" component={() => <PublicFeedbacks />} />
          <Route path="/review/:token" component={() => <ReviewPage />} />
          <Route path="/login" component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
        </Switch>
      </Suspense>
    );
  }

  if (isAuthenticated === null) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={() => <LandingPage />} />
          <Route component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
        </Switch>
      </Suspense>
    );
  }

  // Admin route guard: non-admin users get Forbidden page
  if (isAdminRoute(location) && userRole !== "admin") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ForbiddenPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={() => <Dashboard />} />
        <Route path="/create-invoice" component={() => <CreateInvoice />} />
        <Route path="/invoices/:id" component={() => <InvoiceDetail />} />
        <Route path="/invoices" component={() => <InvoiceHistory />} />
        {/* Admin-only routes */}
        <Route path="/customers/:id" component={() => userRole === "admin" ? <CustomerDetail /> : <ForbiddenPage />} />
        <Route path="/customers" component={() => userRole === "admin" ? <Customers /> : <ForbiddenPage />} />
        <Route path="/products" component={() => userRole === "admin" ? <Products /> : <ForbiddenPage />} />
        <Route path="/templates/:id/edit" component={() => userRole === "admin" ? <EditInvoiceTemplate /> : <ForbiddenPage />} />
        <Route path="/templates" component={() => userRole === "admin" ? <InvoiceTemplates /> : <ForbiddenPage />} />
        <Route path="/reports" component={() => userRole === "admin" ? <Reports /> : <ForbiddenPage />} />
        <Route path="/feedbacks" component={() => userRole === "admin" ? <FeedbacksAdmin /> : <ForbiddenPage />} />
        <Route path="/settings/payos" component={() => userRole === "admin" ? <PayOSSettings /> : <ForbiddenPage />} />
        <Route path="/settings/paypal" component={() => userRole === "admin" ? <PayPalSettings /> : <ForbiddenPage />} />
        <Route path="/settings/smtp" component={() => userRole === "admin" ? <SmtpSettings /> : <ForbiddenPage />} />
        <Route path="/settings" component={() => userRole === "admin" ? <Settings /> : <ForbiddenPage />} />
        <Route path="/"><Redirect to="/dashboard" /></Route>
        <Route component={() => <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground"><h1 className="text-3xl font-bold mb-4">404 - Không Tìm Thấy</h1></div>} />
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
