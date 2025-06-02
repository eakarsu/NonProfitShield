import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Enrollment from "@/pages/enrollment";
import Claims from "@/pages/claims";
import SubmitClaim from "@/pages/submit-claim";
import Payment from "@/pages/payment";
import Consultation from "@/pages/consultation";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/consultation" component={Consultation} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/enrollment" component={Enrollment} />
          <Route path="/claims" component={Claims} />
          <Route path="/submit-claim" component={SubmitClaim} />
          <Route path="/payment" component={Payment} />
          <Route path="/consultation" component={Consultation} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
