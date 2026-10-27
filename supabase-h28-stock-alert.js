/* HORNO 28 - Ventana emergente cuando una venta se bloquea por falta de stock.
   Muestra qué insumos están agotados o no alcanzan, para avisar al cliente. */
(function () {
  'use strict';
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => { const n = Number(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('es-CO');

  async function parse(message) {
    const msg = String(message || '');
    if (!/stock insuficiente/i.test(msg)) return null;
    const items = [];
    // Formato A: "NOMBRE (disponible 300 g, se necesita 550 g); OTRO (...)"
    const reA = /([^;:]+?)\s*\(disponible\s+([\d.,]+)\s*([^,)]*),\s*se necesita\s+([\d.,]+)/gi;
    let m;
    const bodyA = msg.includes(':') ? msg.slice(msg.indexOf(':') + 1) : msg;
    while ((m = reA.exec(bodyA))) items.push({ name: m[1].trim(), have: num(m[2]), unit: (m[3] || '').trim(), need: num(m[4]) });
    // Formato B: "ingrediente <uuid>. Disponible 350.000, requerido 550.0000"
    const reB = /ingrediente\s+([0-9a-f-]{36})\.?\s*Disponible\s+([\d.,]+),?\s*requerido\s+([\d.,]+)/gi;
    const ids = [];
    while ((m = reB.exec(msg))) { ids.push(m[1]); items.push({ id: m[1], name: null, have: num(m[2]), unit: '', need: num(m[3]) }); }
    if (ids.length && db() && biz()) {
      try {
        const { data } = await db().from('ingredients').select('id,name,unit').in('id', ids);
        (data || []).forEach((d) => items.forEach((it) => { if (it.id === d.id) { it.name = d.name; it.unit = d.unit || ''; } }));
      } catch (_) {}
    }
    items.forEach((it) => { if (!it.name) it.name = it.id ? 'Insumo (' + it.id.slice(0, 8) + '…)' : 'Insumo'; });
    return items;
  }

  async function show(message) {
    const items = await parse(message);
    if (items === null) return false;
    const old = document.getElementById('h28-stock-alert'); if (old) old.remove();
    const rows = items.length
      ? items.map((i) => `<tr class="border-b border-carbonBorder/40"><td class="py-2 pr-2 font-bold text-white">${esc(i.name)}</td><td class="py-2 text-right font-mono">${fmt(i.have)} ${esc(i.unit)}</td><td class="py-2 text-right font-mono">${fmt(i.need)} ${esc(i.unit)}</td><td class="py-2 text-right font-mono text-red-400 font-bold">${fmt(Math.max(0, i.need - i.have))} ${esc(i.unit)}</td></tr>`).join('')
      : `<tr><td colspan="4" class="py-2 text-gray-300">${esc(message)}</td></tr>`;
    const m = document.createElement('div');
    m.id = 'h28-stock-alert';
    m.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
    m.innerHTML = `
      <div class="bg-carbon border border-f1Red/60 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
        <div class="flex items-center space-x-3 border-b border-carbonBorder pb-3">
          <i class="fa-solid fa-triangle-exclamation text-f1Red text-2xl"></i>
          <h3 class="font-teko text-2xl font-bold uppercase tracking-wider text-white">Venta no completada: producto agotado</h3>
        </div>
        <p class="text-gray-300 text-sm">No se puede registrar esta venta porque hay insumos agotados o insuficientes. Revisa el inventario e informa al cliente que por ahora no es posible despachar este pedido.</p>
        <table class="w-full">
          <thead><tr class="text-gray-400 uppercase text-[10px] border-b border-carbonBorder"><th class="text-left pb-1">Insumo</th><th class="text-right pb-1">Disponible</th><th class="text-right pb-1">Necesario</th><th class="text-right pb-1">Falta</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
          <button type="button" id="h28-sa-inv" class="px-4 py-2 bg-carbonLight text-gray-200 rounded-lg font-bold">Ir a Insumos</button>
          <button type="button" id="h28-sa-ok" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg tracking-wider uppercase">Entendido</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    document.getElementById('h28-sa-ok').onclick = () => m.remove();
    document.getElementById('h28-sa-inv').onclick = () => { m.remove(); if (typeof window.switchTab === 'function') window.switchTab('inventory'); };
    return true;
  }
  window.HORNO28_SHOW_STOCK_ALERT = show;
})();
