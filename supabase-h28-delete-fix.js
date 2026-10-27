/* HORNO 28 - Eliminar ventas y movimientos (POS y Libro Diario) de forma consistente.
   - Eliminar una venta: borra la venta, sus productos, su ingreso en caja y devuelve los insumos al inventario.
   - Eliminar un movimiento ligado a una venta: elimina la venta completa (evita que "reaparezca").
   - Eliminar un movimiento manual: borra el movimiento y confirma que realmente se borró.
   Cargar al FINAL de los scripts (después de supabase-realtime.js). */
(function () {
  'use strict';
  const TAG = '[H28-DELETE]';
  const db = () => window.horno28Supabase;
  const biz = () => window.HORNO28_CURRENT_BUSINESS_ID;
  const notify = (m, t) => (typeof window.showNotification === 'function' ? window.showNotification(m, t || 'success') : alert(m));

  async function refreshAll() {
    const calls = [window.HORNO28_REFRESH_POS, window.HORNO28_LOAD_INVENTORY_CLOUD, window.HORNO28_REFRESH_TREASURY];
    for (const fn of calls) {
      try { if (typeof fn === 'function') await fn(); } catch (e) { console.warn(TAG, e); }
    }
    try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (_) {}
  }

  async function deleteSale(saleId) {
    if (!saleId) return;
    if (!db() || !biz()) return notify('Inicia sesión para continuar.', 'error');
    if (!confirm('¿Eliminar esta venta definitivamente?\n\nSe borrará la factura y su ingreso en el Libro Diario, y los insumos volverán al inventario.\nSi solo quieres devolver el dinero, usa "Devolución".')) return;
    const { error } = await db().rpc('delete_pos_sale', { p_business_id: biz(), p_sale_id: saleId });
    if (error) {
      console.error(TAG, error);
      return notify('No se pudo eliminar la venta: ' + (error.message || error), 'error');
    }
    await refreshAll();
    notify('Venta eliminada. Inventario y caja actualizados.');
  }

  async function deleteTransaction(txId) {
    if (!db() || !biz()) return notify('Inicia sesión para continuar.', 'error');
    const { data: row, error: e0 } = await db().from('cash_transactions').select('id,sale_id,reference,category').eq('id', txId).eq('business_id', biz()).maybeSingle();
    if (e0) return notify('No se pudo leer el movimiento: ' + e0.message, 'error');
    if (!row) { await refreshAll(); return notify('Ese movimiento ya no existe.', 'error'); }
    if (row.sale_id) return deleteSale(row.sale_id);
    if (!confirm('¿Eliminar definitivamente este movimiento?')) return;
    const { data, error } = await db().from('cash_transactions').delete().eq('id', txId).eq('business_id', biz()).select('id');
    if (error) return notify('No se pudo eliminar el movimiento: ' + error.message, 'error');
    if (!data || !data.length) return notify('El movimiento NO se eliminó (sin permiso).', 'error');
    await refreshAll();
    notify('Movimiento eliminado.');
  }

  function install() {
    window.HORNO28_DELETE_SALE = deleteSale;
    window.deleteSale = deleteSale;
    window.HORNO28_DELETE_TRANSACTION = deleteTransaction;
  }
  install();
  window.addEventListener('load', install);
  setTimeout(install, 1500);
  console.info(TAG, 'activo.');
})();
