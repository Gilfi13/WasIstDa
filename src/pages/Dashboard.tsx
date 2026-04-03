import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchArticles, findArticleByBarcode } from "@/lib/supabase-helpers";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import StockChangeDialog from "@/components/StockChangeDialog";
import NewArticleDialog from "@/components/NewArticleDialog";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { Search, Plus, Minus, LogOut, BarChart3, Package, ChefHat } from "lucide-react";
import { RecipeIdeasSheet } from "@/components/RecipeIdeasSheet";
import { useInstance } from "@/context/InstanceContext";   // <--- NEU

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dialog-Status für "Neuen Artikel erstellen"
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function openDialog() {
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
  }

  const [scanMode, setScanMode] = useState<"add" | "remove" | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stockDialog, setStockDialog] = useState<{ article: any; mode: "add" | "remove"; amount?: number } | null>(null);
  const [newArticleBarcode, setNewArticleBarcode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);

  const { instanceId } = useInstance();

  const { data: articles = [] } = useQuery({
    queryKey: ["articles", instanceId],
    queryFn: () => fetchArticles(instanceId!),
    enabled: !!instanceId,
  });

  /* Realtime Updates */
  useEffect(() => {
    const channel = supabase
      .channel("articles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["articles"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /* Barcode Scan */
  const handleScan = useCallback(
    async (barcode: string) => {
      const currentMode = scanMode;
      setScanMode(null);

      try {
        const article = await findArticleByBarcode(barcode, instanceId!);

        if (article) {
          setStockDialog({ article, mode: currentMode! });
        } else {
          if (currentMode === "add") {
            setNewArticleBarcode(barcode);
          } else {
            toast.error("Artikel nicht gefunden.");
          }
        }
      } catch (err: any) {
        toast.error("Fehler: " + err.message);
      }
    },
    [scanMode]
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /* Stats */
  const totalStock = articles.reduce(
    (sum: number, a: any) => sum + a.current_stock,
    0
  );

  const lowStock = articles.filter(
    (a: any) => a.current_stock < a.minimum_stock
  ).length;

  /* Suche */
  const filteredArticles = articles.filter((a: any) => {
    const term = search.toLowerCase();
    const name = a.name?.toLowerCase() || "";
    const category = a.categories?.name?.toLowerCase() || "";
    const location = a.location?.toLowerCase() || "";

    return (
      name.includes(term) ||
      category.includes(term) ||
      location.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-transparent pb-28">

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10">
  <Package className="h-5 w-5 text-primary" />
</div>

            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Smart Inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(!showStats)}
              className="rounded-full h-10 w-10"
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full h-10 w-10"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* STATS */}
        {showStats && (
          <section className="grid grid-cols-3 gap-4">

            <Card className="rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold">
                {articles.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Artikel
              </p>
            </Card>

            <Card className="rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold">
                {totalStock}
              </p>
              <p className="text-xs text-muted-foreground">
                Gesamtbestand
              </p>
            </Card>

            <Card className="rounded-2xl p-5 text-center">
              <p className="text-2xl font-semibold text-warning">
                {lowStock}
              </p>
              <p className="text-xs text-muted-foreground">
                Nachkaufen
              </p>
            </Card>

          </section>
        )}

        {/* KÜCHEN-ASSISTENT */}
        <section>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRecipeSheetOpen(true)}
            className="w-full h-16 text-base font-semibold rounded-3xl shadow-lg bg-blue-50/80 border border-blue-200/70 text-blue-800 hover:bg-blue-100/90 flex items-center justify-center gap-2"
          >
            <ChefHat className="h-6 w-6 text-blue-600 shrink-0" />
            Küchen-Assistent – Gerichte aus Bestand
          </Button>
        </section>

        {/* SCAN BUTTONS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <Button
  onClick={() => setScanMode("add")}
  variant="secondary"
  className="h-28 text-lg font-semibold rounded-3xl shadow-lg bg-green-50/60 border border-green-200/60 text-green-700 hover:bg-green-100/60"
>
  <Plus className="mr-3 h-6 w-6 text-green-600" />
  Artikel einbuchen
</Button>


<Button
  onClick={() => setScanMode("remove")}
  variant="secondary"
  className="h-28 text-lg font-semibold rounded-3xl shadow-lg bg-red-50/60 border border-red-200/60 text-red-700 hover:bg-red-100/60"
>
  <Minus className="mr-3 h-6 w-6 text-red-600" />
  Artikel ausbuchen
</Button>


        </section>
{/* SUCHE */}
<section className="space-y-4">

  <div className="relative w-full">

    {/* Lupe links */}
    <Search
      className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none z-20"
    />

    {/* Eingabefeld */}
    <input
      type="text"
      placeholder="Artikel, Kategorie oder Lagerort suchen..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-16 pr-14 h-16 w-full rounded-3xl text-base bg-card/80 backdrop-blur border border-border/60 shadow-sm outline-none z-10 relative"
    />

    {/* X rechts – nur sichtbar wenn etwas eingegeben wurde */}
    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition z-20"
      >
        ✕
      </button>
    )}

  </div>

          {/* Suchergebnisse */}
          {search.trim() !== "" && (
            <section className="space-y-3">

              {filteredArticles.map((a: any) => {

                const low = a.current_stock < a.minimum_stock;
                const Icon = 
                  a.icon && (LucideIcons as any)[a.icon as keyof typeof LucideIcons];

                  return (
    <Card
      key={a.id}
      onClick={() => navigate(`/article/${a.id}`)}
      className="p-4 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition"
    >
      {/* Linker Bereich: Icon + Infos */}
      <div className="flex items-center gap-4">
        {/* Icon-Kreis */}
        <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center">
          {Icon ? (
            <Icon className="w-6 h-6" />
          ) : (
            <span className="text-[10px] text-muted-foreground">Icon</span>
          )}
        </div>

        {/* Artikel Infos */}
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-base">
            {a.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {a.categories?.name}
          </p>

          <p className="text-sm font-medium">
            📍 {a.location || "Kein Lagerort"}
          </p>
        </div>
      </div>


                    {/* Bestand */}
                    <div className="flex items-center gap-4">

                      <div className="flex flex-col items-end">
                        <p className="text-xl font-mono font-semibold">
                          {a.current_stock}
                        </p>

                        <p className={`text-xs ${low ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                          min {a.minimum_stock}
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col items-center gap-1">

                        <Button
  size="sm"
  variant="outline"
  onClick={(e) => {
    e.stopPropagation();
    setStockDialog({ article: a, mode: "add", amount: 1 });
  }}
>
  <Plus className="h-4 w-4" />
</Button>





                        <Button
  size="sm"
  variant="outline"
  onClick={(e) => {
    e.stopPropagation();
    setStockDialog({ article: a, mode: "remove", amount: 1 });
  }}
>
  <Minus className="h-4 w-4" />
</Button>




                      </div>

                    </div>

                  </Card>
                );
              })}

            </section>
          )}

        </section>

      </main>

      {/* Scanner */}
      {scanMode && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScanMode(null)}
        />
      )}

      {/* Stock Dialog */}
      <StockChangeDialog
        open={!!stockDialog}
        onClose={() => setStockDialog(null)}
        article={stockDialog?.article}
        mode={stockDialog?.mode || "add"}
        amount={stockDialog?.amount}
        onDone={() =>
          queryClient.invalidateQueries({ queryKey: ["articles"] })
        }
      />

      {/* New Article */}
      {isDialogOpen && (
  <NewArticleDialog onClose={closeDialog} />
)}

      <RecipeIdeasSheet
        open={recipeSheetOpen}
        onOpenChange={setRecipeSheetOpen}
        articles={articles}
      />

      <BottomNav />

    </div>
  );
}