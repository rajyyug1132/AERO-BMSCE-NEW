/* ===========================================================
   AeroBMSCE — Supabase client

   These two values are meant to be public. The publishable key
   identifies the project; it grants nothing on its own. Every table
   has Row Level Security enabled, and the policies decide what any
   given caller may read or write.

   Never put the service_role key here. It bypasses RLS entirely.

   The client is resolved lazily. Callers ask for it at the moment they
   need it rather than at page load, so a slow or blocked CDN cannot
   leave the page permanently convinced there is no backend. If the SDK
   is still missing when asked, we fetch it once and wait.
=========================================================== */

window.AERO_SUPABASE = {
  url: 'https://hbugdntqbzxbgnupihah.supabase.co',
  key: 'sb_publishable_BMaPqTTXkpuEb9rtzpMw4Q_Q5tilM6p',
  sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
};

(function(){
  "use strict";

  let client = null;
  let sdkPromise = null;

  function build(){
    if (client) return client;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    client = window.supabase.createClient(
      window.AERO_SUPABASE.url,
      window.AERO_SUPABASE.key,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
    return client;
  }

  function loadSdk(){
    if (window.supabase) return Promise.resolve();
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = window.AERO_SUPABASE.sdk;
      tag.async = true;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error('SDK_BLOCKED'));
      document.head.appendChild(tag);
    });
    return sdkPromise;
  }

  /* Synchronous — returns the client only if the SDK is already present. */
  window.aeroClient = build;

  /* Asynchronous — loads the SDK first if it has not arrived yet.
     Rejects with SDK_BLOCKED when the network or an extension stops it. */
  window.aeroClientAsync = async function(){
    const ready = build();
    if (ready) return ready;
    await loadSdk();
    const built = build();
    if (!built) throw new Error('SDK_BLOCKED');
    return built;
  };
})();
