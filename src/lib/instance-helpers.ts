import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------
// --- Instanz erstellen -----------------------------------
// ---------------------------------------------------------

export async function createInstance() {
  // 6-stelligen Code generieren
  const code = Array.from({ length: 6 })
    .map(() => Math.random().toString(36)[2])
    .join("")
    .toUpperCase();

  const { data, error } = await supabase
    .from("instances")
    .insert([{ code }])
    .select("*")
    .single();

  if (error) throw error;

  return data;
}


// ---------------------------------------------------------
// --- Instanz per Code finden ------------------------------
// ---------------------------------------------------------

export async function findInstanceByCode(code: string) {
  const result: any = await (supabase as any)
    .from("instances")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (result.error) throw result.error;

  return result.data;
}

// ---------------------------------------------------------
// --- User einer Instanz zuordnen --------------------------
// ---------------------------------------------------------

export async function joinInstance(userId: string, instanceId: string) {
  const result: any = await (supabase as any)
    .from("user_instances")
    .insert([{ user_id: userId, instance_id: instanceId }])
    .select("*")
    .single();

  if (result.error) throw result.error;

  return result.data;
}

// ---------------------------------------------------------
// --- Instanzen eines Users laden --------------------------
// ---------------------------------------------------------

export async function getUserInstances(userId: string) {
  const result: any = await (supabase as any)
    .from("user_instances")
    .select("instance_id, instances(*)")
    .eq("user_id", userId);

  if (result.error) throw result.error;

  return result.data;
}

// ---------------------------------------------------------
// --- Instanz verlassen ------------------------------------
// ---------------------------------------------------------

export async function leaveInstance(userId: string, instanceId: string) {
  const result: any = await (supabase as any)
    .from("user_instances")
    .delete()
    .eq("user_id", userId)
    .eq("instance_id", instanceId);

  if (result.error) throw result.error;
}

// ---------------------------------------------------------
// --- Instanz löschen --------------------------------------
// ---------------------------------------------------------

export async function deleteInstance(instanceId: string) {
  const result: any = await (supabase as any)
    .from("instances")
    .delete()
    .eq("id", instanceId);

  if (result.error) throw result.error;
}
