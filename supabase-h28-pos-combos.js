/* HORNO 28 - POS: al agregar un COMBO/PREMIO se elige la bebida del inventario.
   La bebida elegida se descuenta del inventario al registrar la venta.
   Cargar DESPUÉS del script inline de index.html y de supabase-pos.js. */
(function () {
  'use strict';
  const TAG = '[H28-POS-COMBOS]';
  const $ = (id) => document.getElementById(id);
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  const isCombo = (r) => !!r && /combo|premio/i.test(r.category || '');

  async function loadDrinks() {
    if (!db() || !biz()) throw new Error('Inicia sesión para continuar.');
    const { data, error } = await db().from('ingredients').select('id,name,stock,unit,category,active')
      .eq('business_id', biz()).eq('category', 'Bebidas').order('name', { ascending: true });
    if (error) throw error;
    return (data || []).filter((d) => d.active !== false);
  }

  function addComboLine(recipe, qty, price, drink) {
    const beverageId = drink ? drink.id : null;
    const name = drink ? `${recipe.name} + ${drink.name}` : recipe.name;
    const existing = cart.find((i) => i.id === recipe.id && (i.beverageId || null) === beverageId);
    if (existing) { existing.qty += qty; existing.price = price; }
    else cart.push({ id: recipe.id, name, category: recipe.category || 'Combos/Premios', price, qty, recipeItems: recipe.items, beverageId, beverageName: drink ? drink.name : null });
    renderCart();
  }

  async function askBeverage(recipe, qty, price) {
    const old = $('h28-combo-modal'); if (old) old.remove();
    let drinks = [];
    try { drinks = await loadDrinks(); } catch (e) { return notify('No se pudo cargar las bebidas: ' + (e.message || e), 'error'); }
    const m = document.createElement('div');
    m.id = 'h28-combo-modal';
    m.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    const opts = drinks.map((d) => {
      const out = !(Number(d.stock) > 0);
      return `<option value="${esc(d.id)}" ${out ? 'disabled' : ''}>${esc(d.name)} — stock ${Number(d.stock) || 0}${out ? ' (agotada)' : ''}</option>`;
    }).join('');
    m.innerHTML = `
      <div class="bg-carbon border border-carbonBorder rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
        <div class="flex justify-between items-center border-b border-carbonBorder pb-3">
          <h3 class="font-teko text-2xl font-bold uppercase tracking-wider text-white"><i class="fa-solid fa-layer-group text-gold mr-2"></i>${esc(recipe.name)}</h3>
          <button type="button" id="h28-cb-x" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-gray-400 font-bold mb-1">Cantidad de combos</label>
            <input id="h28-cb-qty" type="number" min="1" step="1" value="${qty}" class="w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white"></div>
          <div><label class="block text-gray-400 font-bold mb-1">Precio (de la ficha)</label>
            <input type="text" value="${formatCOP(price)}" disabled class="w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-gold font-bold opacity-80"></div>
        </div>
        <div><label class="block text-gray-400 font-bold mb-1">Bebida del combo (se descuenta del inventario)</label>
          <select id="h28-cb-drink" class="w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-f1Red">
            <option value="" disabled selected>-- Selecciona la bebida --</option>
            ${opts}
            <option value="__none__">Sin bebida</option>
          </select>
          ${drinks.length ? '' : '<p class="text-yellow-400 mt-2">No hay bebidas en el inventario. Créalas en Insumos con "Añadir bebida".</p>'}
        </div>
        <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
          <button type="button" id="h28-cb-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg font-bold">Cancelar</button>
          <button type="button" id="h28-cb-ok" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg tracking-wider uppercase">Agregar a la orden</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    $('h28-cb-x').onclick = $('h28-cb-cancel').onclick = close;
    $('h28-cb-ok').onclick = () => {
      const q = parseInt($('h28-cb-qty').value, 10);
      const v = $('h28-cb-drink').value;
      if (!(q > 0)) return notify('La cantidad debe ser mayor que cero.', 'error');
      if (!v) return notify('Selecciona la bebida del combo (o "Sin bebida").', 'error');
      const drink = v === '__none__' ? null : drinks.find((d) => String(d.id) === v);
      if (drink && q > Number(drink.stock)) return notify(`Stock insuficiente de ${drink.name}: hay ${Number(drink.stock)}.`, 'error');
      close();
      addComboLine(recipe, q, price, drink);
    };
  }

  function install() {
    if (typeof window.addToCart !== 'function' || typeof window.addDropdownToCart !== 'function' || window.__h28ComboInstalled) return false;
    window.__h28ComboInstalled = true;
    const origAdd = window.addToCart;
    const origDrop = window.addDropdownToCart;
    window.addToCart = function (recipeId) {
      const r = recipes.find((x) => x.id === recipeId);
      if (isCombo(r)) return askBeverage(r, 1, Number(r.price) || 0);
      return origAdd.apply(this, arguments);
    };
    window.addDropdownToCart = function () {
      const sel = $('pos-dropdown-select');
      const r = sel ? recipes.find((x) => x.id === sel.value) : null;
      if (isCombo(r)) {
        const qty = parseInt($('pos-dropdown-qty').value, 10) || 1;
        const p = parseFloat($('pos-dropdown-price').value);
        return askBeverage(r, qty, !isNaN(p) && p > 0 ? p : Number(r.price) || 0);
      }
      return origDrop.apply(this, arguments);
    };
    console.info(TAG, 'activo.');
    return true;
  }
  let tries = 0;
  const timer = setInterval(() => { tries++; if (install() || tries > 100) clearInterval(timer); }, 200);
})();
