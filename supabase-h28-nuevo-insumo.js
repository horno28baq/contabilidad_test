/* HORNO 28 - Nuevo insumo con 3 opciones: INCLUIR PRODUCTO / AÑADIR COMBO / AÑADIR BEBIDA
   Cargar DESPUÉS de supabase-inventory.js y supabase-recipes.js.
   El formulario original de "NUEVO INSUMO" NO se modifica: solo se muestra u oculta. */
(function () {
  'use strict';
  const TAG = '[H28-NUEVO-INSUMO]';
  const $ = (id) => document.getElementById(id);
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));
  const INPUT = 'w-full bg-asphalt border border-carbonBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-f1Red';
  const LABEL = 'block text-gray-400 font-bold mb-1';
  let mode = 'product';

  function parts() {
    const modal = $('modal-ingredient');
    if (!modal) return null;
    const card = modal.firstElementChild;
    return { modal, card, fields: card.querySelector('.space-y-3.text-xs'), footer: card.lastElementChild };
  }

  function ensureUI() {
    const p = parts();
    if (!p || $('h28-ni-bar')) return;
    const btn = (id, label, icon) => `<button type="button" id="${id}" class="h28-ni-btn flex-1 px-2 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border border-carbonBorder bg-asphalt text-gray-300 transition-all"><i class="fa-solid ${icon} mr-1"></i>${label}</button>`;
    const bar = document.createElement('div');
    bar.id = 'h28-ni-bar';
    bar.className = 'flex gap-2';
    bar.innerHTML = btn('h28-ni-b-product', 'Incluir producto', 'fa-box') + btn('h28-ni-b-combo', 'Añadir combo', 'fa-layer-group') + btn('h28-ni-b-drink', 'Añadir bebida', 'fa-bottle-water');
    p.fields.parentNode.insertBefore(bar, p.fields);

    const combo = document.createElement('div');
    combo.id = 'h28-ni-combo';
    combo.className = 'hidden space-y-3 text-xs';
    combo.innerHTML = `
      <div><label class="${LABEL}">Nombre del combo</label><input id="h28-c-name" type="text" placeholder="Ej: Combo Pizza + Gaseosa" class="${INPUT}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="${LABEL}">Precio de la Pizza ($ COP)</label><input id="h28-c-pizza" type="number" min="0" step="1" class="${INPUT}"></div>
        <div><label class="${LABEL}">Precio de la Bebida ($ COP)</label><input id="h28-c-drink" type="number" min="0" step="1" class="${INPUT}"></div>
      </div>
      <div class="bg-asphalt p-3 rounded-xl border border-carbonBorder flex justify-between items-center">
        <span class="text-[10px] text-gray-400 font-bold uppercase">Total del combo (automático)</span>
        <span id="h28-c-total" class="font-teko text-2xl font-bold text-gold">$0</span>
      </div>
      <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
        <button type="button" id="h28-c-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg text-xs font-bold">Cancelar</button>
        <button type="button" id="h28-c-save" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg text-xs tracking-wider uppercase f1-glow">Guardar Combo</button>
      </div>`;
    const drink = document.createElement('div');
    drink.id = 'h28-ni-drink';
    drink.className = 'hidden space-y-3 text-xs';
    drink.innerHTML = `
      <div><label class="${LABEL}">Nombre de la bebida</label><input id="h28-d-name" type="text" placeholder="Ej: Gaseosa Postobón 400ml" class="${INPUT}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="${LABEL}">Unidad de medida</label><input type="text" value="UNIDAD" disabled class="${INPUT} opacity-70 font-bold"></div>
        <div><label class="${LABEL}">Cantidad adquirida</label><input id="h28-d-qty" type="number" min="1" step="1" class="${INPUT}"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="${LABEL}">Costo total pagado ($ COP)</label><input id="h28-d-cost" type="number" min="0" step="1" class="${INPUT}"></div>
        <div><label class="${LABEL}">Stock mínimo</label><input id="h28-d-min" type="number" min="0" step="1" class="${INPUT}"></div>
      </div>
      <div><label class="${LABEL}">Precio de venta en el POS ($ COP)</label><input id="h28-d-price" type="number" min="0" step="1" class="${INPUT}"></div>
      <div class="bg-asphalt p-3 rounded-xl border border-carbonBorder flex justify-between items-center">
        <span class="text-[10px] text-gray-400 font-bold uppercase">Costo por unidad</span>
        <span id="h28-d-unit" class="font-teko text-2xl font-bold text-gold">$0</span>
      </div>
      <div class="flex justify-end space-x-2 pt-3 border-t border-carbonBorder">
        <button type="button" id="h28-d-cancel" class="px-4 py-2 bg-carbonLight text-gray-300 rounded-lg text-xs font-bold">Cancelar</button>
        <button type="button" id="h28-d-save" class="px-5 py-2 bg-f1Red text-white font-bold rounded-lg text-xs tracking-wider uppercase f1-glow">Guardar Bebida</button>
      </div>`;
    p.fields.parentNode.insertBefore(combo, p.fields);
    p.fields.parentNode.insertBefore(drink, p.fields);

    $('h28-ni-b-product').onclick = () => setMode('product');
    $('h28-ni-b-combo').onclick = () => setMode('combo');
    $('h28-ni-b-drink').onclick = () => setMode('drink');
    $('h28-c-cancel').onclick = $('h28-d-cancel').onclick = () => window.closeModal('modal-ingredient');
    const recalcCombo = () => { $('h28-c-total').textContent = cop((Number($('h28-c-pizza').value) || 0) + (Number($('h28-c-drink').value) || 0)); };
    $('h28-c-pizza').oninput = $('h28-c-drink').oninput = recalcCombo;
    const recalcDrink = () => { const q = Number($('h28-d-qty').value) || 0; $('h28-d-unit').textContent = q > 0 ? cop((Number($('h28-d-cost').value) || 0) / q) : '$0'; };
    $('h28-d-qty').oninput = $('h28-d-cost').oninput = recalcDrink;
    $('h28-c-save').onclick = saveCombo;
    $('h28-d-save').onclick = saveDrink;
  }

  function setMode(m) {
    const p = parts();
    if (!p) return;
    mode = m;
    p.fields.classList.toggle('hidden', m !== 'product');
    p.footer.classList.toggle('hidden', m !== 'product');
    $('h28-ni-combo').classList.toggle('hidden', m !== 'combo');
    $('h28-ni-drink').classList.toggle('hidden', m !== 'drink');
    [['product', 'h28-ni-b-product'], ['combo', 'h28-ni-b-combo'], ['drink', 'h28-ni-b-drink']].forEach(([k, id]) => {
      const el = $(id);
      el.classList.toggle('bg-f1Red', k === m);
      el.classList.toggle('text-white', k === m);
      el.classList.toggle('bg-asphalt', k !== m);
      el.classList.toggle('text-gray-300', k !== m);
    });
    const title = $('modal-ingredient-title');
    if (title) title.innerText = m === 'combo' ? 'AÑADIR COMBO' : m === 'drink' ? 'AÑADIR BEBIDA' : 'NUEVO INSUMO';
  }

  function resetPanels() {
    ['h28-c-name', 'h28-c-pizza', 'h28-c-drink', 'h28-d-name', 'h28-d-qty', 'h28-d-cost', 'h28-d-min', 'h28-d-price'].forEach((id) => { if ($(id)) $(id).value = ''; });
    if ($('h28-c-total')) $('h28-c-total').textContent = '$0';
    if ($('h28-d-unit')) $('h28-d-unit').textContent = '$0';
  }

  async function refreshAll() {
    try { if (typeof window.HORNO28_INVENTORY_REFRESH === 'function') await window.HORNO28_INVENTORY_REFRESH(); } catch (e) { console.warn(TAG, e); }
    try {
      if (typeof window.HORNO28_REFRESH_RECIPES === 'function') await window.HORNO28_REFRESH_RECIPES();
      else if (window.HORNO28_RECIPES && typeof window.HORNO28_RECIPES.load === 'function') await window.HORNO28_RECIPES.load();
    } catch (e) { console.warn(TAG, e); }
  }

  async function saveCombo() {
    const name = $('h28-c-name').value.trim();
    const pizza = Number($('h28-c-pizza').value);
    const drink = Number($('h28-c-drink').value);
    if (!name || !(pizza >= 0) || !(drink >= 0) || (pizza + drink) <= 0) return notify('Ingresa el nombre del combo y los precios de la pizza y la bebida.', 'error');
    if (!db() || !biz()) return notify('Inicia sesión para guardar.', 'error');
    const total = pizza + drink;
    const meta = { components: [], extraItems: [], pizzaPrice: pizza, drinkPrice: drink, source: 'inventory' };
    const { error } = await db().from('recipes').insert({
      business_id: biz(), name, category: 'Combos/Premios', yield_quantity: 1, yield_unit: 'unidad',
      selling_price: total, notes: 'H28_COMBO_META:' + JSON.stringify(meta), active: true
    });
    if (error) return notify('No se pudo guardar el combo: ' + error.message, 'error');
    window.closeModal('modal-ingredient');
    await refreshAll();
    notify('Combo guardado: ' + name + ' (' + cop(total) + '). Complétalo en Fichas Técnicas para descontar inventario.');
  }

  async function saveDrink() {
    const name = $('h28-d-name').value.trim();
    const qty = Number($('h28-d-qty').value);
    const cost = Number($('h28-d-cost').value);
    const min = Number($('h28-d-min').value) || 0;
    const price = Number($('h28-d-price').value);
    if (!name || !(qty > 0) || !(cost >= 0) || !(price > 0)) return notify('Completa nombre, cantidad, costo total y precio de venta de la bebida.', 'error');
    if (!db() || !biz()) return notify('Inicia sesión para guardar.', 'error');
    const ing = await db().from('ingredients').insert({
      business_id: biz(), name, category: 'Bebidas', unit: 'und', cost: cost / qty, stock: qty, min_stock: min, active: true
    }).select('*').single();
    if (ing.error) return notify('No se pudo guardar la bebida: ' + ing.error.message, 'error');
    const rec = await db().from('recipes').insert({
      business_id: biz(), name, category: 'Bebidas', yield_quantity: 1, yield_unit: 'unidad', selling_price: price, active: true
    }).select('id').single();
    if (rec.error) {
      await db().from('ingredients').delete().eq('id', ing.data.id).eq('business_id', biz());
      return notify('No se pudo crear la bebida en el POS: ' + rec.error.message, 'error');
    }
    const it = await db().from('recipe_items').insert({ recipe_id: rec.data.id, ingredient_id: ing.data.id, quantity: 1, unit: 'und' });
    if (it.error) {
      await db().from('recipes').delete().eq('id', rec.data.id).eq('business_id', biz());
      await db().from('ingredients').delete().eq('id', ing.data.id).eq('business_id', biz());
      return notify('No se pudo vincular la bebida al inventario: ' + it.error.message, 'error');
    }
    window.closeModal('modal-ingredient');
    await refreshAll();
    notify('Bebida guardada en inventario y POS: ' + name);
  }

  function install() {
    if (typeof window.openIngredientModal !== 'function' || window.__h28NiInstalled) return false;
    window.__h28NiInstalled = true;
    const original = window.openIngredientModal;
    window.openIngredientModal = function (id) {
      const r = original.apply(this, arguments);
      try {
        ensureUI();
        resetPanels();
        $('h28-ni-bar').classList.toggle('hidden', !!id);
        setMode('product');
      } catch (e) { console.error(TAG, e); }
      return r;
    };
    console.info(TAG, 'activo.');
    return true;
  }
  let tries = 0;
  const timer = setInterval(() => { tries++; if (install() || tries > 100) clearInterval(timer); }, 200);
})();
