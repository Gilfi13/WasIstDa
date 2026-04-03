import { useCallback, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, ExternalLink, ChefHat } from "lucide-react";
import { toast } from "sonner";
import {
  fetchRecipeSuggestionsFromInventory,
  recipeSearchUrl,
  type RecipeSuggestion,
} from "@/lib/recipe-ai";

type ArticleRow = {
  name: string;
  current_stock: number;
  categories?: { name?: string } | null;
};

type RecipeIdeasSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: ArticleRow[];
};

function buildInventoryLines(items: ArticleRow[]): string[] {
  return items
    .filter((a) => a.current_stock > 0)
    .map((a) => {
      const cat = a.categories?.name ? ` (${a.categories.name})` : "";
      return `${a.name}${cat}: ${a.current_stock} Stk.`;
    });
}

export function RecipeIdeasSheet({
  open,
  onOpenChange,
  articles,
}: RecipeIdeasSheetProps) {
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState<RecipeSuggestion[]>([]);

  const runAnalysis = useCallback(async () => {
    const lines = buildInventoryLines(articles);
    if (lines.length === 0) {
      toast.message("Kein Bestand", {
        description: "Es sind keine Artikel mit Bestand > 0 vorhanden.",
      });
      return;
    }

    setLoading(true);
    setDishes([]);
    try {
      const next = await fetchRecipeSuggestionsFromInventory(lines);
      setDishes(next);
      if (next.length === 0) {
        toast.message("Keine Vorschläge", {
          description: "Die KI konnte keine Gerichte ableiten.",
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      toast.error("Analyse fehlgeschlagen", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [articles]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] max-h-[900px] rounded-t-3xl border-t border-border/60 bg-background/95 backdrop-blur-xl px-5 pb-8 pt-2 flex flex-col gap-4"
      >
        <SheetHeader className="space-y-1 text-left shrink-0 pr-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold tracking-tight">
                Küchen-Assistent
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Analysiert deinen Bestand und schlägt Gerichte mit Rezept-Links
                vor.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="rounded-2xl h-11 px-5 font-semibold shadow-sm bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200/80"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere Bestand…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerichte vorschlagen
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground self-center w-full sm:w-auto">
            {buildInventoryLines(articles).length} Artikel mit Bestand
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 -mr-1">
          {dishes.length === 0 && !loading && (
            <Card className="rounded-2xl border-dashed border-border/80 bg-muted/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Tippe auf{" "}
                <span className="font-semibold text-foreground">
                  Gerichte vorschlagen
                </span>
                , um aus deinem aktuellen Bestand Ideen zu erhalten.
              </p>
            </Card>
          )}

          {dishes.map((d, i) => {
            const href = d.recipe_url ?? recipeSearchUrl(d.name);
            return (
              <Card
                key={`${d.name}-${i}`}
                className="rounded-2xl p-4 shadow-sm border-border/60 bg-card/80"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-base leading-snug">
                      {d.name}
                    </h3>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
                    >
                      Rezept
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {d.description}
                  </p>
                  {d.ingredients_used.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {d.ingredients_used.map((ing) => (
                        <span
                          key={ing}
                          className="text-[11px] rounded-lg bg-muted/80 px-2 py-0.5 text-muted-foreground"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
