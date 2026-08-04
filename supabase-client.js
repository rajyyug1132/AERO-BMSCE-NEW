/* ===========================================================
   AeroBMSCE — Supabase client

   These two values are meant to be public. The publishable key
   identifies the project; it grants nothing on its own. Every table
   has Row Level Security enabled, and the policies decide what any
   given caller may read or write.

   Never put the service_role key here. It bypasses RLS entirely.
=========================================================== */

window.AERO_SUPABASE = {
  url: 'https://hbugdntqbzxbgnupihah.supabase.co',
  key: 'sb_publishable_BMaPqTTXkpuEb9rtzpMw4Q_Q5tilM6p'
};

window.aeroClient = function(){
  if (!window.supabase) return null;
  if (!window.__aeroClient){
    window.__aeroClient = window.supabase.createClient(
      window.AERO_SUPABASE.url,
      window.AERO_SUPABASE.key,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return window.__aeroClient;
};
