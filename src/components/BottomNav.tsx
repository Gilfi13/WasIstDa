import { Home, ShoppingCart, Tag } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Bestand", icon: Home },
  { path: "/shopping-list", label: "Einkaufsliste", icon: ShoppingCart },
  { path: "/categories", label: "Kategorien", icon: Tag },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
      <div className="flex items-center justify-between px-6 py-3 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-xl safe-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center gap-1 py-2 relative"
            >
              {/* Active Background Bubble */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-primary/10 -z-10" />
              )}

              <item.icon
                className={cn(
                  "h-6 w-6 transition-all",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}