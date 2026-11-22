/* HORNO 28 - Factura digital / impresión de recibo (papel térmico 58 mm u 80 mm)
   - Vista previa en tiempo real antes de registrar (botón en el POS).
   - Imprimir una factura ya registrada (botón de impresora en el historial del POS).
   - Hora siempre en Colombia (America/Bogota).
   Logo: emblema HORNO 28 en blanco y negro (optimizado para papel térmico, 58 mm y 80 mm). Para usar otra imagen define window.HORNO28_LOGO_URL (ruta o data URL). */
(function () {
  'use strict';
  /* Logo HORNO 28 en blanco y negro puro (1 bit). 288 px = 36 mm y 384 px = 48 mm a 203 dpi: 1 punto de imagen = 1 punto de impresión, sin reescalado (más nítido) */
  const LOGO_58 = 'data:image/png;base64,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';
  const LOGO_80 = 'data:image/png;base64,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';
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
    .h28-receipt{background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.25;padding:2mm 1mm;-webkit-text-stroke:0.25px #000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .h28-receipt *{box-sizing:border-box}
    .r-logo{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:2px}
    .r-logo img{display:block;height:auto;image-rendering:pixelated;image-rendering:crisp-edges}
    .r-box{background:#000;color:#fff;font-weight:900;font-size:19px;padding:1px 6px;border-radius:4px;letter-spacing:1px}
    .r-name{font-weight:900;font-size:19px;letter-spacing:2px}
    .r-center{text-align:center}
    .r-sep{border-top:1px dashed #000;margin:5px 0}
    .r-row{display:flex;justify-content:space-between;gap:6px}
    .r-row b{font-weight:700}
    .r-item{margin:3px 0}
    .r-item .n{font-weight:700;word-break:break-word}
    .r-item .d{display:flex;justify-content:space-between;font-size:11px}
    .r-total{font-size:16px;font-weight:900;margin-top:2px}
    .r-motto{font-style:italic;font-size:11px;text-align:center;margin-top:5px}
    .r-thanks{text-align:center;font-weight:700;margin-top:5px}
    .r-tag{display:inline-block;border:1px solid #000;padding:0 4px;font-weight:700;font-size:11px;border-radius:3px}
    .r-warn{text-align:center;font-weight:900;border:1px solid #000;padding:2px;margin:4px 0}`;

  function receiptHTML(d) {
    const logoSrc = window.HORNO28_LOGO_URL || (paperMM === 80 ? LOGO_80 : LOGO_58);
    const logo = `<img src="${esc(logoSrc)}" alt="HORNO 28" style="width:${paperMM === 80 ? 48 : 36}mm">`;
    const items = d.items.map((i) => `
      <div class="r-item">
        <div class="n">${esc(i.name)}</div>
        <div class="d"><span>${Number(i.qty) || 0} × ${money(i.unit)}</span><span><b>${money(i.total)}</b></span></div>
      </div>`).join('');
    return `<div class="h28-receipt">
      <div class="r-logo">${logo}</div>
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
