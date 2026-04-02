import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceHistory from "./pages/InvoiceHistory";
// import Customers from "./pages/Customers";
// import Products from "./pages/Products";
// import InvoiceTemplates from "./pages/InvoiceTemplates";
// import InvoiceTemplatePreview from "./pages/InvoiceTemplatePreview";
// import EditInvoiceTemplate from "./pages/EditInvoiceTemplate";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PayOSSettings from "./pages/PayOSSettings";
import PayPalSettings from "./pages/PayPalSettings";
import DashboardLayout from "./components/DashboardLayoutCustom";

// Placeholder pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <DashboardLayout>
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600">Trang này đang được phát triển...</p>
    </div>
  </DashboardLayout>
);

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is logged in by trying to fetch auth info
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={() => <Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        <Route component={() => <Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/dashboard" component={() => <Dashboard />} />
      <Route path="/create-invoice" component={() => <CreateInvoice />} />
      <Route path="/invoices" component={() => <InvoiceHistory />} />
      <Route path="/customers" component={() => <PlaceholderPage title="Quản Lý Khách Hàng" />} />
      <Route path="/products" component={() => <PlaceholderPage title="Quản Lý Sản Phẩm" />} />
      <Route path="/templates" component={() => <PlaceholderPage title="Mẫu Hóa Đơn" />} />
      {/* <Route path="/templates/:id/preview" component={() => <InvoiceTemplatePreview />} />
      <Route path="/templates/:id/edit" component={() => <EditInvoiceTemplate />} /> */}
      <Route path="/reports" component={() => <Reports />} />
      <Route path="/settings" component={() => <Settings />} />
      <Route path="/settings/payos" component={() => <PayOSSettings />} />
      <Route path="/settings/paypal" component={() => <PayPalSettings />} />
      <Route path="/" component={() => {
        setLocation("/dashboard");
        return null;
      }} />
      <Route component={() => <PlaceholderPage title="404 - Không Tìm Thấy" />} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
