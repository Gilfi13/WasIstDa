import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInstance } from "@/context/InstanceContext";

// Seiten
import Dashboard from "./pages/Dashboard";
import ShoppingList from "./pages/ShoppingList";
import Categories from "./pages/Categories";
import ArticlePage from "./pages/ArticlePage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Kategorien
import CategoryDetail from "./pages/CategoryDetail";
import NewCategory from "./pages/NewCategory";

// Artikel
import ArticleList from "./pages/ArticleList";
import NewArticle from "./pages/NewArticle";

// Instanzen
import CreateInstance from "./pages/CreateInstance";
import JoinInstance from "./pages/JoinInstance";
import InstanceSelect from "./pages/InstanceSelect";

// Settings
import Settings from "./pages/Settings";

// Bottom Navigation
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

function NavigateToInstanceSelect() {
  const location = useLocation();
  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  return <Navigate to={`/instance?next=${next}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { session, loading } = useAuth();
  const { instanceId } = useInstance();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-muted/40 to-background px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Lade App...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!instanceId) {
    return (
      <Routes>
        <Route path="/" element={<InstanceSelect />} />
        <Route path="/instance" element={<InstanceSelect />} />
        <Route path="/instance/create" element={<CreateInstance />} />
        <Route path="/instance/join" element={<JoinInstance />} />
        <Route path="*" element={<NavigateToInstanceSelect />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col items-center justify-start gap-6 px-4 sm:px-6 md:px-8 py-6">
      <div className="bg-blue-500 text-white text-3xl sm:text-4xl md:text-5xl font-bold p-4 sm:p-6 rounded shadow-lg w-full max-w-3xl text-center">
        WasIstDa?
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6 pb-24">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/shopping-list" element={<ShoppingList />} />

          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/new" element={<NewCategory />} />
          <Route path="/categories/:id" element={<CategoryDetail />} />

          <Route path="/articles" element={<ArticleList />} />
          <Route path="/articles/new" element={<NewArticle />} />
          <Route path="/article/:id" element={<ArticlePage />} />

          <Route path="/settings" element={<Settings />} />

          <Route path="/instance" element={<Navigate to="/" replace />} />
          <Route path="/instance/create" element={<Navigate to="/" replace />} />
          <Route path="/instance/join" element={<Navigate to="/" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <Toaster />
        <Sonner richColors position="top-center" />

        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}