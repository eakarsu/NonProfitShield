// === Batch 11 Gaps & Frontend Mounts ===
import GapClaimsPredictionPage from './pages/gap/GapClaimsPredictionPage'
import GapCoverageRecommendationPage from './pages/gap/GapCoverageRecommendationPage'
import GapClaimStatusChatbotPage from './pages/gap/GapClaimStatusChatbotPage'
import GapClaimRiskScorerPage from './pages/gap/GapClaimRiskScorerPage'
import GapPolicyDocManagementPage from './pages/gap/GapPolicyDocManagementPage'
import GapMultiPolicyHolderPage from './pages/gap/GapMultiPolicyHolderPage'
import GapRenewalTrackingPage from './pages/gap/GapRenewalTrackingPage'
import GapComplianceAuditTrailPage from './pages/gap/GapComplianceAuditTrailPage'
import GapProviderDirectoryPage from './pages/gap/GapProviderDirectoryPage'
import GapBrokerPortalPage from './pages/gap/GapBrokerPortalPage'
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Enrollment from "@/pages/enrollment";
import Claims from "@/pages/claims";
import Policies from "@/pages/policies";
import SubmitClaim from "@/pages/submit-claim";
import Payment from "@/pages/payment";
import Consultation from "@/pages/consultation";
import Calculator from "@/pages/calculator";
import Coverage from "@/pages/coverage";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import FinancialReports from "@/pages/financial-reports";
import Register from "@/pages/register";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AITools from "@/pages/ai-tools";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/coverage" component={Coverage} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/financial-reports" component={FinancialReports} />
          <Route path="/consultation" component={Consultation} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/enrollment" component={Enrollment} />
          <Route path="/claims" component={Claims} />
          <Route path="/policies" component={Policies} />
          <Route path="/submit-claim" component={SubmitClaim} />
          <Route path="/payment" component={Payment} />
          <Route path="/profile" component={Profile} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/coverage" component={Coverage} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/financial-reports" component={FinancialReports} />
          <Route path="/consultation" component={Consultation} />
          <Route path="/ai-tools" component={AITools} />
          {/* === Batch 11 Gaps & Frontend Mounts === */}
          <Route path="/gap/claims-prediction" component={GapClaimsPredictionPage} />
          <Route path="/gap/coverage-recommendation" component={GapCoverageRecommendationPage} />
          <Route path="/gap/claim-status-chatbot" component={GapClaimStatusChatbotPage} />
          <Route path="/gap/claim-risk-scorer" component={GapClaimRiskScorerPage} />
          <Route path="/gap/policy-doc-management" component={GapPolicyDocManagementPage} />
          <Route path="/gap/multi-policy-holder" component={GapMultiPolicyHolderPage} />
          <Route path="/gap/renewal-tracking" component={GapRenewalTrackingPage} />
          <Route path="/gap/compliance-audit-trail" component={GapComplianceAuditTrailPage} />
          <Route path="/gap/provider-directory" component={GapProviderDirectoryPage} />
          <Route path="/gap/broker-portal" component={GapBrokerPortalPage} />
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
        <ErrorBoundary>
          <Toaster />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
