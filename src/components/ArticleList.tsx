import { cn } from "@/lib/utils";
import { Package, AlertTriangle } from "lucide-react";

interface Article {
  id: string;
  name: string;
  barcode: string;
  current_stock: number;
  minimum_stock: number;
  categories: { name: string } | null;
}

interface ArticleListProps {
  articles: Article[];
  onSelect?: (article: Article) => void;
  showWarning?: boolean;
}

export function ArticleList({
  articles,
  onSelect,
  showWarning = true,
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-muted/60 mb-4">
          <Package className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm">Keine Artikel vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, i) => {
        const isLow = article.current_stock < article.minimum_stock;

        return (
          <button
            key={article.id}
            onClick={() => onSelect?.(article)}
            className={cn(
              "w-full text-left rounded-3xl p-5",
              "bg-card/80 backdrop-blur border border-border/60 shadow-sm",
              "transition-all active:scale-[0.98]",
              "hover:shadow-md"
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base truncate">
                    {article.name}
                  </h3>

                  {showWarning && isLow && (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground truncate">
                  {article.categories?.name || "Ohne Kategorie"}
                </p>
              </div>

              {/* Right Stock Badge */}
              <div className="flex flex-col items-end">
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl text-lg font-semibold tabular-nums",
                    isLow
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-foreground"
                  )}
                >
                  {article.current_stock}
                </div>

                <span className="text-xs text-muted-foreground mt-1">
                  Min. {article.minimum_stock}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}