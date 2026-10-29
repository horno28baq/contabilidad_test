/* HORNO 28 - Factura digital / impresión de recibo (papel térmico 58 mm u 80 mm)
   - Vista previa en tiempo real antes de registrar (botón en el POS).
   - Imprimir una factura ya registrada (botón de impresora en el historial del POS).
   - Hora siempre en Colombia (America/Bogota).
   Logo: por defecto se dibuja con texto. Si tienes una imagen, define window.HORNO28_LOGO_URL (ruta o data URL). */
(function () {
  'use strict';
  const TZ = 'America/Bogota';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  const PAY = { cash: 'EFECTIVO', nequi: 'NEQUI / TRANSFERENCIA', transfer: 'TRANSFERENCIA', llave: 'LLAVE', card: 'TARJETA / DATÁFONO', daviplata: 'DAVIPLATA', other: 'OTRO' };
  const payLabel = (v) => PAY[String(v || '').toLowerCase()] || String(v || '-').toUpperCase();
  const comboRe = /combo|premio/i;
  let paperMM = (() => { try { return localStorage.getItem('h28_paper_mm') === '80' ? 80 : 58; } catch (_) { return 58; } })();
  let tick = null;

  const when = (d) => ({
    date: d.toLocaleDateString('es-CO', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true })
  });

  const RECEIPT_CSS = `
    .h28-receipt{background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.25;padding:2mm 1mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .h28-receipt *{box-sizing:border-box}
    .r-logo{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:2px}
    .r-logo img{max-width:100%;max-height:18mm}
    .r-box{background:#000;color:#fff;font-weight:900;font-size:19px;padding:1px 6px;border-radius:4px;letter-spacing:1px}
    .r-name{font-weight:900;font-size:19px;letter-spacing:2px}
    .r-center{text-align:center}
    .r-sep{border-top:1px dashed #000;margin:5px 0}
    .r-row{display:flex;justify-content:space-between;gap:6px}
    .r-row b{font-weight:700}
    .r-item{margin:3px 0}
    .r-item .n{font-weight:700;word-break:break-word}
    .r-item .d{display:flex;justify-content:space-between;font-size:10px}
    .r-total{font-size:16px;font-weight:900;margin-top:2px}
    .r-motto{font-style:italic;font-size:10px;text-align:center;margin-top:5px}
    .r-thanks{text-align:center;font-weight:700;margin-top:5px}
    .r-tag{display:inline-block;border:1px solid #000;padding:0 4px;font-weight:700;font-size:10px;border-radius:3px}
    .r-warn{text-align:center;font-weight:900;border:1px solid #000;padding:2px;margin:4px 0}`;

  function receiptHTML(d) {
    const logo = window.HORNO28_LOGO_URL
      ? `<img src="${esc(window.HORNO28_LOGO_URL)}" alt="HORNO 28">`
      : '<span class="r-box">28</span><span class="r-name">HORNO</span>';
    const items = d.items.map((i) => `
      <div class="r-item">
        <div class="n">${esc(i.name)}</div>
        <div class="d"><span>${Number(i.qty) || 0} × ${money(i.unit)}</span><span><b>${money(i.total)}</b></span></div>
      </div>`).join('');
    return `<div class="h28-receipt">
      <div class="r-logo">${logo}</div>
      <div class="r-center" style="font-size:9px;letter-spacing:1px">HORNO 28</div>
      <div class="r-sep"></div>
      ${d.preview ? '<div class="r-warn">VISTA PREVIA · SIN VALIDEZ</div>' : ''}
      ${d.refunded ? '<div class="r-warn">*** FACTURA DEVUELTA ***</div>' : ''}
      <div class="r-row"><span>Factura</span><b>${esc(d.number)}</b></div>
      <div class="r-row"><span>Fecha</span><b>${esc(d.date)}</b></div>
      <div class="r-row"><span>Hora</span><b>${esc(d.time)}</b></div>
      <div class="r-row"><span>Cliente</span><b>${esc(d.customer || 'Sin nombre')}</b></div>
      <div class="r-row"><span>Tipo</span><span class="r-tag">${esc(d.kind)}</span></div>
      <div class="r-sep"></div>
      ${items || '<div class="r-center">Sin productos</div>'}
      <div class="r-sep"></div>
      <div class="r-row"><span>Subtotal</span><span>${money(d.subtotal)}</span></div>
      ${d.discount > 0 ? `<div class="r-row"><span>Descuento</span><span>-${money(d.discount)}</span></div>` : ''}
      ${d.delivery > 0 ? `<div class="r-row"><span>Domicilio</span><span>+${money(d.delivery)}</span></div>` : ''}
      <div class="r-row r-total"><span>TOTAL</span><span>${money(d.total)}</span></div>
      <div class="r-row" style="margin-top:3px"><span>Pago</span><b>${esc(d.method)}</b></div>
      <div class="r-sep"></div>
      <div class="r-motto">Impulsados por fuego…<br>A máxima velocidad</div>
      <div class="r-thanks">¡Gracias por tu compra!<br>¡Te veremos pronto!</div>
    </div>`;
  }

  const printable = () => (paperMM === 80 ? 72 : 48);

  function printDoc(html) {
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura HORNO 28</title>
      <style>@page{size:${paperMM}mm auto;margin:0}html,body{margin:0;padding:0;background:#fff}
      .h28-receipt{width:${printable()}mm;margin:0 auto}${RECEIPT_CSS}</style></head><body>${html}</body></html>`;
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    const w = f.contentWindow;
    w.document.open(); w.document.write(doc); w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); }
      catch (e) { notify('No se pudo abrir la impresión: ' + (e.message || e), 'error'); }
      setTimeout(() => f.remove(), 60000);
    }, 350);
  }

  /* ---------- datos ---------- */
  function previewData() {
    const items = (Array.isArray(cart) ? cart : []).map((i) => ({ name: i.name, qty: Number(i.qty) || 0, unit: Number(i.price) || 0, total: (Number(i.price) || 0) * (Number(i.qty) || 0) }));
    const a = typeof calculatePOSAmounts === 'function' ? calculatePOSAmounts() : { subtotal: 0, discount: 0, delivery: 0, total: 0 };
    const combos = (Array.isArray(cart) ? cart : []).filter((i) => comboRe.test(i.category || '')).length;
    const n = (Array.isArray(cart) ? cart : []).length;
    const sel = $('pos-payment-method');
    const w = when(new Date());
    return { preview: true, number: 'Se asigna al registrar', date: w.date, time: w.time,
      customer: ($('pos-customer-name') || {}).value ? $('pos-customer-name').value.trim() : '',
      kind: !n || combos === 0 ? 'REGULAR' : combos === n ? 'COMBO' : 'MIXTO',
      items, subtotal: a.subtotal, discount: a.discount, delivery: a.delivery || 0, total: a.total,
      method: sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.trim() : '-' };
  }

  function saleData(s) {
    const rs = (typeof recipes !== 'undefined' && Array.isArray(recipes)) ? recipes : [];
    const its = s.items || [];
    const combos = its.filter((i) => { const r = rs.find((x) => String(x.id) === String(i.recipe_id)); return r && comboRe.test(r.category || ''); }).length;
    const w = when(new Date(s.sale_date || s.created_at || Date.now()));
    return { number: '#' + (s.sale_number ?? ''), date: w.date, time: w.time, customer: s.customer_name || '',
      kind: !its.length || combos === 0 ? 'REGULAR' : combos === its.length ? 'COMBO' : 'MIXTO',
      items: its.map((i) => ({ name: i.product_name || i.name || 'Producto', qty: Number(i.quantity) || 0, unit: Number(i.unit_price) || 0,
        total: Number(i.total) || ((Number(i.quantity) || 0) * (Number(i.unit_price) || 0)) })),
      subtotal: Number(s.subtotal) || 0, discount: Number(s.discount) || 0, delivery: Number(s.delivery_fee) || 0, total: Number(s.total) || 0,
      method: payLabel(s.payment_method), refunded: ['cancelled', 'refunded'].includes(String(s.status || '').toLowerCase()) };
  }

  /* ---------- vista previa ---------- */
  function renderPreview() {
    const box = $('h28-inv-paper');
    if (!box) return;
    box.style.width = printable() + 'mm';
    box.innerHTML = receiptHTML(previewData());
  }

  function openPreview() {
    if (!Array.isArray(cart) || !cart.length) return notify('Agrega productos a la orden para ver la factura.', 'error');
    const old = $('h28-inv-modal'); if (old) old.remove();
    const m = document.createElement('div');
    m.id = 'h28-inv-modal';
    m.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[65] flex items-center justify-center p-3';
    m.innerHTML = `
      <style>${RECEIPT_CSS}</style>
      <div class="bg-carbon border border-carbonBorder rounded-2xl w-full max-w-sm max-h-[94vh] flex flex-col shadow-2xl">
        <div class="flex justify-between items-center px-4 py-3 border-b border-carbonBorder">
          <h3 class="font-teko text-xl font-bold uppercase tracking-wider text-white"><i class="fa-solid fa-receipt text-gold mr-2"></i>Vista previa de la factura</h3>
          <button type="button" id="h28-inv-x" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="px-4 pt-3 flex items-center justify-between text-xs text-gray-300">
          <span>Papel de la impresora:</span>
          <span class="space-x-1">
            <button type="button" id="h28-inv-58" class="px-3 py-1 rounded-lg border border-carbonBorder font-bold">58 mm</button>
            <button type="button" id="h28-inv-80" class="px-3 py-1 rounded-lg border border-carbonBorder font-bold">80 mm</button>
          </span>
        </div>
        <div class="overflow-y-auto p-4 flex-1" style="background:#2b2f36">
          <div id="h28-inv-paper" style="margin:0 auto;box-shadow:0 4px 18px #0008"></div>
        </div>
        <div class="flex justify-between items-center gap-2 px-4 py-3 border-t border-carbonBorder">
          <button type="button" id="h28-inv-test" class="px-3 py-2 bg-carbonLight text-gray-200 rounded-lg text-xs font-bold"><i class="fa-solid fa-print mr-1"></i>Imprimir prueba</button>
          <button type="button" id="h28-inv-close" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg text-xs tracking-wider uppercase">Cerrar</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const mark = () => ['58', '80'].forEach((v) => { const b = $('h28-inv-' + v); const on = Number(v) === paperMM; b.style.background = on ? '#f3b61f' : 'transparent'; b.style.color = on ? '#000' : '#ddd'; });
    const setPaper = (mm) => { paperMM = mm; try { localStorage.setItem('h28_paper_mm', String(mm)); } catch (_) {} mark(); renderPreview(); };
    const close = () => { clearInterval(tick); tick = null; m.remove(); };
    $('h28-inv-x').onclick = $('h28-inv-close').onclick = close;
    $('h28-inv-58').onclick = () => setPaper(58);
    $('h28-inv-80').onclick = () => setPaper(80);
    $('h28-inv-test').onclick = () => printDoc(receiptHTML(previewData()));
    mark(); renderPreview();
    clearInterval(tick);
    tick = setInterval(() => { if (!$('h28-inv-modal')) { clearInterval(tick); tick = null; return; } renderPreview(); }, 700);
  }

  /* ---------- imprimir una factura registrada ---------- */
  function printSale(id) {
    const s = typeof window.HORNO28_GET_SALE === 'function' ? window.HORNO28_GET_SALE(id) : null;
    if (!s) return notify('No se encontró la factura. Recarga la página e inténtalo de nuevo.', 'error');
    printDoc(receiptHTML(saleData(s)));
  }

  window.HORNO28_PREVIEW_INVOICE = openPreview;
  window.HORNO28_PRINT_SALE = printSale;
})();
