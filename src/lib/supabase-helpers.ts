import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------
// --- TYPEN ------------------------------------------------
// ---------------------------------------------------------

export type Article = {
  id: string;
  barcode: string | null;
  name: string;
  category_id: string | null;
  current_stock: number;
  minimum_stock: number;
  location: string | null;
  icon: string | null;
  instance_id: string;
  categories?: { name: string } | null;
};

export type Category = {
  id: string;
  name: string;
  instance_id: string;
};

// ---------------------------------------------------------
// --- ARTIKEL LADEN ---------------------------------------
// ---------------------------------------------------------

export async function fetchArticles(instanceId: string): Promise<Article[]> {
  const articlesTable = supabase.from("articles") as any;

  const { data, error } = await articlesTable
    .select(
      `
      id,
      barcode,
      name,
      category_id,
      current_stock,
      minimum_stock,
      location,
      icon,
      instance_id,
      categories(name)
    `
    )
    .match({ instance_id: instanceId })
    .order("name");

  if (error) throw error;
  return ((data ?? []) as unknown) as Article[];
}

// ---------------------------------------------------------
// --- KATEGORIEN LADEN ------------------------------------
// ---------------------------------------------------------

export async function fetchCategories(instanceId: string): Promise<Category[]> {
  const categoriesTable = supabase.from("categories") as any;

  const { data, error } = await categoriesTable
    .select("id, name, instance_id")
    .match({ instance_id: instanceId })
    .order("name");

  if (error) throw error;
  return ((data ?? []) as unknown) as Category[];
}

// ---------------------------------------------------------
// --- ARTIKEL PER BARCODE FINDEN --------------------------
// ---------------------------------------------------------

export async function findArticleByBarcode(
  barcode: string,
  instanceId: string
): Promise<Article | null> {
  const articlesTable = supabase.from("articles") as any;

  const { data, error } = await articlesTable
    .select(
      `
      id,
      barcode,
      name,
      category_id,
      current_stock,
      minimum_stock,
      location,
      icon,
      instance_id,
      categories(name)
    `
    )
    .match({
      barcode,
      instance_id: instanceId,
    })
    .maybeSingle();

  if (error) throw error;
  return ((data ?? null) as unknown) as Article | null;
}

// ---------------------------------------------------------
// --- BESTAND ÄNDERN --------------------------------------
// ---------------------------------------------------------

export async function updateStock(
  articleId: string,
  change: number,
  instanceId: string
): Promise<number> {
  const articlesTable = supabase.from("articles") as any;

  const { data: current, error: fetchError } = await articlesTable
    .select("current_stock")
    .match({
      id: articleId,
      instance_id: instanceId,
    })
    .single();

  if (fetchError) throw fetchError;

  const newStock = Math.max(0, (current?.current_stock ?? 0) + change);

  const { error: updateError } = await articlesTable
    .update({ current_stock: newStock })
    .match({
      id: articleId,
      instance_id: instanceId,
    });

  if (updateError) throw updateError;

  return newStock;
}

// ---------------------------------------------------------
// --- ARTIKEL ERSTELLEN -----------------------------------
// ---------------------------------------------------------

export async function createArticle(article: {
  barcode: string | null;
  name: string;
  category_id: string | null;
  current_stock: number;
  minimum_stock: number;
  location: string | null;
  icon: string | null;
  instance_id: string;
}): Promise<Article> {
  const articlesTable = supabase.from("articles") as any;

  const payload = {
    barcode: article.barcode,
    name: article.name,
    category_id: article.category_id,
    current_stock: article.current_stock,
    minimum_stock: article.minimum_stock,
    location: article.location,
    icon: article.icon,
    instance_id: article.instance_id,
  };

  const { data, error } = await articlesTable
    .insert(payload)
    .select(
      `
      id,
      barcode,
      name,
      category_id,
      current_stock,
      minimum_stock,
      location,
      icon,
      instance_id
    `
    )
    .single();

  if (error) throw error;
  return (data as unknown) as Article;
}

// ---------------------------------------------------------
// --- KATEGORIE ERSTELLEN ---------------------------------
// ---------------------------------------------------------

export async function createCategory(category: {
  name: string;
  instance_id: string;
}): Promise<Category> {
  const categoriesTable = supabase.from("categories") as any;

  const { data, error } = await categoriesTable
    .insert({
      name: category.name,
      instance_id: category.instance_id,
    })
    .select("id, name, instance_id")
    .single();

  if (error) throw error;
  return (data as unknown) as Category;
}

// ---------------------------------------------------------
// --- KATEGORIE LÖSCHEN -----------------------------------
// ---------------------------------------------------------

export async function deleteCategory(id: string, instanceId: string) {
  const categoriesTable = supabase.from("categories") as any;

  const { error } = await categoriesTable.delete().match({
    id,
    instance_id: instanceId,
  });

  if (error) throw error;
}

// ---------------------------------------------------------
// --- ARTIKEL LÖSCHEN -------------------------------------
// ---------------------------------------------------------

export async function deleteArticle(id: string, instanceId: string) {
  const articlesTable = supabase.from("articles") as any;

  const { error } = await articlesTable.delete().match({
    id,
    instance_id: instanceId,
  });

  if (error) throw error;
}