import { useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccountGate } from "./components/AccountGate";
import { LaunchScreen } from "./components/LaunchScreen";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import PostDetail from "./pages/PostDetail";
import Archive from "./pages/Archive";
import Feedback from "./pages/Feedback";
import Analytics from "./pages/Analytics";

function Router() { return <Switch><Route path="/" component={Home} /><Route path="/explore" component={Explore} /><Route path="/messages" component={Messages} /><Route path="/notifications" component={Notifications} /><Route path="/saved" component={Home} /><Route path="/archive" component={Archive} /><Route path="/feedback" component={Feedback} /><Route path="/analytics" component={Analytics} /><Route path="/settings" component={Settings} /><Route path="/admin" component={Admin} /><Route path="/post/:postId" component={PostDetail} /><Route path="/u/:username" component={Profile} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 560); return () => window.clearTimeout(timer); }, []);
  return <ErrorBoundary><ThemeProvider defaultTheme="system"><TooltipProvider><Toaster richColors position="top-center" /><AccountGate>{ready ? <Router /> : <LaunchScreen />}</AccountGate></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
