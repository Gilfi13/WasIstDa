import { supabase } from "@/integrations/supabase/client";

export type RecipeSuggestion = {
  name: string;
  description: string;
  ingredients_used: string[];
  /** Wenn die KI keine verlässliche URL liefert, bleibt null und die UI nutzt eine Suche. */
  recipe_url: string | null;
};

type OpenAIResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

export function recipeSearchUrl(dishName: string): string {
  return `https://www.chefkoch.de/suche.php?Suchwort=${encodeURIComponent(dishName)}`;
}

function normalizeRecipeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function parseDishesJson(raw: string): RecipeSuggestion[] {
  const parsed = JSON.parse(raw) as { dishes?: unknown };
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.dishes)) {
    throw new Error("Ungültiges Antwortformat");
  }

  return parsed.dishes.map((d: unknown) => {
    const o = d as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const description = typeof o.description === "string" ? o.description.trim() : "";
    const ingredients_used = Array.isArray(o.ingredients_used)
      ? o.ingredients_used.filter((x): x is string => typeof x === "string")
      : [];
    const recipe_url = normalizeRecipeUrl(o.recipe_url as string | null);

    if (!name) throw new Error("Gericht ohne Namen");

    return {
      name,
      description,
      ingredients_used,
      recipe_url,
    };
  });
}

const SYSTEM_PROMPT = `Du bist ein Küchen-Assistent für deutschsprachige Nutzer.
Du erhältst eine Liste von Lebensmitteln/Zutaten mit Bestandsmengen aus einem Haushalt (Instanz).
Analysiere realistisch, welche Gerichte man damit kochen oder zubereiten kann.
Berücksichtige nur Zutaten mit Bestand > 0. Sei kreativ aber bodenständig.

Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown):
{
  "dishes": [
    {
      "name": "Kurzer Gerichtname",
      "description": "1-2 Sätze, was das Gericht ist und warum es passt.",
      "ingredients_used": ["Zutat aus der Liste", "..."],
      "recipe_url": "https://..." oder null
    }
  ]
}

Regeln für recipe_url:
- Nur setzen, wenn du eine konkrete, plausibel existierende HTTPS-Rezeptseite kennst (z. B. Chefkoch, bekannte Food-Blogs).
- Wenn unsicher: recipe_url auf null setzen (die App baut dann einen Suchlink).

Liefere 5 bis 8 Vorschläge, sortiert nach Praktikabilität mit dem vorhandenen Bestand.`;

