import { createClient } from "./client";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : {}),
  };
}