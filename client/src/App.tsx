import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Console from "@/pages/Console";
import MockingPage from "@/pages/MockingPage";
import Mastering from "@/pages/Mastering";
import MasteringProcess from "@/pages/MasteringProcess";
import NotFound from "@/pages/not-found";
import { initializeAnalysisData } from '@/lib/stores/audioStore';

// Initialize analysis data on app start
initializeAnalysisData();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Default landing page with full interface */}
      <Route path="/" component={Landing} />

      {/* Authentication-protected routes */}
      {isLoading ? (
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-accent-primary">Loading...</div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/landing" component={Landing} />
          <Route path="/login" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/console" component={Console} />
        </>
      )}

      {/* Demo/Testing routes */}
      <Route path="/mocking" component={MockingPage} />
      <Route path="/mastering" component={Mastering} />
      <Route path="/mastering/process" component={MasteringProcess} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;