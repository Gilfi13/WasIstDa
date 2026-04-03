import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

type OpenAIResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as { lines?: unknown };
    const lines = Array.isArray(body.lines)
      ? body.lines.filter((x): x is string => typeof x === "string")
      : [];

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({
          error:
            "OPENAI_API_KEY fehlt: In Supabase Dashboard unter Edge Functions → Secrets setzen (oder lokal: supabase secrets set OPENAI_API_KEY=...).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
      return new Response(
        JSON.stringify({
          error: data.error?.message || `OpenAI-Fehler (${res.status})`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "Leere KI-Antwort" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(content) as { dishes?: unknown };
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.dishes)) {
      return new Response(
        JSON.stringify({ error: "Ungültiges Antwortformat von OpenAI" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ dishes: parsed.dishes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
