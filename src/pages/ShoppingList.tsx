import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchArticles, updateStock } from "@/lib/supabase-helpers";
import { BottomNav } from "@/components/BottomNav";
import { ShoppingCart, Check, Plus } from "lucide-react";
import  StockChangeDialog  from "@/components/StockChangeDialog";
import * as LucideIcons from "lucide-react";
import { useInstance } from "@/context/InstanceContext";

export default function ShoppingList() {

  const queryClient = useQueryClient();

  const [stockDialog, setStockDialog] = useState<any>(null);

  // merkt sich welche Artikel gerade erledigt wurden
  const [completed, setCompleted] = useState<Record<string, number>>({});

  const { instanceId } = useInstance();

const {
  data: articles = [],
  isLoading,
} = useQuery({
  queryKey: ["articles", instanceId],
  queryFn: () => fetchArticles(instanceId!),
  enabled: !!instanceId,
});



  // Artikel filtern (unter Mindestbestand oder kürzlich erledigt)
  const shoppingItems = (articles as any[]).filter((a) => {

    const lowStock = a.current_stock < a.minimum_stock;
    const recentlyCompleted = completed[a.id];

    if (lowStock) return true;

    if (recentlyCompleted) {
      const diff = Date.now() - recentlyCompleted;
      return diff < 20 * 60 * 1000;
    }

    return false;
  });

  // nach Kategorie gruppieren
  const grouped = shoppingItems.reduce((acc: any, article: any) => {

    const category = article.categories?.name || "Ohne Kategorie";

    if (!acc[category]) acc[category] = [];

    acc[category].push(article);

    return acc;

  }, {});

  // Quick Einbuchen (fehlende Menge)
  const handleQuickBook = async (article: any) => {

    const needed = article.minimum_stock - article.current_stock;

    if (needed <= 0) return;

 await updateStock(article.id, needed, instanceId!);


    setCompleted((prev) => ({
      ...prev,
      [article.id]: Date.now(),
    }));

    queryClient.invalidateQueries({ queryKey: ["articles"] });

    setTimeout(() => {
      setCompleted((prev) => {
        const copy = { ...prev };
        delete copy[article.id];
        return copy;
      });
    }, 20 * 60 * 1000);
  };

  return (
    <div className="min-h-screen pb-28">

      {/* HEADER */}

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

          <div className="space-y-8">

            {Object.entries(grouped).map(([category, items]: any) => (

              <div key={category}>

                {/* Kategorie Titel */}

                <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {category}
                </h2>

                <div className="space-y-3">

                  {items.map((article: any) => {

                    const needed =
                      article.minimum_stock - article.current_stock;

                    const isCompleted = completed[article.id];

                    return (

                      <div
  key={article.id}
  className={`flex items-center gap-4 p-4 rounded-3xl border border-border/60 shadow-sm transition ${
    isCompleted ? "bg-white ring-1 ring-green-200" : "bg-white"
  }`}
>

                        {/* Kreis für Icon */}
<div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center flex-shrink-0">
  {(() => {
    const Icon =
      article.icon &&
      (LucideIcons as any)[article.icon as keyof typeof LucideIcons];

    if (!Icon) {
      return (
        <span className="text-[10px] text-muted-foreground">
          Icon
        </span>
      );
    }

    return <Icon className="w-6 h-6" />;
  })()}
</div>


                        {/* Artikel Infos */}

                        <div className="flex-1 min-w-0">

                          <p className="font-semibold truncate">
                            {article.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            📍 {article.location || "Kein Lagerort"}
                          </p>

                        </div>

                        {/* Bestand */}

                        <div className="text-right mr-2">

                          <p className="font-mono text-lg">
                            {article.current_stock}
                          </p>

                          {needed > 0 && (
                            <p className="text-xs text-warning font-semibold">
                              +{needed}
                            </p>
                          )}

                        </div>

                        {/* Quick Einbuchen */}

                        <button
                          onClick={() => handleQuickBook(article)}
                          className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center active:scale-95"
                        >
                          <Check className="h-5 w-5 text-success" />
                        </button>

                        {/* Manueller Dialog */}

                        <button
  onClick={() => {
    setStockDialog(article);

    // Auch Plus-Button als erledigt markieren
    setCompleted((prev) => ({
      ...prev,
      [article.id]: Date.now(),
    }));
  }}
  className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center active:scale-95"
>
  <Plus className="h-5 w-5 text-primary" />
</button>

                      </div>

                    );

                  })}

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

      {/* MANUELLER STOCK DIALOG */}

      <StockChangeDialog
        open={!!stockDialog}
        onClose={() => setStockDialog(null)}
        article={stockDialog}
        mode="add"
        onDone={() =>
          queryClient.invalidateQueries({ queryKey: ["articles"] })
        }
      />

      <BottomNav />

    </div>
    
  );
}