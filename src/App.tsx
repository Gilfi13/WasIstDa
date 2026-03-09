import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import ShoppingList from "./pages/ShoppingList";
import Categories from "./pages/Categories";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-muted/40 to-background px-4 sm:px-6 md:px-8">
        <div className="bg-red-500 text-white text-2xl sm:text-3xl font-bold p-6 rounded shadow-lg w-full max-w-xl text-center">
          Tailwind Test – Loading
        </div>

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
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 sm:px-6 md:px-8">
              <div className="w-full max-w-md">
                <Login />
              </div>
            </div>
          }
        />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col items-center justify-start gap-6 px-4 sm:px-6 md:px-8 py-6">
      <div className="bg-blue-500 text-white text-3xl sm:text-4xl md:text-5xl font-bold p-4 sm:p-6 rounded shadow-lg w-full max-w-3xl text-center">
        WasIstDa?
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={150}>
      <Toaster />
      <Sonner richColors position="top-center" />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;