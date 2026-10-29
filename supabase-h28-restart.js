/* HORNO 28 - Botón RESTART_COUNTING (Caja y Tesorería)
   Reinicia ventas, caja, devoluciones, movimientos de inventario y el contador de facturas.
   Candados: palabra REINICIAR + contraseña de acceso (verificada por Supabase) + solo rol "owner" (servidor).
   Antes de borrar: copia de seguridad dentro de la base y, si se elige, descarga de un Excel con todo. */
(function () {
  'use strict';
  const TAG = '[H28-RESTART]';
  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const $ = (id) => document.getElementById(id);
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(/[: ]/g, '-').slice(0, 16);

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = XLSX_URL;
      s.onload = () => (window.XLSX ? res(window.XLSX) : rej(new Error('Librería Excel no disponible.')));
      s.onerror = () => rej(new Error('No se pudo cargar la librería de Excel.'));
      document.head.appendChild(s);
    });
  }

  async function fetchAll(table, build) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      let q = db().from(table).select('*');
      q = build ? build(q) : q;
      const { data, error } = await q.range(from, from + 999);
      if (error) throw error;
      out.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return out;
  }

  async function exportEverything() {
    const X = await loadXLSX();
    const b = biz();
    const sales = await fetchAll('sales', (q) => q.eq('business_id', b).order('sale_date', { ascending: true }));
    const ids = new Set(sales.map((s) => s.id));
    const itemsAll = await fetchAll('sale_items', (q) => q.order('created_at', { ascending: true }));
    const items = itemsAll.filter((i) => ids.has(i.sale_id));
    const cash = await fetchAll('cash_transactions', (q) => q.eq('business_id', b).order('transaction_date', { ascending: true }));
    const returns = await fetchAll('sale_returns', (q) => q.eq('business_id', b).order('return_date', { ascending: true }));
    const numOf = new Map(sales.map((s) => [s.id, s.sale_number]));
    const wb = X.utils.book_new();
    const add = (name, rows) => X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.length ? rows : [{ info: 'Sin datos' }]), name);
    add('Ventas', sales.map((s) => ({ Factura: s.sale_number, Fecha: s.sale_date, Cliente: s.customer_name, Metodo: s.payment_method, Subtotal: s.subtotal, Descuento: s.discount, Total: s.total, Estado: s.status })));
    add('Productos', items.map((i) => ({ Factura: numOf.get(i.sale_id), Producto: i.product_name, Cantidad: i.quantity, PrecioUnit: i.unit_price, Total: i.total })));
    add('Caja', cash.map((c) => ({ Fecha: c.transaction_date, Tipo: c.type, Categoria: c.category, Descripcion: c.description, Metodo: c.payment_method, Valor: c.amount, Factura: c.sale_number, Cliente: c.customer_name })));
    add('Devoluciones', returns.map((r) => ({ Factura: r.sale_number, Fecha: r.return_date, Cliente: r.customer_name, Motivo: r.reason, Valor: r.amount, Metodo: r.payment_method, Entregado: r.delivered ? 'SI' : 'NO', InventarioRepuesto: r.restocked ? 'SI' : 'NO' })));
    X.writeFile(wb, `HORNO28_HISTORIAL_antes_de_reiniciar_${stamp()}.xlsx`);
  }

  function openModal() {
    const old = $('h28-restart-modal'); if (old) old.remove();
    const f = 'w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-f1Red';
    const m = document.createElement('div');
    m.id = 'h28-restart-modal';
    m.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
    m.innerHTML = `
      <div class="bg-carbon border border-f1Red/60 rounded-2xl max-w-md w-full p-6 space-y-3 shadow-2xl max-h-[92vh] overflow-y-auto text-xs">
        <div class="flex items-center space-x-3 border-b border-carbonBorder pb-3">
          <i class="fa-solid fa-triangle-exclamation text-f1Red text-2xl"></i>
          <h3 class="font-teko text-2xl font-bold uppercase tracking-wider text-white">RESTART_COUNTING</h3>
        </div>
        <p class="text-gray-300 text-sm">Se borrarán <b class="text-white">todas las ventas, devoluciones, movimientos de caja y de inventario</b>, y las facturas volverán a empezar en <b class="text-gold">#1</b>. Tus insumos, fichas técnicas y proveedores se conservan.</p>
        <label class="flex items-start space-x-2 text-gray-300"><input id="h28-rs-xlsx" type="checkbox" checked class="mt-0.5"><span>Descargar un Excel con todo el historial antes de reiniciar (recomendado)</span></label>
        <label class="flex items-start space-x-2 text-gray-300"><input id="h28-rs-stock" type="checkbox" class="mt-0.5"><span>Dejar también el <b>stock de todos los insumos en 0</b></span></label>
        <div><label class="block text-gray-400 font-bold mb-1">Escribe REINICIAR para confirmar</label>
          <input id="h28-rs-word" type="text" autocomplete="off" class="${f}" placeholder="REINICIAR"></div>
        <div><label class="block text-gray-400 font-bold mb-1">Tu contraseña de acceso a la app</label>
          <input id="h28-rs-pass" type="password" autocomplete="current-password" class="${f}"></div>
        <p id="h28-rs-msg" class="text-red-400 min-h-[1rem]"></p>
        <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
          <button type="button" id="h28-rs-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg font-bold">Cancelar</button>
          <button type="button" id="h28-rs-ok" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg tracking-wider uppercase opacity-50" disabled>Reiniciar todo</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const ok = $('h28-rs-ok'), word = $('h28-rs-word'), pass = $('h28-rs-pass'), msg = $('h28-rs-msg');
    const check = () => { const good = word.value.trim().toUpperCase() === 'REINICIAR' && pass.value.length > 0; ok.disabled = !good; ok.style.opacity = good ? '1' : '.5'; };
    word.oninput = pass.oninput = check;
    $('h28-rs-cancel').onclick = () => m.remove();
    ok.onclick = async () => {
      ok.disabled = true; ok.style.opacity = '.5'; msg.textContent = 'Verificando contraseña…';
      try {
        const { data: sess } = await db().auth.getSession();
        const email = sess && sess.session && sess.session.user && sess.session.user.email;
        if (!email) throw new Error('No hay una sesión activa. Inicia sesión de nuevo.');
        const re = await db().auth.signInWithPassword({ email, password: pass.value });
        if (re.error) throw new Error('Contraseña incorrecta.');
        if ($('h28-rs-xlsx').checked) { msg.textContent = 'Generando Excel del historial…'; await exportEverything(); }
        msg.textContent = 'Reiniciando…';
        const { data, error } = await db().rpc('restart_counting', { p_business_id: biz(), p_confirm: 'REINICIAR', p_reset_stock: $('h28-rs-stock').checked });
        if (error) throw error;
        m.remove();
        for (const fn of [window.HORNO28_REFRESH_POS, window.HORNO28_LOAD_INVENTORY_CLOUD, window.HORNO28_REFRESH_TREASURY]) {
          try { if (typeof fn === 'function') await fn(); } catch (_) {}
        }
        try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (_) {}
        notify(`Reinicio completo. Se respaldaron ${data.ventas} ventas y ${data.caja} movimientos de caja. La próxima factura será la #1.`);
      } catch (e) {
        console.error(TAG, e);
        msg.textContent = e.message || String(e);
        pass.value = ''; check();
      }
    };
    word.focus();
  }

  function injectButton() {
    const tab = $('tab-treasury');
    if (!tab || $('h28-restart-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'h28-restart-btn';
    btn.type = 'button';
    btn.className = 'mt-4 md:mt-0 mr-2 px-4 py-2 bg-transparent border border-f1Red text-f1Red hover:bg-f1Red hover:text-white text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all inline-flex items-center space-x-2';
    btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i><span>RESTART_COUNTING</span>';
    btn.onclick = openModal;
    const anchor = $('h28-arqueo-btn') || tab.querySelector('button[onclick*="openTransactionModal"]');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(btn, anchor);
    else tab.insertBefore(btn, tab.firstChild);
  }

  function start() {
    injectButton();
    const tab = $('tab-treasury');
    if (tab) new MutationObserver(() => { if (!$('h28-restart-btn')) injectButton(); }).observe(tab, { childList: true, subtree: true });
    setTimeout(injectButton, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
