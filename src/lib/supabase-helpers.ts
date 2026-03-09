import { supabase } from "@/integrations/supabase/client";

export async function fetchArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function findArticleByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .eq("barcode", barcode)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateStock(articleId: string, change: number) {
  // First get current stock
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("current_stock")
    .eq("id", articleId)
    .single();
  if (fetchError) throw fetchError;

  const newStock = Math.max(0, (article.current_stock || 0) + change);
  const { error } = await supabase
    .from("articles")
    .update({ current_stock: newStock })
    .eq("id", articleId);
  if (error) throw error;
  return newStock;
}

export async function createArticle(article: {
  barcode: string;
  name: string;
  category_id: string;
  minimum_stock: number;
}) {
  const { data, error } = await supabase
    .from("articles")
    .insert({ ...article, current_stock: 1 })
    .select("*, categories(name)")
    .single();
  if (error) throw error;
  return data;
}