export async function fetchRecipeSuggestionsFromInventory(
  lines: string[]
): Promise<RecipeSuggestion[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxyUrl = import.meta.env.VITE_RECIPE_AI_PROXY_URL as string | undefined;
  let edgeInvokeErrorSummary: string | null = null;

  // #region agent log
  fetch("http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8479dd",
    },
    body: JSON.stringify({
      sessionId: "8479dd",
      runId: "post-fix",
      hypothesisId: "H4",
      location: "recipe-ai.ts:fetchRecipeSuggestionsFromInventory:entry",
      message: "entry env + lines",
      data: {
        linesCount: lines.length,
        envHasProxy: Boolean(proxyUrl?.trim()),
        envHasOpenAIKey: Boolean(apiKey?.trim()),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // 1) Supabase Edge Function (OPENAI_API_KEY nur als Secret im Projekt)
  try {
    const { data, error } = await supabase.functions.invoke(
      "recipe-suggestions",
      { body: { lines } }
    );

    // #region agent log
    const payloadForLog =
      data && typeof data === "object"
        ? (data as { dishes?: unknown; error?: string })
        : null;
    fetch("http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "8479dd",
      },
      body: JSON.stringify({
        sessionId: "8479dd",
        runId: "post-fix",
        hypothesisId: "H1-H2",
        location: "recipe-ai.ts:afterInvoke",
        message: "supabase.functions.invoke result",
        data: {
          hasData: data != null,
          dataType: typeof data,
          dataKeys:
            data && typeof data === "object"
              ? Object.keys(data as object).slice(0, 12)
              : [],
          dishesIsArray: Array.isArray(payloadForLog?.dishes),
          payloadErrorLen:
            typeof payloadForLog?.error === "string"
              ? payloadForLog.error.length
              : 0,
          invokeErrorMessage:
            error && typeof (error as Error).message === "string"
              ? String((error as Error).message).slice(0, 200)
              : error
                ? String(error).slice(0, 200)
                : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (data && typeof data === "object") {
      const payload = data as { dishes?: unknown; error?: string };
      if (typeof payload.error === "string" && payload.error.length > 0) {
        throw new Error(payload.error);
      }
      if (Array.isArray(payload.dishes)) {
        try {
          return parseDishesJson(JSON.stringify({ dishes: payload.dishes }));
        } catch (parseErr) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "8479dd",
              },
              body: JSON.stringify({
                sessionId: "8479dd",
                runId: "post-fix",
                hypothesisId: "H5",
                location: "recipe-ai.ts:parseDishesJson",
                message: "parse failed after edge dishes",
                data: {
                  err:
                    parseErr instanceof Error
                      ? parseErr.message.slice(0, 200)
                      : String(parseErr).slice(0, 200),
                },
                timestamp: Date.now(),
              }),
            }
          ).catch(() => {});
          // #endregion
          throw parseErr;
        }
      }
    }

    if (error) {
      edgeInvokeErrorSummary =
        typeof (error as { message?: string }).message === "string"
          ? (error as { message: string }).message.trim()
          : String(error).trim().slice(0, 300);
    }
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "8479dd",
      },
      body: JSON.stringify({
        sessionId: "8479dd",
        runId: "post-fix",
        hypothesisId: "H3",
        location: "recipe-ai.ts:invokeCatch",
        message: "catch after invoke block",
        data: {
          err:
            e instanceof Error ? e.message.slice(0, 240) : String(e).slice(0, 240),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (
      e instanceof Error &&
      /OPENAI_API_KEY|Secret|fehlt|Edge Function/i.test(e.message)
    ) {
      throw e;
    }
  }

  if (proxyUrl?.trim()) {
    const res = await fetch(proxyUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `Proxy-Fehler (${res.status})`);
    }
    const data = (await res.json()) as { dishes?: unknown };
    const raw = JSON.stringify({ dishes: data.dishes ?? [] });
    return parseDishesJson(raw);
  }

  if (!apiKey?.trim()) {
    // #region agent log
    fetch("http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "8479dd",
      },
      body: JSON.stringify({
        sessionId: "8479dd",
        runId: "post-fix",
        hypothesisId: "H1",
        location: "recipe-ai.ts:beforeFinalThrow",
        message: "throw KI nicht konfiguriert — edge/proxy miss, no VITE key",
        data: {
          envHasProxy: Boolean(proxyUrl?.trim()),
          edgeInvokeErrorSummary: edgeInvokeErrorSummary?.slice(0, 200) ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const edgeBit = edgeInvokeErrorSummary
      ? ` (${edgeInvokeErrorSummary})`
      : "";
    throw new Error(
      `KI nicht konfiguriert${edgeBit}. Schnellstart lokal: im Projektroot eine Datei .env oder .env.local mit VITE_OPENAI_API_KEY=sk-… anlegen und den Dev-Server neu starten. Alternativ: Supabase Edge Function recipe-suggestions deployen und dort das Secret OPENAI_API_KEY setzen, oder VITE_RECIPE_AI_PROXY_URL nutzen. Siehe .env.example.`
    );
  }

  const userContent =
    lines.length === 0
      ? "(Keine Artikel mit Bestand > 0.)"
      : lines.join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Hier ist der Bestand (Name und Menge pro Artikel):\n\n${userContent}`,
        },
      ],
    }),
  });

  const data = (await res.json()) as OpenAIResponse;

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI-Fehler (${res.status})`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Leere KI-Antwort");

  const parsed = parseDishesJson(content);
  // #region agent log
  fetch("http://127.0.0.1:7483/ingest/49a76144-1d85-45f6-bb6f-00f26476e5fe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8479dd",
    },
    body: JSON.stringify({
      sessionId: "8479dd",
      runId: "post-fix",
      hypothesisId: "verify-openai",
      location: "recipe-ai.ts:openaiSuccess",
      message: "OpenAI direct path returned dishes",
      data: { dishCount: parsed.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return parsed;
}
