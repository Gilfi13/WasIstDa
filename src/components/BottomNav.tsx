import { Home, ShoppingCart, Tag, Settings, ListChecks } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Bestand", icon: Home },
  { path: "/shopping-list", label: "Einkauf", icon: ShoppingCart },
  { path: "/categories", label: "Kategorien", icon: Tag },
  { path: "/articles", label: "Artikel", icon: ListChecks },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md">
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-xl">

        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-1 relative"
            >
              {/* Active Background */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-300 -z-10",
                  isActive ? "bg-primary/10 scale-100" : "scale-75 opacity-0"
                )}
              />

              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground"
                )}
              />

              {/* 👇 Label nur aktiv */}
              {isActive && (
                <span className="text-[10px] font-medium text-primary mt-1">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}