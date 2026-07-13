import { supabase } from "@/lib/supabase";

export async function logActivity(action: string, target: string, detail: string, kategori: string = "") {
  try {
    await supabase.from("ActivityLog").insert({
      id: crypto.randomUUID(),
      action,
      target,
      detail,
      kategori,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}