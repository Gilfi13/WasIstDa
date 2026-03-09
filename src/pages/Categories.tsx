import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchArticles } from "@/lib/supabase-helpers";
import { BottomNav } from "@/components/BottomNav";
import { Tag, Package } from "lucide-react";

export default function Categories() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
  });

  const getCategoryCount = (catId: string) =>
    (articles as any[]).filter((a) => a.category_id === catId).length;

  const getCategoryStock = (catId: string) =>
    (articles as any[])
      .filter((a) => a.category_id === catId)
      .reduce((sum, a) => sum + a.current_stock, 0);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Kategorien
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {(categories as any[]).map((cat, i) => {
          const count = getCategoryCount(cat.id);
          const stock = getCategoryStock(cat.id);

          return (
            <div
              key={cat.id}
              className="flex items-center gap-5 p-6 rounded-3xl bg-card/80 backdrop-blur border border-border/60 shadow-sm transition active:scale-[0.98]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent">
                <Package className="h-6 w-6 text-accent-foreground" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {cat.name}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  {count} {count === 1 ? "Artikel" : "Artikel"}
                </p>
              </div>

              {/* Stock */}
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {stock}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gesamtbestand
                </p>
              </div>
            </div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}