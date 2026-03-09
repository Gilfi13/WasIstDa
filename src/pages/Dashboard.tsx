import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchArticles, findArticleByBarcode } from "@/lib/supabase-helpers";
import { ArticleList } from "@/components/ArticleList";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { StockChangeDialog } from "@/components/StockChangeDialog";
import { NewArticleDialog } from "@/components/NewArticleDialog";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Search, LogOut, Package } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [scanMode, setScanMode] = useState<"add" | "remove" | null>(null);
  const [stockDialog, setStockDialog] = useState<{ article: any; mode: "add" | "remove" } | null>(null);
  const [newArticleBarcode, setNewArticleBarcode] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
  });

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

  const handleScan = useCallback(
    async (barcode: string) => {
      const currentMode = scanMode;
      setScanMode(null);

      try {
        const article = await findArticleByBarcode(barcode);

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

  const filteredArticles = articles.filter(
    (a: any) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.categories?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = articles.reduce(
    (sum: number, a: any) => sum + a.current_stock,
    0
  );

  const lowStock = articles.filter(
    (a: any) => a.current_stock < a.minimum_stock
  ).length;

  return (
    <div className="min-h-screen bg-transparent pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Vorratskammer
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-full h-10 w-10"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Button
            onClick={() => setScanMode("add")}
            className="h-16 text-base font-semibold rounded-3xl shadow-lg active:scale-[0.98] transition"
          >
            <Plus className="mr-2 h-5 w-5" />
            Artikel einbuchen
          </Button>

          <Button
            onClick={() => setScanMode("remove")}
            variant="secondary"
            className="h-16 text-base font-semibold rounded-3xl active:scale-[0.98] transition"
          >
            <Minus className="mr-2 h-5 w-5" />
            Artikel ausbuchen
          </Button>
        </section>

        {/* Search */}
        <section>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Artikel oder Kategorie suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 h-14 rounded-3xl text-base bg-card/80 backdrop-blur border border-border/60 shadow-sm"
            />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="rounded-3xl p-6 text-center shadow-md bg-card/80 backdrop-blur border border-border/60">
            <p className="text-4xl font-semibold">{articles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Artikel</p>
          </Card>

          <Card className="rounded-3xl p-6 text-center shadow-md bg-card/80 backdrop-blur border border-border/60">
            <p className="text-4xl font-semibold">{totalStock}</p>
            <p className="text-sm text-muted-foreground mt-1">Gesamtbestand</p>
          </Card>

          <Card className="rounded-3xl p-6 text-center shadow-md bg-card/80 backdrop-blur border border-border/60">
            <p className="text-4xl font-semibold text-warning">
              {lowStock}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nachkaufen
            </p>
          </Card>
        </section>

        {/* Article List */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Bestand
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-3xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <ArticleList articles={filteredArticles as any} />
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

      <StockChangeDialog
        open={!!stockDialog}
        onClose={() => setStockDialog(null)}
        article={stockDialog?.article}
        mode={stockDialog?.mode || "add"}
        onDone={() =>
          queryClient.invalidateQueries({ queryKey: ["articles"] })
        }
      />

      <NewArticleDialog
        open={!!newArticleBarcode}
        onClose={() => setNewArticleBarcode(null)}
        barcode={newArticleBarcode || ""}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["articles"] })
        }
      />

      <BottomNav />
    </div>
  );
}