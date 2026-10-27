/* HORNO 28 - Sincronización en vivo (Supabase Realtime) v2
   - Escucha cambios de todas las tablas de la app y refresca solo la parte afectada.
   - Autentica el socket con la sesión del usuario (necesario por RLS).
   - Si el canal falla, reintenta solo y, mientras no esté conectado, consulta cada 20 s.
   - Al volver a la pestaña/app o recuperar internet, refresca todo.
   Diagnóstico en consola: HORNO28_REALTIME.status() */
(function () {
  'use strict';
  const TAG = '[HORNO28 Realtime]';
  const DEBOUNCE_MS = 400;
  const POLL_MS = 20000;
  let SB = null, channel = null, connected = false, retryTimer = null, pollTimer = null, retries = 0, refreshTimer = null;
  const pending = new Set();
  const businessId = () => window.HORNO28_CURRENT_BUSINESS_ID || null;
  const call = async (fn) => { if (typeof fn === 'function') await fn(); };

  const REFRESHERS = {
    inventory: () => call(window.HORNO28_LOAD_INVENTORY_CLOUD || window.HORNO28_REFRESH_INVENTORY || window.HORNO28_INVENTORY_REFRESH),
    recipes: () => call(window.HORNO28_REFRESH_RECIPES),
    providers: () => (window.HORNO28_PROVIDERS ? call(window.HORNO28_PROVIDERS.load) : null),
    parallel: () => (window.HORNO28_PARALLEL ? call(window.HORNO28_PARALLEL.load) : null),
    pos: () => call(window.HORNO28_REFRESH_POS),
    treasury: () => call(window.HORNO28_REFRESH_TREASURY)
  };

  async function runRefresh(scope) {
    try {
      const f = REFRESHERS[scope];
      if (f) await f();
      document.dispatchEvent(new CustomEvent('horno28:realtime-refresh', { detail: { scope } }));
    } catch (err) {
      console.error(TAG, 'Error refrescando', scope, err);
    }
    if (scope === 'pos' || scope === 'treasury' || scope === 'inventory') {
      try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (_) {}
    }
  }

  function scheduleRefresh(...scopes) {
    scopes.forEach((s) => pending.add(s));
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      const list = [...pending];
      pending.clear();
      list.forEach(runRefresh);
    }, DEBOUNCE_MS);
  }
  const refreshAll = () => scheduleRefresh('inventory', 'recipes', 'providers', 'parallel', 'pos', 'treasury');

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => { if (!document.hidden && !connected) refreshAll(); }, POLL_MS);
  }

  function scheduleRetry() {
    if (retryTimer) return;
    const wait = Math.min(30000, 2000 * Math.pow(2, retries++));
    console.warn(TAG, `Reconectando en ${Math.round(wait / 1000)} s…`);
    retryTimer = setTimeout(() => { retryTimer = null; unsubscribe(); subscribe(); }, wait);
  }

  function unsubscribe() {
    if (channel && SB) { try { SB.removeChannel(channel); } catch (_) {} }
    channel = null;
    window.HORNO28_REALTIME_CHANNEL = null;
  }

  async function subscribe() {
    SB = window.horno28Supabase;
    const id = businessId();
    if (!SB || !id) { setTimeout(subscribe, 1500); return; }
    if (channel && channel.__businessId === id) return;
    unsubscribe();
    try {
      const { data } = await SB.auth.getSession();
      if (data && data.session && SB.realtime && typeof SB.realtime.setAuth === 'function') SB.realtime.setAuth(data.session.access_token);
    } catch (e) { console.warn(TAG, 'No se pudo autenticar el socket:', e); }

    const f = 'business_id=eq.' + id;
    const on = (table, scopes, filtered) => {
      const cfg = { event: '*', schema: 'public', table };
      if (filtered) cfg.filter = f;
      return [cfg, () => scheduleRefresh(...scopes)];
    };
    const specs = [
      on('ingredients', ['inventory'], true),
      on('inventory_movements', ['inventory'], true),
      on('recipes', ['recipes', 'pos'], true),
      on('recipe_items', ['recipes', 'pos'], false),
      on('suppliers', ['providers'], true),
      on('supplier_products', ['providers'], false),
      on('parallel_costs', ['parallel'], true),
      on('parallel_cost_items', ['parallel'], false),
      on('sales', ['pos', 'treasury', 'inventory'], true),
      on('sale_items', ['pos'], false),
      on('sale_returns', ['pos', 'treasury'], true),
      on('cash_transactions', ['treasury'], true)
    ];
    let ch = SB.channel('horno28-db-' + id);
    specs.forEach(([cfg, handler]) => { ch = ch.on('postgres_changes', cfg, handler); });
    ch.subscribe((status, err) => {
      console.log(TAG, status, err || '');
      connected = status === 'SUBSCRIBED';
      if (connected) { retries = 0; if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') scheduleRetry();
      document.dispatchEvent(new CustomEvent('horno28:realtime-status', { detail: { status, businessId: id } }));
    });
    ch.__businessId = id;
    channel = ch;
    window.HORNO28_REALTIME_CHANNEL = ch;
  }

  window.HORNO28_REALTIME = {
    status: () => ({ connected, businessId: businessId(), channel }),
    resubscribe: () => { unsubscribe(); retries = 0; subscribe(); },
    refreshAll
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAll(); });
  window.addEventListener('focus', refreshAll);
  window.addEventListener('online', () => { window.HORNO28_REALTIME.resubscribe(); refreshAll(); });
  window.addEventListener('horno28:auth-ready', () => setTimeout(subscribe, 100));

  startPolling();
  const start = () => setTimeout(subscribe, 500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  console.log(TAG, 'v2 cargado.');
})();
