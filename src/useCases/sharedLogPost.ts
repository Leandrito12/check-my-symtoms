const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface SharedLogPostPayload {
  log_id: string;
  content: string;
  author_name?: string;
}

export interface SharedLogPostResponse {
  comment: {
    id: string;
    author_name: string | null;
    content: string;
    attachment_path: string | null;
    created_at: string;
  };
}

/**
 * Crear comentario sin adjunto. POST shared-log con JSON. No requiere auth.
 */
export async function sharedLogPost(
  payload: SharedLogPostPayload
): Promise<SharedLogPostResponse> {
  const url = `${baseUrl}/functions/v1/shared-log`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({
      log_id: payload.log_id,
      content: payload.content,
      author_name: payload.author_name ?? undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `shared-log POST: ${res.status}`);
  }
  return res.json() as Promise<SharedLogPostResponse>;
}
