import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import PinGate, { usePinGate } from "@/components/PinGate";
import WorkTasks from "./pages/WorkTasks";
import Personal from "./pages/Personal";
import Auth from "./pages/Auth";
import InstallApp from "./pages/InstallApp";
import DeeplyLanding from "./pages/DeeplyLanding";
import DeeplyDashboard from "./components/deeply/DeeplyDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { verified, verify } = usePinGate();

  if (!verified) {
    return <PinGate onSuccess={verify} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkTasks />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/deeply" element={<DeeplyLanding />} />
        <Route path="/deeply/dashboard" element={<DeeplyDashboard />} />
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
