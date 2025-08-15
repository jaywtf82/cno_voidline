
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Console from "@/pages/Console";
import MockingPage from "@/pages/MockingPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Always show MockingPage as default for demo purposes */}
      <Route path="/" component={MockingPage} />
      <Route path="/mocking" component={MockingPage} />
      
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
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
