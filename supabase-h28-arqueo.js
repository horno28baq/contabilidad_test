/* HORNO 28 - ARQUEO DIARIO (Caja y Tesorería)
   Un arqueo por día, calculado con la hora de Colombia (America/Bogota, UTC-5, sin horario de verano).
   Lee ventas y movimientos de Supabase (solo lectura) y exporta un Excel (.xlsx) detallado.
   Cargar DESPUÉS de supabase-treasury.js. */
(function () {
  'use strict';
  const TAG = '[H28-ARQUEO]';
  const TZ = 'America/Bogota';
  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const $ = (id) => document.getElementById(id);
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAY = { cash: 'EFECTIVO', card: 'TARJETA / DATÁFONO', transfer: 'TRANSFERENCIA', nequi: 'NEQUI', daviplata: 'DAVIPLATA', llave: 'LLAVE', other: 'OTRO' };
  const payLabel = (v) => PAY[v] || (v ? String(v).toUpperCase() : '-');
  const today = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const timeOf = (iso) => new Date(iso).toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  let current = null;

  function dayRange(day) {
    const start = new Date(day + 'T00:00:00-05:00');
    const end = new Date(start.getTime() + 24 * 3600 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  async function computeArqueo(day) {
    if (!db() || !biz()) throw new Error('Inicia sesión para generar el arqueo.');
    const { start, end } = dayRange(day);
    const salesQ = await db().from('sales')
      .select('id,sale_number,sale_date,customer_name,payment_method,subtotal,discount,delivery_fee,total,status,sale_items(product_name,quantity)')
      .eq('business_id', biz()).gte('sale_date', start).lt('sale_date', end).order('sale_date', { ascending: true });
    if (salesQ.error) throw salesQ.error;
    const txQ = await db().from('cash_transactions')
      .select('id,transaction_date,type,category,description,amount,payment_method,sale_id,notes')
      .eq('business_id', biz()).gte('transaction_date', start).lt('transaction_date', end).order('transaction_date', { ascending: true });
    if (txQ.error) throw txQ.error;
    const sales = salesQ.data || [];
    const tx = txQ.data || [];
    const incomes = tx.filter((t) => t.type === 'income');
    const expenses = tx.filter((t) => t.type === 'expense');
    const sum = (rows) => rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const saleIncome = sum(incomes.filter((t) => t.sale_id));
    const otherIncome = sum(incomes.filter((t) => !t.sale_id));
    const totalIncome = saleIncome + otherIncome;
    const totalExpense = sum(expenses);
    const byMethod = {};
    tx.forEach((t) => {
      const k = payLabel(t.payment_method);
      byMethod[k] = byMethod[k] || { ingreso: 0, egreso: 0 };
      if (t.type === 'income') byMethod[k].ingreso += Number(t.amount) || 0;
      if (t.type === 'expense') byMethod[k].egreso += Number(t.amount) || 0;
    });
    const isReturned = (s) => ['cancelled', 'refunded'].includes(String(s.status || '').toLowerCase());
    return { day, sales, tx, incomes, expenses, saleIncome, otherIncome, totalIncome, totalExpense, net: totalIncome - totalExpense, byMethod,
      completedCount: sales.filter((s) => !isReturned(s)).length, returnedCount: sales.filter(isReturned).length, isReturned };
  }

  function ensureModal() {
    if ($('h28-arqueo-modal')) return;
    const el = document.createElement('div');
    el.id = 'h28-arqueo-modal';
    el.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4';
    el.innerHTML = `
      <div class="bg-carbon border border-carbonBorder rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-carbonBorder pb-3">
          <h3 class="font-teko text-2xl font-bold uppercase tracking-wider text-white"><i class="fa-solid fa-scale-balanced text-gold mr-2"></i>ARQUEO DIARIO</h3>
          <button type="button" id="h28-aq-close" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="text-xs">
          <label class="block text-gray-400 font-bold mb-1">Fecha del día</label>
          <input type="date" id="h28-aq-date" class="w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-gold">
        </div>
        <div id="h28-aq-body" class="space-y-3 text-xs text-gray-300"></div>
        <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
          <button type="button" id="h28-aq-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg text-xs font-bold">Cerrar</button>
          <button type="button" id="h28-aq-export" class="px-5 py-2 bg-telemetryGreen/10 border border-telemetryGreen/40 text-telemetryGreen rounded-lg text-xs font-extrabold uppercase tracking-wider"><i class="fa-solid fa-file-excel mr-1"></i>Exportar</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    $('h28-aq-close').onclick = $('h28-aq-cancel').onclick = () => el.classList.add('hidden');
    $('h28-aq-date').onchange = () => render($('h28-aq-date').value);
    $('h28-aq-export').onclick = exportExcel;
  }

  function row(label, value, cls) {
    return `<div class="flex justify-between items-center bg-asphalt p-3 rounded-xl border border-carbonBorder"><span class="font-bold uppercase text-[10px] text-gray-400">${label}</span><span class="font-teko text-2xl font-bold ${cls || 'text-white'}">${value}</span></div>`;
  }

  async function render(day) {
    const body = $('h28-aq-body');
    if (!day) { body.innerHTML = '<p class="italic text-gray-500">Selecciona una fecha.</p>'; return; }
    body.innerHTML = '<p class="italic text-gray-500">Calculando arqueo…</p>';
    try {
      const a = await computeArqueo(day);
      if ($('h28-aq-date').value !== day) return;
      current = a;
      const invoices = a.sales.length
        ? a.sales.map((s) => `<div class="flex justify-between border-b border-carbonBorder/40 py-1"><span>Factura #${esc(s.sale_number ?? '-')} · ${timeOf(s.sale_date)} · ${esc(s.customer_name || 'Sin cliente')}${a.isReturned(s) ? ' <b class="text-red-400">(DEVUELTA)</b>' : ''}</span><span class="font-mono">${cop(s.total)}</span></div>`).join('')
        : '<p class="italic text-gray-500">No hubo ventas este día.</p>';
      const exp = a.expenses.length
        ? a.expenses.map((t) => `<div class="flex justify-between border-b border-carbonBorder/40 py-1"><span>${esc(t.category || 'general')} · ${esc(t.description || '-')} · ${payLabel(t.payment_method)}</span><span class="font-mono text-red-400">-${cop(t.amount)}</span></div>`).join('')
        : '<p class="italic text-gray-500">Sin egresos este día.</p>';
      const methods = Object.keys(a.byMethod).map((k) => `<div class="flex justify-between py-1"><span>${esc(k)}</span><span class="font-mono">+${cop(a.byMethod[k].ingreso)} / -${cop(a.byMethod[k].egreso)}</span></div>`).join('') || '<p class="italic text-gray-500">Sin movimientos.</p>';
      body.innerHTML =
        row('Ventas realizadas', `${a.completedCount}${a.returnedCount ? ` <span class="text-xs text-red-400">(+${a.returnedCount} devueltas)</span>` : ''}`) +
        `<div class="bg-asphalt p-3 rounded-xl border border-carbonBorder max-h-40 overflow-y-auto">${invoices}</div>` +
        row('Ingreso (ventas)', cop(a.saleIncome), 'text-telemetryGreen') +
        (a.otherIncome ? row('Otros ingresos', cop(a.otherIncome), 'text-telemetryGreen') : '') +
        row('Egreso', '-' + cop(a.totalExpense), 'text-f1Red') +
        `<div class="bg-asphalt p-3 rounded-xl border border-carbonBorder max-h-32 overflow-y-auto">${exp}</div>` +
        row('Balance del día', cop(a.net), 'text-gold') +
        `<div class="bg-asphalt p-3 rounded-xl border border-carbonBorder"><p class="font-bold uppercase text-[10px] text-gray-400 mb-1">Por método de pago (ingreso / egreso)</p>${methods}</div>`;
    } catch (e) {
      console.error(TAG, e);
      body.innerHTML = `<p class="text-red-400">No se pudo calcular el arqueo: ${esc(e.message || e)}</p>`;
    }
  }

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = XLSX_URL;
      s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('Librería Excel no disponible.')));
      s.onerror = () => reject(new Error('No se pudo cargar la librería de Excel. Revisa tu conexión.'));
      document.head.appendChild(s);
    });
  }

  async function exportExcel() {
    if (!current) return notify('Primero selecciona un día con datos.', 'error');
    try {
      const X = await loadXLSX();
      const a = current;
      const wb = X.utils.book_new();
      const add = (name, aoa, widths) => {
        const ws = X.utils.aoa_to_sheet(aoa);
        ws['!cols'] = widths.map((w) => ({ wch: w }));
        X.utils.book_append_sheet(wb, ws, name);
      };
      add('Resumen', [
        ['HORNO 28 - ARQUEO DIARIO'], ['Fecha', a.day], [],
        ['Ventas realizadas', a.completedCount], ['Ventas devueltas', a.returnedCount],
        ['Ingreso por ventas (COP)', Math.round(a.saleIncome)], ['Otros ingresos (COP)', Math.round(a.otherIncome)],
        ['Total ingreso (COP)', Math.round(a.totalIncome)], ['Total egreso (COP)', Math.round(a.totalExpense)],
        ['Balance del día (COP)', Math.round(a.net)], [],
        ['Método de pago', 'Ingreso', 'Egreso'],
        ...Object.keys(a.byMethod).map((k) => [k, Math.round(a.byMethod[k].ingreso), Math.round(a.byMethod[k].egreso)])
      ], [30, 18, 18]);
      add('Ventas', [
        ['Factura', 'Hora', 'Cliente', 'Método', 'Productos', 'Subtotal', 'Descuento', 'Domicilio', 'Total', 'Estado'],
        ...a.sales.map((s) => [s.sale_number ?? '', timeOf(s.sale_date), s.customer_name || '', payLabel(s.payment_method),
          (s.sale_items || []).map((i) => `${Number(i.quantity) || 0}x ${i.product_name}`).join(' | '),
          Math.round(Number(s.subtotal) || 0), Math.round(Number(s.discount) || 0), Math.round(Number(s.delivery_fee) || 0), Math.round(Number(s.total) || 0), a.isReturned(s) ? 'DEVUELTA' : 'COMPLETADA'])
      ], [10, 8, 24, 20, 60, 14, 14, 14, 14, 14]);
      add('Movimientos', [
        ['Hora', 'Tipo', 'Categoría', 'Descripción', 'Método', 'Valor'],
        ...a.tx.map((t) => [timeOf(t.transaction_date), t.type === 'income' ? 'INGRESO' : 'EGRESO', t.category || '', t.description || '', payLabel(t.payment_method), Math.round((t.type === 'income' ? 1 : -1) * (Number(t.amount) || 0))])
      ], [8, 10, 18, 60, 20, 14]);
      X.writeFile(wb, `HORNO28_ARQUEO_${a.day}.xlsx`);
      notify('Arqueo exportado a Excel.');
    } catch (e) {
      console.error(TAG, e);
      notify(e.message || String(e), 'error');
    }
  }

  function openArqueo() {
    ensureModal();
    $('h28-aq-date').value = today();
    $('h28-arqueo-modal').classList.remove('hidden');
    render($('h28-aq-date').value);
  }

  function injectButton() {
    const tab = $('tab-treasury');
    if (!tab || $('h28-arqueo-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'h28-arqueo-btn';
    btn.type = 'button';
    btn.className = 'mt-4 md:mt-0 mr-2 px-4 py-2 bg-gold hover:bg-goldHover text-black text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all inline-flex items-center space-x-2';
    btn.innerHTML = '<i class="fa-solid fa-scale-balanced"></i><span>ARQUEO</span>';
    btn.onclick = openArqueo;
    const anchor = tab.querySelector('button[onclick*="openTransactionModal"]');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(btn, anchor);
    else tab.insertBefore(btn, tab.firstChild);
  }

  function start() {
    injectButton();
    const tab = $('tab-treasury');
    if (tab) new MutationObserver(() => { if (!$('h28-arqueo-btn')) injectButton(); }).observe(tab, { childList: true, subtree: true });
  }
  window.HORNO28_OPEN_ARQUEO = openArqueo;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
