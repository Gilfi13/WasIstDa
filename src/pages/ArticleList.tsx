import { useQuery } from "@tanstack/react-query";
import { fetchArticles } from "@/lib/supabase-helpers";
import { BottomNav } from "@/components/BottomNav";
import { ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInstance } from "@/context/InstanceContext";
import * as LucideIcons from "lucide-react";

export default function ArticleList() {
  const navigate = useNavigate();
  const { instanceId } = useInstance();

  const { data: articles = [] } = useQuery({
    queryKey: ["articles", instanceId],
    queryFn: () => fetchArticles(instanceId!),
    enabled: !!instanceId,
  });

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Artikel
          </h1>
        </div>
      </header>

      {/* Button: Neuer Artikel */}
      <div className="max-w-5xl mx-auto px-6 mt-6">
        <button
  onClick={() => navigate("/articles/new")}
  className="w-full h-16 rounded-3xl bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-base shadow-sm hover:bg-blue-200 active:scale-[0.98] transition-all"
>
  + Neuen Artikel erstellen
</button>
      </div>

      {/* Artikelliste */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {(articles as any[]).map((article, i) => (
          <div
            key={article.id}
            onClick={() => navigate(`/article/${article.id}`)}
            className="flex items-center gap-5 p-6 rounded-3xl bg-white border border-border shadow-sm transition active:scale-[0.98] cursor-pointer"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent">
              {article.icon &&
              (LucideIcons as any)[article.icon as keyof typeof LucideIcons] ? (
                (() => {
                  const Icon =
                    (LucideIcons as any)[
                      article.icon as keyof typeof LucideIcons
                    ];
                  return <Icon className="h-6 w-6 text-accent-foreground" />;
                })()
              ) : (
                <ListChecks className="h-6 w-6 text-accent-foreground" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">
                {article.name}
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                Bestand: {article.current_stock}
              </p>
            </div>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
