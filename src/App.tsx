import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import { RestaurantProvider } from "@/context/RestaurantContext";
import LoginPage from "./pages/LoginPage";
import WaiterPage from "./pages/WaiterPage";
import OrderPage from "./pages/OrderPage";
import AdminPage from "./pages/AdminPage";
import KioskPage from "./pages/KioskPage";
import SelfOrderPage from "./pages/SelfOrderPage";
import MonitorPage from "./pages/MonitorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RestaurantProvider>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/waiter" element={<WaiterPage />} />
              <Route path="/waiter/table/:tableId" element={<OrderPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/:module" element={<AdminPage />} />
              <Route path="/kiosk" element={<KioskPage />} />
              <Route path="/self-order" element={<SelfOrderPage />} />
              <Route path="/self-order/:tableId" element={<SelfOrderPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RestaurantProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
