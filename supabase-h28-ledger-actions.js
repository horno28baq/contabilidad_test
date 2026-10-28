/* HORNO 28 - Libro Diario: MODIFICAR un movimiento manual (ventana propia).
   Las ventas POS se modifican con la ventana de edición de ventas del POS (HORNO28_EDIT_SALE). */
(function () {
  'use strict';
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  const METHODS = [['cash', 'EFECTIVO'], ['nequi', 'NEQUI'], ['llave', 'LLAVE'], ['transfer', 'TRANSFERENCIA'], ['card', 'TARJETA / DATÁFONO'], ['daviplata', 'DAVIPLATA'], ['other', 'OTRO']];

  async function editTransaction(id) {
    if (!db() || !biz()) return notify('Inicia sesión para continuar.', 'error');
    const { data: row, error } = await db().from('cash_transactions').select('*').eq('id', id).eq('business_id', biz()).maybeSingle();
    if (error || !row) return notify('No se pudo leer el movimiento.', 'error');
    if (row.sale_id) return typeof window.HORNO28_EDIT_SALE === 'function' ? window.HORNO28_EDIT_SALE(row.sale_id) : notify('Modifica esta venta desde el POS.', 'error');
    const old = $('h28-tx-edit'); if (old) old.remove();
    const m = document.createElement('div');
    m.id = 'h28-tx-edit';
    m.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    const f = 'w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-f1Red';
    m.innerHTML = `
      <div class="bg-carbon border border-carbonBorder rounded-2xl max-w-md w-full p-6 space-y-3 shadow-2xl text-xs">
        <div class="flex justify-between items-center border-b border-carbonBorder pb-3">
          <h3 class="font-teko text-2xl font-bold uppercase tracking-wider text-white"><i class="fa-solid fa-pen text-gold mr-2"></i>Modificar movimiento</h3>
          <button type="button" id="h28-te-x" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <p class="text-gray-400">Tipo: <b class="${row.type === 'income' ? 'text-telemetryGreen' : 'text-f1Red'}">${row.type === 'income' ? 'INGRESO' : 'EGRESO'}</b></p>
        <div><label class="block text-gray-400 font-bold mb-1">Descripción</label><input id="h28-te-desc" type="text" value="${esc(row.description)}" class="${f}"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-gray-400 font-bold mb-1">Categoría</label><input id="h28-te-cat" type="text" value="${esc(row.category)}" class="${f}"></div>
          <div><label class="block text-gray-400 font-bold mb-1">Valor ($ COP)</label><input id="h28-te-amount" type="number" min="0" step="1" value="${Number(row.amount) || 0}" class="${f}"></div>
        </div>
        <div><label class="block text-gray-400 font-bold mb-1">Método de pago</label>
          <select id="h28-te-method" class="${f}">${METHODS.map(([v, l]) => `<option value="${v}" ${v === row.payment_method ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label class="block text-gray-400 font-bold mb-1">Notas</label><input id="h28-te-notes" type="text" value="${esc(row.notes)}" class="${f}"></div>
        <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
          <button type="button" id="h28-te-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg font-bold">Cancelar</button>
          <button type="button" id="h28-te-save" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg tracking-wider uppercase">Guardar cambios</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    $('h28-te-x').onclick = $('h28-te-cancel').onclick = close;
    $('h28-te-save').onclick = async () => {
      const amount = Number($('h28-te-amount').value);
      const desc = $('h28-te-desc').value.trim();
      if (!desc || !(amount > 0)) return notify('Completa la descripción y un valor mayor que cero.', 'error');
      const { data, error: e2 } = await db().from('cash_transactions').update({
        description: desc, category: $('h28-te-cat').value.trim() || null, amount,
        payment_method: $('h28-te-method').value, notes: $('h28-te-notes').value.trim() || null, updated_at: new Date().toISOString()
      }).eq('id', id).eq('business_id', biz()).select('id');
      if (e2) return notify('No se pudo guardar: ' + e2.message, 'error');
      if (!data || !data.length) return notify('El movimiento no se modificó (sin permiso).', 'error');
      close();
      try { if (typeof window.HORNO28_REFRESH_TREASURY === 'function') await window.HORNO28_REFRESH_TREASURY(); } catch (_) {}
      try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (_) {}
      notify('Movimiento modificado.');
    };
  }
  window.HORNO28_EDIT_TRANSACTION = editTransaction;
})();
