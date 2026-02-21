import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import PinGate, { usePinGate, PinSetup } from "@/components/PinGate";
import WorkTasks from "./pages/WorkTasks";
import Personal from "./pages/Personal";
import Auth from "./pages/Auth";
import InstallApp from "./pages/InstallApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { verified, verify, pinEnabled, hasPin, loading: pinLoading } = usePinGate();

  if (authLoading || pinLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  // Not logged in — show the page (it will redirect to /auth itself)
  if (!user) {
    return <>{children}</>;
  }

  // PIN enabled but no PIN set yet — show setup
  if (pinEnabled && !hasPin) {
    return <PinSetup onSuccess={verify} />;
  }

  // PIN enabled and has PIN — verify
  if (pinEnabled && !verified) {
    return <PinGate onSuccess={verify} />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkTasks />} />
        <Route
          path="/personal"
          element={
            <ProtectedRoute>
              <Personal />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/install/*" element={<InstallApp />} />
        <Route path="/Install/*" element={<InstallApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
