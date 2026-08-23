import { createClient } from "./client";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();
    session = refreshedSession;
  }

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : {}),
  };
}