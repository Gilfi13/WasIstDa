import { useQuery } from "@tanstack/react-query";
import { fetchArticles } from "@/lib/supabase-helpers";
import { BottomNav } from "@/components/BottomNav";
import { ShoppingCart, Check } from "lucide-react";

export default function ShoppingList() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
  });

  const shoppingItems = (articles as any[]).filter(
    (a) => a.current_stock < a.minimum_stock
  );

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Einkaufsliste
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-3xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : shoppingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-success" />
            </div>

            <p className="text-lg font-semibold text-foreground">
              Alles aufgefüllt 🎉
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Keine Artikel unter dem Mindestbestand
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {shoppingItems.map((article: any, i: number) => {
              const needed =
                article.minimum_stock - article.current_stock;

              return (
                <div
                  key={article.id}
                  className="flex items-center gap-5 p-6 rounded-3xl bg-card/80 backdrop-blur border border-border/60 shadow-sm transition active:scale-[0.98]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Needed Badge */}
                  <div className="flex items-center justify-center min-w-[64px] h-16 rounded-2xl bg-warning/15">
                    <span className="text-xl font-semibold text-warning tabular-nums">
                      +{needed}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {article.name}
                    </p>

                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {article.categories?.name || "Ohne Kategorie"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      Bestand: {article.current_stock} / {article.minimum_stock}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}