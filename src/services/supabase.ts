export function createSupabaseClient(url: string, publishableKey: string) {
  const sdk = window.supabase;
  if (!sdk) throw new Error("Bibliothèque Supabase indisponible. Vérifie la connexion internet.");
  return sdk.createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
