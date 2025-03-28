import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Import onboarding components
import { TutorialProvider } from "@/components/onboarding/TutorialProvider";
import { TutorialTooltip } from "@/components/onboarding/TutorialTooltip";

import Home from "@/pages/home";
import Profile from "@/pages/profile-new";
import Services from "@/pages/services";
import Admin from "@/pages/admin";
import InstanceSetup from "@/pages/instance-setup";
import InstanceSettings from "@/pages/instance-settings";
import InstanceAnalytics from "@/pages/instance-analytics";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/profile/:id?" component={Profile} />
          <Route path="/profile/:id?/edit" component={Profile} />
          <Route path="/services" component={Services} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/instances/:id/settings" component={InstanceSettings} />
          <Route path="/admin/instances/:id/analytics" component={InstanceAnalytics} />
          <Route path="/instance-setup" component={InstanceSetup} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <Router />
        <TutorialTooltip />
        <Toaster />
      </TutorialProvider>
    </QueryClientProvider>
  );
}

export default App;
