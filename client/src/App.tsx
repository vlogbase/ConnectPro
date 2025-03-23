import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Services from "@/pages/services";
import Admin from "@/pages/admin";
import InstanceSetup from "@/pages/instance-setup";
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
          <Route path="/services" component={Services} />
          <Route path="/admin" component={Admin} />
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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
