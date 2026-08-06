/* Runs in <head>, before the first paint.

   The site's CSP has no 'unsafe-inline' for scripts, so this cannot be an
   inline <script>. It is deliberately tiny and render-blocking: it must
   decide whether to show the curtain BEFORE anything paints, otherwise
   returning visitors get a flash of loader on every page they click.  */
try {
  if (sessionStorage.getItem('aeroPreloaded') === '1'){
    document.documentElement.className += ' pre-seen';
  }
} catch(e){ /* storage blocked — just show it, no harm */ }
