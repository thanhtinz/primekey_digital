import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const Login = lazy(() => import("./pages/Login"));
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

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

// Placeholder pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
    <h1 className="text-3xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground">Trang này không tồn tại.</p>
  </div>
);

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={() => <Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route component={() => <Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        </Switch>
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
        <Route path="/customers/:id" component={() => <CustomerDetail />} />
        <Route path="/customers" component={() => <Customers />} />
        <Route path="/products" component={() => <Products />} />
        <Route path="/templates/:id/edit" component={() => <EditInvoiceTemplate />} />
        <Route path="/templates" component={() => <InvoiceTemplates />} />
        <Route path="/reports" component={() => <Reports />} />
        <Route path="/settings/payos" component={() => <PayOSSettings />} />
        <Route path="/settings/paypal" component={() => <PayPalSettings />} />
        <Route path="/settings" component={() => <Settings />} />
        <Route path="/"><Redirect to="/dashboard" /></Route>
        <Route component={() => <PlaceholderPage title="404 - Không Tìm Thấy" />} />
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
