
        // --- REALISTIC SAMPLE DATA PRE-POPULATION IN COP ---
        const DEFAULT_INGREDIENTS = [
            { id: 'ing-1', name: 'Queso Mozzarella', stock: 2500, unit: 'g', totalPaidCost: 55000, minStock: 500 },
            { id: 'ing-2', name: 'Harina 000 Alta Fuerza', stock: 25000, unit: 'g', totalPaidCost: 75000, minStock: 5000 },
            { id: 'ing-3', name: 'Salsa Marinara San Marzano', stock: 5000, unit: 'ml', totalPaidCost: 40000, minStock: 1000 },
            { id: 'ing-4', name: 'Pepperoni Sliced Premium', stock: 2000, unit: 'g', totalPaidCost: 68000, minStock: 400 },
            { id: 'ing-5', name: 'Almidón de Yuca (Pandebono)', stock: 5000, unit: 'g', totalPaidCost: 32000, minStock: 1000 },
            { id: 'ing-6', name: 'Queso Costeño Rallado', stock: 3000, unit: 'g', totalPaidCost: 48000, minStock: 600 },
            { id: 'ing-7', name: 'Caja HORNO 28 33cm', stock: 200, unit: 'und', totalPaidCost: 160000, minStock: 30 }
        ];

        const DEFAULT_RECIPES = [
            {
                id: 'rec-1',
                name: 'Pizza Pepperoni 🔱',
                category: 'Pizzas',
                price: 42000,
                items: [
                    { ingredientId: 'ing-2', quantity: 280 }, // Harina
                    { ingredientId: 'ing-1', quantity: 180 }, // Mozzarella
                    { ingredientId: 'ing-3', quantity: 100 }, // Marinara
                    { ingredientId: 'ing-4', quantity: 80 },  // Pepperoni
                    { ingredientId: 'ing-7', quantity: 1 }    // Caja
                ]
            },
            {
                id: 'rec-2',
                name: 'Calzone Paddock',
                category: 'Pizzas',
                price: 36000,
                items: [
                    { ingredientId: 'ing-2', quantity: 220 },
                    { ingredientId: 'ing-1', quantity: 150 },
                    { ingredientId: 'ing-3', quantity: 80 },
                    { ingredientId: 'ing-4', quantity: 50 }
                ]
            },
            {
                id: 'rec-3',
                name: 'Pandebono Paddock (x6)',
                category: 'Panes Varios',
                price: 18000,
                items: [
                    { ingredientId: 'ing-5', quantity: 300 },
                    { ingredientId: 'ing-6', quantity: 250 }
                ]
            },
            {
                id: 'rec-4',
                name: 'Gaseosa San Pellegrino',
                category: 'Bebidas',
                price: 8000,
                items: []
            },
            {
                id: 'rec-5',
                name: 'Combo Gran Premio (2 Pizzas + Bebida)',
                category: 'Combos/Premios',
                price: 85000,
                items: [
                    { ingredientId: 'ing-2', quantity: 560 },
                    { ingredientId: 'ing-1', quantity: 360 },
                    { ingredientId: 'ing-3', quantity: 200 },
                    { ingredientId: 'ing-4', quantity: 160 },
                    { ingredientId: 'ing-7', quantity: 2 }
                ]
            }
        ];

        const DEFAULT_SALES = [
            { id: 'sale-1', date: new Date().toISOString(), category: 'Pizzas', items: [{ name: 'Pizza Pepperoni 🔱', qty: 2, price: 42000 }], paymentMethod: 'EFECTIVO', total: 84000 }
        ];

        const DEFAULT_TRANSACTIONS = [
            { id: 'tx-1', date: new Date().toISOString(), type: 'EGRESO', concept: 'Compra Lote Queso Mozzarella (2500g)', amount: 55000 },
            { id: 'tx-2', date: new Date().toISOString(), type: 'INGRESO', concept: 'Venta POS Inicial', amount: 84000 }
        ];

        // --- GLOBAL APP STATE ---
        let ingredients = [];
        let recipes = [];
        let sales = [];
        let transactions = [];
        let cart = [];
        let selectedCategory = 'Todos';
        let salesChartInstance = null;

        // Helper: Format COP currency cleanly
        function formatCOP(amount) {
            return '$' + Math.round(amount || 0).toLocaleString('es-CO');
        }

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, character => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            })[character]);
        }

        // Helper: Calculate Unit Cost for any Ingredient
        function getUnitCost(ing) {
            if (!ing || !ing.stock || ing.stock <= 0) return 0;
            return ing.totalPaidCost / ing.stock;
        }

        // Initialize application on load
        window.onload = function() {
            loadStorageData();
            renderDashboard();
            renderPOSProducts();
            renderInventoryTable();
            renderRecipesGrid();
            renderTreasuryTable();
            initChart();
        };

        // --- DATA STORAGE HANDLERS ---
        function loadStorageData() {
            const localIng = localStorage.getItem('h28_ingredients');
            const localRec = localStorage.getItem('h28_recipes');
            const localSales = localStorage.getItem('h28_sales');
            const localTx = localStorage.getItem('h28_transactions');

            ingredients = localIng ? JSON.parse(localIng) : [...DEFAULT_INGREDIENTS];
            recipes = localRec ? JSON.parse(localRec) : [...DEFAULT_RECIPES];
            sales = localSales ? JSON.parse(localSales) : [...DEFAULT_SALES];
            transactions = localTx ? JSON.parse(localTx) : [...DEFAULT_TRANSACTIONS];

            saveStorageData();
        }

        function saveStorageData() {
            localStorage.setItem('h28_ingredients', JSON.stringify(ingredients));
            localStorage.setItem('h28_recipes', JSON.stringify(recipes));
            localStorage.setItem('h28_sales', JSON.stringify(sales));
            localStorage.setItem('h28_transactions', JSON.stringify(transactions));
        }

        // Navigation Controller
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('text-f1Red', 'bg-carbon', 'border', 'border-f1Red/30', 'shadow-md');
                btn.classList.add('text-gray-400');
            });

            const activeTab = document.getElementById(`tab-${tabId}`);
            if(activeTab) activeTab.classList.remove('hidden');

            const activeNav = document.getElementById(`nav-${tabId}`);
            if(activeNav) {
                activeNav.classList.remove('text-gray-400');
                activeNav.classList.add('text-f1Red', 'bg-carbon', 'border', 'border-f1Red/30', 'shadow-md');
            }

            document.getElementById('mobile-menu').classList.add('hidden');

            if(tabId === 'dashboard') {
                renderDashboard();
                updateChart();
            } else if(tabId === 'pos') {
                renderPOSProducts();
                renderSalesHistory();
            } else if(tabId === 'inventory') {
                renderInventoryTable();
            } else if(tabId === 'recipes') {
                renderRecipesGrid();
            } else if(tabId === 'treasury') {
                renderTreasuryTable();
            }
        }

        function toggleMobileMenu() {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        }

        function showNotification(message, type = 'success') {
            const banner = document.getElementById('notification-banner');
            const icon = document.getElementById('notif-icon');
            const msg = document.getElementById('notif-message');

            banner.className = `mb-6 p-4 rounded-xl border flex items-center justify-between transition-all duration-300 shadow-xl ${
                type === 'success' 
                    ? 'bg-emerald-950/80 border-telemetryGreen text-telemetryGreen' 
                    : 'bg-red-950/80 border-f1Red text-f1Red'
            }`;

            icon.className = `fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} text-xl`;
            msg.innerText = message;
            banner.classList.remove('hidden');

            setTimeout(() => {
                banner.classList.add('hidden');
            }, 4000);
        }

        function dismissNotification() {
            document.getElementById('notification-banner').classList.add('hidden');
        }

        // ================= 1. DASHBOARD PIT WALL LOGIC =================
        function renderDashboard() {
            const totalSalesSum = sales.reduce((acc, curr) => acc + curr.total, 0);
            const totalExpensesSum = transactions.filter(t => t.type === 'EGRESO').reduce((acc, curr) => acc + curr.amount, 0);
            const netProfit = totalSalesSum - totalExpensesSum;

            const lowStockItems = ingredients.filter(i => i.stock <= i.minStock);

            document.getElementById('dash-total-sales').innerText = formatCOP(totalSalesSum);
            document.getElementById('dash-total-expenses').innerText = formatCOP(totalExpensesSum);
            document.getElementById('dash-net-profit').innerText = formatCOP(netProfit);
            document.getElementById('dash-low-stock-count').innerText = lowStockItems.length;

            const lowStockList = document.getElementById('dash-low-stock-list');
            if(lowStockItems.length === 0) {
                lowStockList.innerHTML = `<p class="text-xs text-gray-500 italic">Todos los insumos están en niveles óptimos.</p>`;
            } else {
                lowStockList.innerHTML = lowStockItems.map(item => `
                    <div class="flex items-center justify-between p-2.5 bg-asphalt rounded-xl border border-red-500/30">
                        <div>
                            <p class="text-xs font-bold text-white">${item.name}</p>
                            <p class="text-[10px] text-gray-400">Actual: <span class="text-red-400 font-bold">${item.stock} ${item.unit}</span> (Mín: ${item.minStock} ${item.unit})</p>
                        </div>
                        <span class="px-2 py-0.5 text-[9px] font-black bg-f1Red text-white rounded">STOCK BAJO</span>
                    </div>
                `).join('');
            }
        }

        function initChart() {
            const ctx = document.getElementById('salesExpensesChart').getContext('2d');
            salesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Hoy'],
                    datasets: [
                        {
                            label: 'Ventas ($ COP)',
                            data: [0, 0, 0, 0, sales.reduce((acc, curr) => acc + curr.total, 0)],
                            borderColor: '#d4af37',
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Gastos ($ COP)',
                            data: [0, 0, 0, 0, transactions.filter(t => t.type === 'EGRESO').reduce((acc, curr) => acc + curr.amount, 0)],
                            borderColor: '#e10600',
                            backgroundColor: 'rgba(225, 6, 0, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#ffffff', font: { family: 'Montserrat' } } }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af' }, grid: { color: '#2f3242' } },
                        y: { ticks: { color: '#9ca3af' }, grid: { color: '#2f3242' } }
                    }
                }
            });
        }

        function updateChart() {
            if (!salesChartInstance) return;
            const currentTotalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
            const currentTotalExpenses = transactions.filter(t => t.type === 'EGRESO').reduce((acc, curr) => acc + curr.amount, 0);

            salesChartInstance.data.datasets[0].data[4] = currentTotalSales;
            salesChartInstance.data.datasets[1].data[4] = currentTotalExpenses;
            salesChartInstance.update();
        }

        // ================= 2. POS SPEEDWAY LOGIC =================
        function filterPOSCategory(category) {
            selectedCategory = category;
            
            document.querySelectorAll('.pos-cat-btn').forEach(btn => {
                btn.classList.remove('bg-f1Red', 'text-white', 'shadow');
                btn.classList.add('bg-carbonLight', 'text-gray-400');
            });

            const activeBtn = document.getElementById(`cat-btn-${category}`);
            if(activeBtn) {
                activeBtn.classList.remove('bg-carbonLight', 'text-gray-400');
                activeBtn.classList.add('bg-f1Red', 'text-white', 'shadow');
            }

            renderPOSProducts();
        }

        function renderPOSProducts() {
            const container = document.getElementById('pos-products-grid');
            const dropdownSelect = document.getElementById('pos-dropdown-select');

            const filteredRecipes = selectedCategory === 'Todos' 
                ? recipes 
                : recipes.filter(r => (r.category || 'Pizzas') === selectedCategory);

            // Populate Dropdown
            if(filteredRecipes.length === 0) {
                dropdownSelect.innerHTML = `<option value="">-- No hay productos en esta categoría --</option>`;
                document.getElementById('pos-dropdown-price').value = '';
            } else {
                dropdownSelect.innerHTML = filteredRecipes.map(r => `
                    <option value="${r.id}">${r.name} (${formatCOP(r.price)})</option>
                `).join('');
                syncDropdownPrice();
            }

            // Populate Product Grid Cards
            if (filteredRecipes.length === 0) {
                container.innerHTML = `<p class="col-span-full text-xs text-gray-500 py-4 italic">No hay productos en la categoría "${selectedCategory}".</p>`;
                return;
            }

            container.innerHTML = filteredRecipes.map(recipe => `
                <div onclick="addToCart('${recipe.id}')" class="bg-asphalt hover:bg-carbonLight p-4 rounded-xl border border-carbonBorder hover:border-gold cursor-pointer transition-all flex flex-col justify-between group">
                    <div>
                        <span class="text-[10px] uppercase font-bold text-gray-400 bg-carbon px-2 py-0.5 rounded border border-carbonBorder">${recipe.category || 'Pizzas'}</span>
                        <h4 class="text-xs font-bold text-white group-hover:text-gold transition-colors mt-2 line-clamp-2">${recipe.name}</h4>
                        <p class="text-[10px] text-gray-400 mt-1">${recipe.items.length} insumos escandallados</p>
                    </div>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="font-teko text-2xl font-extrabold text-gold">${formatCOP(recipe.price)}</span>
                        <span class="w-7 h-7 bg-f1Red group-hover:bg-f1RedHover text-white rounded-lg flex items-center justify-center text-xs shadow"><i class="fa-solid fa-plus"></i></span>
                    </div>
                </div>
            `).join('');
        }

        function syncDropdownPrice() {
            const dropdownSelect = document.getElementById('pos-dropdown-select');
            const selectedId = dropdownSelect.value;
            const rec = recipes.find(r => r.id === selectedId);
            if(rec) {
                document.getElementById('pos-dropdown-price').value = rec.price;
            } else {
                document.getElementById('pos-dropdown-price').value = '';
            }
        }

        function addDropdownToCart() {
            const selectedId = document.getElementById('pos-dropdown-select').value;
            const qty = parseInt(document.getElementById('pos-dropdown-qty').value) || 1;
            const overridePrice = parseFloat(document.getElementById('pos-dropdown-price').value);

            const recipe = recipes.find(r => r.id === selectedId);
            if (!recipe) {
                showNotification('Selecciona un producto válido.', 'error');
                return;
            }

            const salePrice = (!isNaN(overridePrice) && overridePrice > 0) ? overridePrice : recipe.price;

            const existing = cart.find(item => item.id === recipe.id);
            if (existing) {
                existing.qty += qty;
                existing.price = salePrice;
            } else {
                cart.push({ id: recipe.id, name: recipe.name, category: recipe.category || 'Pizzas', price: salePrice, qty: qty, recipeItems: recipe.items });
            }
            renderCart();
        }

        function addToCart(recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;

            const existing = cart.find(item => item.id === recipe.id);
            if (existing) {
                existing.qty++;
            } else {
                cart.push({ id: recipe.id, name: recipe.name, category: recipe.category || 'Pizzas', price: recipe.price, qty: 1, recipeItems: recipe.items });
            }
            renderCart();
        }

        function addManualToCart() {
            const nameInput = document.getElementById('pos-manual-name');
            const priceInput = document.getElementById('pos-manual-price');

            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value);

            if(!name || isNaN(price) || price <= 0) {
                showNotification('Ingresa un nombre y precio válido.', 'error');
                return;
            }

            cart.push({ id: 'manual-' + Date.now(), name: name, category: 'Varios', price: price, qty: 1, recipeItems: [] });
            nameInput.value = '';
            priceInput.value = '';
            renderCart();
        }

        function calculatePOSAmounts() {
            const subtotal = Array.isArray(cart)
                ? cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0)
                : 0;
            const discountInput = document.getElementById('pos-discount-percent');
            const rawPercent = discountInput ? Number(discountInput.value) : 0;
            const discountPercent = Number.isFinite(rawPercent) ? Math.min(100, Math.max(0, rawPercent)) : 0;
            const discount = Math.round(subtotal * discountPercent / 100);
            return { subtotal, discountPercent, discount, total: Math.max(0, subtotal - discount) };
        }

        function updatePOSSummary() {
            const amounts = calculatePOSAmounts();
            const subtotalEl = document.getElementById('pos-cart-subtotal');
            const discountEl = document.getElementById('pos-cart-discount');
            const totalEl = document.getElementById('pos-cart-total');
            if (subtotalEl) subtotalEl.innerText = formatCOP(amounts.subtotal);
            if (discountEl) discountEl.innerText = '-' + formatCOP(amounts.discount);
            if (totalEl) totalEl.innerText = formatCOP(amounts.total);
            return amounts;
        }

        function renderCart() {
            const container = document.getElementById('pos-cart-items');
            if (!container) return;
            if (cart.length === 0) {
                container.innerHTML = `<p class="text-center text-xs text-gray-500 py-8 italic">No hay productos en la orden actual.</p>`;
                updatePOSSummary();
                return;
            }

            container.innerHTML = cart.map((item, index) => {
                const subtotal = item.price * item.qty;
                return `
                    <div class="flex items-center justify-between p-2.5 bg-asphalt rounded-xl border border-carbonBorder">
                        <div class="flex-grow pr-2">
                            <p class="text-xs font-bold text-white">${item.name}</p>
                            <p class="text-[10px] text-gold font-semibold">${formatCOP(item.price)} x ${item.qty} = ${formatCOP(subtotal)}</p>
                        </div>
                        <div class="flex items-center space-x-1">
                            <button onclick="updateCartQty(${index}, -1)" class="w-6 h-6 bg-carbonLight text-gray-300 rounded hover:bg-carbonBorder flex items-center justify-center font-bold text-xs">-</button>
                            <span class="text-xs font-bold px-1.5">${item.qty}</span>
                            <button onclick="updateCartQty(${index}, 1)" class="w-6 h-6 bg-carbonLight text-gray-300 rounded hover:bg-carbonBorder flex items-center justify-center font-bold text-xs">+</button>
                            <button onclick="removeFromCart(${index})" class="w-6 h-6 text-red-400 hover:text-f1Red ml-1 flex items-center justify-center text-xs"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `;
            }).join('');

            updatePOSSummary();
        }

        function updateCartQty(index, change) {
            cart[index].qty += change;
            if(cart[index].qty <= 0) cart.splice(index, 1);
            renderCart();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            renderCart();
        }

        function clearCart() {
            cart = [];
            renderCart();
        }

        function processSale() {
            if(cart.length === 0) {
                showNotification('La orden está vacía.', 'error');
                return;
            }

            const paymentMethod = document.getElementById('pos-payment-method').value;
            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

            // Deduct raw material inventory automatically based on Escandallo
            cart.forEach(cartItem => {
                if(cartItem.recipeItems && cartItem.recipeItems.length > 0) {
                    cartItem.recipeItems.forEach(rItem => {
                        const ing = ingredients.find(i => i.id === rItem.ingredientId);
                        if(ing) {
                            ing.stock = Math.max(0, ing.stock - (rItem.quantity * cartItem.qty));
                        }
                    });
                }
            });

            // Primary Category Badge for History
            const primaryCategory = cart[0]?.category || 'Varios';

            // Register Sale
            const newSale = {
                id: 'sale-' + Date.now(),
                date: new Date().toISOString(),
                category: primaryCategory,
                items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
                paymentMethod: paymentMethod,
                total: total
            };

            sales.unshift(newSale);

            // Register Treasury Income
            transactions.unshift({
                id: 'tx-' + Date.now(),
                date: new Date().toISOString(),
                type: 'INGRESO',
                concept: `Venta POS: ${cart.map(c => `${c.qty}x ${c.name}`).join(', ')}`,
                amount: total
            });

            saveStorageData();
            clearCart();
            renderSalesHistory();
            renderInventoryTable();
            renderDashboard();
            showNotification(`Venta registrada exitosamente: ${formatCOP(total)}. Insumos descontados del inventario.`);
        }

        function renderSalesHistory() {
            const tbody = document.getElementById('pos-history-tbody');
            if(sales.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-gray-500 italic">No hay historial de ventas.</td></tr>`;
                return;
            }

            tbody.innerHTML = sales.map(s => {
                const dateFormatted = new Date(s.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
                const itemSummary = s.items.map(i => `${i.qty}x ${i.name}`).join('<br>');
                const totalQty = s.items.reduce((acc, i) => acc + i.qty, 0);

                return `
                    <tr class="hover:bg-asphalt/50">
                        <td class="p-3 font-mono text-[11px] text-gray-400">${dateFormatted}</td>
                        <td class="p-3 text-gray-200">${escapeHTML(s.customerName || '—')}</td>
                        <td class="p-3"><span class="px-2 py-0.5 bg-carbonLight text-gold rounded border border-gold/30 text-[10px] font-bold">${s.category || 'Pizzas'}</span></td>
                        <td class="p-3 font-medium text-white">${itemSummary}</td>
                        <td class="p-3 font-bold text-center">${totalQty}</td>
                        <td class="p-3"><span class="px-2 py-0.5 bg-carbonLight text-gray-300 rounded border border-carbonBorder text-[10px] font-bold">${s.paymentMethod}</span></td>
                        <td class="p-3 text-right text-telemetryGreen">${formatCOP(s.discount || 0)}</td>
                        <td class="p-3 text-right font-teko text-xl font-bold text-gold">${formatCOP(s.total)}</td>
                        <td class="p-3 text-center">
                            <button onclick="deleteSale('${s.id}')" class="text-red-400 hover:text-f1Red p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function deleteSale(saleId) {
            if(confirm('¿Deseas eliminar este registro de venta?')) {
                sales = sales.filter(s => s.id !== saleId);
                saveStorageData();
                renderSalesHistory();
                renderDashboard();
                showNotification('Registro de venta eliminado.');
            }
        }

        // ================= 3. INVENTORY & COSTING LOGIC =================
        function calculateModalUnitCost() {
            const stock = parseFloat(document.getElementById('ing-stock').value) || 0;
            const totalCost = parseFloat(document.getElementById('ing-total-cost').value) || 0;
            const unit = document.getElementById('ing-unit').value;

            if (stock > 0 && totalCost > 0) {
                const unitCost = totalCost / stock;
                document.getElementById('modal-unit-cost-preview').innerText = `${formatCOP(unitCost)} COP / ${unit}`;
            } else {
                document.getElementById('modal-unit-cost-preview').innerText = `$0 COP / unidad`;
            }
        }

        function renderInventoryTable() {
            const tbody = document.getElementById('inventory-tbody');
            if(ingredients.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-gray-500 italic">No hay insumos registrados.</td></tr>`;
                document.getElementById('inv-total-value').innerText = '$0 COP';
                document.getElementById('inv-total-count').innerText = '0';
                document.getElementById('inv-alert-count').innerText = '0';
                return;
            }

            let grandTotalInventoryValue = 0;
            let alertCount = 0;

            tbody.innerHTML = ingredients.map(ing => {
                const isLow = ing.stock <= ing.minStock;
                if(isLow) alertCount++;

                const unitCost = getUnitCost(ing);
                const currentInventoryValue = ing.stock * unitCost;
                grandTotalInventoryValue += currentInventoryValue;

                return `
                    <tr class="hover:bg-asphalt/50">
                        <td class="p-3 font-bold text-white">${ing.name}</td>
                        <td class="p-3 font-mono text-sm ${isLow ? 'text-f1Red font-bold' : 'text-emerald-400'}">${ing.stock.toLocaleString('es-CO')}</td>
                        <td class="p-3 uppercase font-bold text-gray-400 text-[10px]"><span class="bg-carbonLight px-2 py-1 rounded border border-carbonBorder">${ing.unit}</span></td>
                        <td class="p-3 text-right font-mono text-gray-300">${formatCOP(ing.totalPaidCost || 0)}</td>
                        <td class="p-3 text-right font-mono font-bold text-gold">${formatCOP(unitCost)} / ${ing.unit}</td>
                        <td class="p-3 text-right font-mono font-bold text-emerald-400">${formatCOP(currentInventoryValue)}</td>
                        <td class="p-3 font-mono text-gray-400">${ing.minStock.toLocaleString('es-CO')}</td>
                        <td class="p-3">
                            <span class="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                isLow ? 'bg-f1Red/20 text-f1Red border border-f1Red/40 animate-pulse' : 'bg-emerald-500/10 text-telemetryGreen border border-emerald-500/30'
                            }">
                                ${isLow ? 'STOCK BAJO' : 'OK / OPTIMO'}
                            </span>
                        </td>
                        <td class="p-3 text-center space-x-2">
                            <button onclick="editIngredient('${ing.id}')" class="text-gray-300 hover:text-gold p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteIngredient('${ing.id}')" class="text-red-400 hover:text-f1Red p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            document.getElementById('inv-total-value').innerText = formatCOP(grandTotalInventoryValue);
            document.getElementById('inv-total-count').innerText = ingredients.length;
            document.getElementById('inv-alert-count').innerText = alertCount;
        }

        function openIngredientModal(id = null) {
            document.getElementById('ing-id').value = id || '';
            document.getElementById('ing-name').value = '';
            document.getElementById('ing-stock').value = '';
            document.getElementById('ing-total-cost').value = '';
            document.getElementById('ing-min').value = '';

            if(id) {
                const ing = ingredients.find(i => i.id === id);
                if(ing) {
                    document.getElementById('modal-ingredient-title').innerText = 'EDITAR INSUMO';
                    document.getElementById('ing-name').value = ing.name;
                    document.getElementById('ing-stock').value = ing.stock;
                    document.getElementById('ing-unit').value = ing.unit;
                    document.getElementById('ing-total-cost').value = ing.totalPaidCost || 0;
                    document.getElementById('ing-min').value = ing.minStock;
                }
            } else {
                document.getElementById('modal-ingredient-title').innerText = 'NUEVO INSUMO';
            }

            calculateModalUnitCost();
            document.getElementById('modal-ingredient').classList.remove('hidden');
        }

        function saveIngredient() {
            const id = document.getElementById('ing-id').value;
            const name = document.getElementById('ing-name').value.trim();
            const stock = parseFloat(document.getElementById('ing-stock').value);
            const unit = document.getElementById('ing-unit').value;
            const totalPaidCost = parseFloat(document.getElementById('ing-total-cost').value);
            const minStock = parseFloat(document.getElementById('ing-min').value);

            if(!name || isNaN(stock) || stock <= 0 || isNaN(totalPaidCost) || totalPaidCost <= 0 || isNaN(minStock)) {
                showNotification('Por favor ingresa valores válidos para el insumo.', 'error');
                return;
            }

            if(id) {
                const ing = ingredients.find(i => i.id === id);
                if(ing) {
                    ing.name = name;
                    ing.stock = stock;
                    ing.unit = unit;
                    ing.totalPaidCost = totalPaidCost;
                    ing.minStock = minStock;
                }
            } else {
                ingredients.push({
                    id: 'ing-' + Date.now(),
                    name, stock, unit, totalPaidCost, minStock
                });
            }

            saveStorageData();
            closeModal('modal-ingredient');
            renderInventoryTable();
            renderRecipesGrid();
            renderDashboard();
            showNotification('Insumo guardado con cálculo automático de costo unitario.');
        }

        function editIngredient(id) {
            openIngredientModal(id);
        }

        function deleteIngredient(id) {
            if(confirm('¿Deseas eliminar este insumo? Se actualizarán las fichas técnicas.')) {
                ingredients = ingredients.filter(i => i.id !== id);
                saveStorageData();
                renderInventoryTable();
                renderRecipesGrid();
                renderDashboard();
                showNotification('Insumo eliminado.');
            }
        }

        // ================= 4. ESCANDALLOS & RECIPE BUILDER =================
        function renderRecipesGrid() {
            const grid = document.getElementById('recipes-grid');
            if(recipes.length === 0) {
                grid.innerHTML = `<p class="col-span-full text-center text-xs text-gray-500 py-8 italic">No hay fichas técnicas creadas. Haz clic en "Crear Ficha Técnica".</p>`;
                return;
            }

            grid.innerHTML = recipes.map(recipe => {
                let recipeCostPrimo = 0;
                const itemsList = recipe.items.map(item => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const unitCost = ing ? getUnitCost(ing) : 0;
                    const itemTotalCost = unitCost * item.quantity;
                    recipeCostPrimo += itemTotalCost;

                    return `
                        <div class="flex justify-between items-center text-[11px] text-gray-300 py-1 border-b border-carbonBorder/30">
                            <span>${ing ? ing.name : 'Insumo eliminado'}</span>
                            <span class="font-mono text-gray-400">${item.quantity} ${ing ? ing.unit : ''} (${formatCOP(itemTotalCost)})</span>
                        </div>
                    `;
                }).join('');

                const foodCostPct = recipe.price > 0 ? ((recipeCostPrimo / recipe.price) * 100) : 0;
                const margin = recipe.price - recipeCostPrimo;
                const marginPct = recipe.price > 0 ? ((margin / recipe.price) * 100) : 0;
                const suggestedPrice = recipeCostPrimo > 0 ? (recipeCostPrimo / 0.30) : 0; // Standard 30% Food cost

                return `
                    <div class="bg-carbon p-6 rounded-2xl border border-carbonBorder shadow-xl flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-teko text-2xl font-bold tracking-wider text-white uppercase">${recipe.name}</h3>
                                <span class="font-teko text-3xl font-extrabold text-gold">${formatCOP(recipe.price)}</span>
                            </div>
                            <span class="text-[9px] uppercase font-bold text-gray-400 bg-asphalt px-2 py-0.5 rounded border border-carbonBorder inline-block mb-3">${recipe.category || 'Pizzas'}</span>

                            <div class="space-y-1 mb-4 max-h-40 overflow-y-auto pr-1">
                                ${itemsList}
                            </div>
                        </div>

                        <div class="pt-3 border-t border-carbonBorder space-y-3">
                            <div class="grid grid-cols-3 gap-2 text-center bg-asphalt p-2.5 rounded-xl border border-carbonBorder">
                                <div>
                                    <span class="text-[9px] text-gray-400 font-bold uppercase block">COSTO PRIMO</span>
                                    <span class="font-teko text-xl text-f1Red font-bold">${formatCOP(recipeCostPrimo)}</span>
                                </div>
                                <div>
                                    <span class="text-[9px] text-gray-400 font-bold uppercase block">FOOD COST</span>
                                    <span class="font-teko text-xl font-bold ${foodCostPct > 35 ? 'text-red-400' : 'text-telemetryGreen'}">${foodCostPct.toFixed(1)}%</span>
                                </div>
                                <div>
                                    <span class="text-[9px] text-gray-400 font-bold uppercase block">MARGEN</span>
                                    <span class="font-teko text-xl text-gold font-bold">${marginPct.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div class="flex justify-between items-center text-[10px] text-gray-400 px-1">
                                <span>Precio Sugerido (30% FC):</span>
                                <span class="font-bold text-telemetryGreen">${formatCOP(suggestedPrice)}</span>
                            </div>

                            <div class="flex justify-end space-x-2">
                                <button onclick="editRecipe('${recipe.id}')" class="px-3 py-1.5 bg-carbonLight hover:bg-carbonBorder text-gray-300 rounded-lg text-xs font-bold">
                                    <i class="fa-solid fa-pen mr-1"></i>Editar
                                </button>
                                <button onclick="deleteRecipe('${recipe.id}')" class="px-3 py-1.5 bg-red-900/30 hover:bg-f1Red text-white rounded-lg text-xs font-bold">
                                    <i class="fa-solid fa-trash mr-1"></i>Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function openRecipeModal(id = null) {
            document.getElementById('rec-id').value = id || '';
            document.getElementById('rec-name').value = '';
            document.getElementById('rec-price').value = '';
            document.getElementById('rec-category').value = 'Pizzas';
            document.getElementById('recipe-ingredients-rows').innerHTML = '';

            if(id) {
                const rec = recipes.find(r => r.id === id);
                if(rec) {
                    document.getElementById('modal-recipe-title').innerText = 'EDITAR FICHA TÉCNICA';
                    document.getElementById('rec-name').value = rec.name;
                    document.getElementById('rec-price').value = rec.price;
                    document.getElementById('rec-category').value = rec.category || 'Pizzas';
                    rec.items.forEach(item => addIngredientRowToRecipe(item.ingredientId, item.quantity));
                }
            } else {
                document.getElementById('modal-recipe-title').innerText = 'NUEVA FICHA TÉCNICA (ESCANDALLO)';
                addIngredientRowToRecipe();
            }

            updateEscandalloCalculations();
            document.getElementById('modal-recipe').classList.remove('hidden');
        }

        function addIngredientRowToRecipe(selectedIngId = '', quantity = '') {
            const container = document.getElementById('recipe-ingredients-rows');
            const rowId = 'rec-row-' + Date.now() + Math.random().toString(36).substr(2, 4);

            const options = ingredients.map(i => {
                const unitCost = getUnitCost(i);
                return `<option value="${i.id}" ${i.id === selectedIngId ? 'selected' : ''}>${i.name} (${i.unit}) - ${formatCOP(unitCost)}/${i.unit}</option>`;
            }).join('');

            const rowHTML = `
                <div id="${rowId}" class="flex items-center space-x-2">
                    <select onchange="updateEscandalloCalculations()" class="rec-ing-select flex-grow bg-carbon border border-carbonBorder rounded-lg p-2 text-white text-xs font-bold focus:outline-none focus:border-gold">
                        <option value="">-- Seleccionar Insumo --</option>
                        ${options}
                    </select>
                    <input type="number" step="0.01" value="${quantity}" oninput="updateEscandalloCalculations()" placeholder="Cant." class="rec-ing-qty w-24 bg-carbon border border-carbonBorder rounded-lg p-2 text-white text-xs focus:outline-none focus:border-gold">
                    <button onclick="document.getElementById('${rowId}').remove(); updateEscandalloCalculations();" class="text-red-400 hover:text-f1Red px-2 text-sm"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', rowHTML);
        }

        function updateEscandalloCalculations() {
            const price = parseFloat(document.getElementById('rec-price').value) || 0;
            let totalCostPrimo = 0;

            const selects = document.querySelectorAll('.rec-ing-select');
            const quantities = document.querySelectorAll('.rec-ing-qty');

            selects.forEach((select, idx) => {
                const ingId = select.value;
                const qty = parseFloat(quantities[idx].value) || 0;
                const ing = ingredients.find(i => i.id === ingId);

                if(ing && qty > 0) {
                    const unitCost = getUnitCost(ing);
                    totalCostPrimo += unitCost * qty;
                }
            });

            const foodCostPct = price > 0 ? ((totalCostPrimo / price) * 100) : 0;
            const margin = price - totalCostPrimo;
            const suggestedPrice = totalCostPrimo > 0 ? (totalCostPrimo / 0.30) : 0;

            document.getElementById('escandallo-cost').innerText = formatCOP(totalCostPrimo);
            document.getElementById('escandallo-foodcost').innerText = `${foodCostPct.toFixed(1)}%`;
            document.getElementById('escandallo-suggested').innerText = formatCOP(suggestedPrice);
            document.getElementById('escandallo-margin').innerText = formatCOP(margin);
        }

        function saveRecipe() {
            const id = document.getElementById('rec-id').value;
            const name = document.getElementById('rec-name').value.trim();
            const category = document.getElementById('rec-category').value;
            const price = parseFloat(document.getElementById('rec-price').value);

            if(!name || isNaN(price) || price <= 0) {
                showNotification('Ingresa el nombre del producto y un precio de venta al público válido.', 'error');
                return;
            }

            const items = [];
            const selects = document.querySelectorAll('.rec-ing-select');
            const quantities = document.querySelectorAll('.rec-ing-qty');

            selects.forEach((select, idx) => {
                const ingId = select.value;
                const qty = parseFloat(quantities[idx].value);
                if(ingId && !isNaN(qty) && qty > 0) {
                    items.push({ ingredientId: ingId, quantity: qty });
                }
            });

            if(id) {
                const rec = recipes.find(r => r.id === id);
                if(rec) {
                    rec.name = name;
                    rec.category = category;
                    rec.price = price;
                    rec.items = items;
                }
            } else {
                recipes.push({ id: 'rec-' + Date.now(), name, category, price, items });
            }

            saveStorageData();
            closeModal('modal-recipe');
            renderRecipesGrid();
            renderPOSProducts();
            showNotification('Ficha técnica / escandallo guardado correctamente.');
        }

        function editRecipe(id) {
            openRecipeModal(id);
        }

        function deleteRecipe(id) {
            if(confirm('¿Deseas eliminar esta ficha técnica del sistema?')) {
                recipes = recipes.filter(r => r.id !== id);
                saveStorageData();
                renderRecipesGrid();
                renderPOSProducts();
                showNotification('Ficha técnica eliminada.');
            }
        }

        // ================= 5. TREASURY & CASH LEDGER LOGIC =================
        function getTreasuryFilteredTransactions() {
            const day = document.getElementById('treasury-filter-day')?.value || '';
            const month = document.getElementById('treasury-filter-month')?.value || '';
            return transactions.filter(t => {
                const d = new Date(t.date);
                const localDay = d.toISOString().slice(0,10);
                const localMonth = localDay.slice(0,7);
                return (!day || localDay === day) && (!month || localMonth === month);
            });
        }

        function renderTreasuryTable() {
            const tbody = document.getElementById('treasury-tbody');
            const filtered = getTreasuryFilteredTransactions();
            const totalIncomes = filtered.filter(t => t.type === 'INGRESO').reduce((acc, t) => acc + Number(t.amount || 0), 0);
            const totalExpenses = filtered.filter(t => t.type === 'EGRESO').reduce((acc, t) => acc + Number(t.amount || 0), 0);
            document.getElementById('treasury-incomes').innerText = formatCOP(totalIncomes);
            document.getElementById('treasury-expenses').innerText = formatCOP(totalExpenses);
            document.getElementById('treasury-balance').innerText = formatCOP(totalIncomes - totalExpenses);
            const day = document.getElementById('treasury-filter-day')?.value;
            const month = document.getElementById('treasury-filter-month')?.value;
            document.getElementById('treasury-period-label').innerText = day ? `Mostrando movimientos del día ${day}` : month ? `Mostrando movimientos del mes ${month}` : 'Mostrando todos los movimientos registrados';
            if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 italic">No hay movimientos para el período seleccionado.</td></tr>`; return; }
            tbody.innerHTML = filtered.map(t => {
                const dateFormatted = new Date(t.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
                const isIncome = t.type === 'INGRESO';
                return `<tr class="hover:bg-asphalt/50"><td class="p-3 font-mono text-gray-400 text-[11px]">${dateFormatted}</td><td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${isIncome ? 'bg-emerald-500/10 text-telemetryGreen border border-emerald-500/30' : 'bg-red-500/10 text-f1Red border border-red-500/30'}">${t.type}</span></td><td class="p-3 font-medium text-white">${t.concept}</td><td class="p-3 text-right font-teko text-xl font-bold ${isIncome ? 'text-telemetryGreen' : 'text-f1Red'}">${isIncome ? '+' : '-'}${formatCOP(t.amount)}</td><td class="p-3 text-center"><button onclick="deleteTransaction('${t.id}')" class="text-red-400 hover:text-f1Red p-1 text-xs"><i class="fa-solid fa-trash"></i></button></td></tr>`;
            }).join('');
        }

        function openTransactionModal() {
            document.getElementById('tx-concept').value = '';
            document.getElementById('tx-amount').value = '';
            document.getElementById('tx-date').value = new Date().toISOString().slice(0,10);
            document.getElementById('modal-transaction').classList.remove('hidden');
        }

        function saveTransaction() {
            const type = document.getElementById('tx-type').value;
            const concept = document.getElementById('tx-concept').value.trim();
            const amount = parseFloat(document.getElementById('tx-amount').value);
            const selectedDate = document.getElementById('tx-date').value;

            if(!concept || !selectedDate || isNaN(amount) || amount <= 0) {
                showNotification('Ingresa un concepto y un monto válido en COP.', 'error');
                return;
            }

            transactions.unshift({
                id: 'tx-' + Date.now(),
                date: new Date(selectedDate + 'T12:00:00').toISOString(),
                type, concept, amount
            });

            saveStorageData();
            closeModal('modal-transaction');
            renderTreasuryTable();
            renderDashboard();
            showNotification('Movimiento registrado en caja.');
        }

        function deleteTransaction(id) {
            if(confirm('¿Deseas eliminar este movimiento de caja?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveStorageData();
                renderTreasuryTable();
                renderDashboard();
                showNotification('Movimiento eliminado.');
            }
        }

        // ================= 6. DATA BACKUP & JSON MANAGEMENT =================
        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        function clearTreasuryFilters() { document.getElementById('treasury-filter-day').value=''; document.getElementById('treasury-filter-month').value=''; renderTreasuryTable(); }
        function exportTreasuryCSV() {
            const rows = getTreasuryFilteredTransactions();
            if (!rows.length) { showNotification('No hay movimientos para exportar.', 'error'); return; }
            let csv = 'ID,Fecha,Tipo,Concepto,Monto_COP\n';
            rows.forEach(t => { csv += `"${t.id}","${t.date}","${t.type}","${String(t.concept).replace(/"/g,'""')}",${t.amount}\n`; });
            const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='HORNO28_LIBRO_DIARIO_'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click(); a.remove();
        }

        function exportDatabaseJSON() {
            const fullData = {
                appName: 'HORNO 28 POS System 🔱',
                version: '2.5-COP',
                exportDate: new Date().toISOString(),
                ingredients,
                recipes,
                sales,
                transactions
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `HORNO28_DRIVE_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            showNotification('Copia de seguridad JSON exportada exitosamente. Lista para respaldo en Google Drive.');
        }

        function importDatabaseJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (parsed.ingredients && parsed.recipes) {
                        ingredients = parsed.ingredients || [];
                        recipes = parsed.recipes || [];
                        sales = parsed.sales || [];
                        transactions = parsed.transactions || [];

                        saveStorageData();
                        window.location.reload();
                    } else {
                        showNotification('El archivo JSON no coincide con la estructura de HORNO 28.', 'error');
                    }
                } catch (err) {
                    showNotification('Error al abrir el archivo JSON.', 'error');
                }
            };
            reader.readAsText(file);
        }

        function exportSalesCSV() {
            if(sales.length === 0) {
                showNotification('No hay ventas para exportar.', 'error');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,ID,Fecha,Categoria,MetodoPago,Productos,Total_COP\n";
            sales.forEach(s => {
                const itemsStr = s.items.map(i => `${i.qty}x ${i.name}`).join(' | ');
                csvContent += `"${s.id}","${s.date}","${s.category || 'Pizzas'}","${s.paymentMethod}","${itemsStr}",${s.total}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `HORNO28_VENTAS_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        function exportInventoryCSV() {
            let csvContent = "data:text/csv;charset=utf-8,ID,Nombre,Stock,Unidad,CostoTotalPagado,CostoUnitarioCalculado,ValorTotalStock,StockMinimo\n";
            ingredients.forEach(i => {
                const unitCost = getUnitCost(i);
                const totalStockVal = i.stock * unitCost;
                csvContent += `"${i.id}","${i.name}",${i.stock},"${i.unit}",${i.totalPaidCost || 0},${unitCost.toFixed(2)},${totalStockVal.toFixed(2)},${i.minStock}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `HORNO28_STOCK_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    