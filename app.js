/**
 * MotoControl - Frontend Controller Application
 * Sistema Integral de Gestión de Flota de Motocarros
 * Basado en las guías de diseño y componentes de Stitch
 */

(function () {
  'use strict';

  // --- Meta-configuración de Vistas del Sistema ---
  const VIEWS_META = {
    dashboard: {
      title: 'Dashboard de Flota',
      subtitle: 'Resumen financiero, mantenimientos y vigencia documental',
      navKey: 'dashboard',
      btnText: 'Registrar Recaudo / Tarifa',
      btnIcon: 'payments',
      btnAction: 'tarifa'
    },
    flota: {
      title: 'Gestión de Conductores y Vehículos',
      subtitle: 'Control de motocarros, asignación de conductores con cédula, compras y ventas',
      navKey: 'flota',
      btnText: 'Registrar Motocarro',
      btnIcon: 'add_circle',
      btnAction: 'form-motocarro'
    },
    tarifas: {
      title: 'Tarifas y Control Financiero',
      subtitle: 'Reglas de cobro diario, liquidaciones y conciliación por cuenta bancaria',
      navKey: 'tarifas',
      btnText: 'Configurar Tarifa',
      btnIcon: 'tune',
      btnAction: 'form-tarifa'
    },
    mantenimientos: {
      title: 'Mantenimientos e Inventario de Repuestos',
      subtitle: 'Órdenes preventivas, correctivas, agenda de taller y stock de repuestos',
      navKey: 'mantenimientos',
      btnText: 'Registrar Mantenimiento',
      btnIcon: 'build',
      btnAction: 'form-mantenimiento'
    },
    documentacion: {
      title: 'Control de Documentación Legal',
      subtitle: 'Vigencia de SOAT, Tecnomecánica CDA y licencias de conducción con cédulas',
      navKey: 'documentacion',
      btnText: 'Registrar SOAT / Tecno',
      btnIcon: 'description',
      btnAction: 'form-soat'
    },
    gastos: {
      title: 'Control de Gastos y Cuentas',
      subtitle: 'Libro diario, conciliación de cuentas y egresos operativos',
      navKey: 'gastos',
      btnText: 'Registrar Gasto',
      btnIcon: 'account_balance_wallet',
      btnAction: 'form-movimiento'
    },
    'form-motocarro': {
      title: 'Registrar Motocarro y Conductor',
      subtitle: 'Alta de nueva unidad en la flota con color (Azul / Salmón), placa y conductor',
      navKey: 'flota',
      btnText: 'Ver Flota Completa',
      btnIcon: 'electric_rickshaw',
      btnAction: 'flota'
    },
    'form-tarifa': {
      title: 'Configurar Tarifa Diaria',
      subtitle: 'Esquema de liquidación diaria ordinaria y dominical (Turno intercalado)',
      navKey: 'tarifas',
      btnText: 'Ver Lista de Tarifas',
      btnIcon: 'payments',
      btnAction: 'tarifas'
    },
    'form-mantenimiento': {
      title: 'Registrar Mantenimiento y Repuestos',
      subtitle: 'Creación de orden de trabajo, repuestos utilizados y cargo a cuenta',
      navKey: 'mantenimientos',
      btnText: 'Ver Agenda de Taller',
      btnIcon: 'build',
      btnAction: 'mantenimientos'
    },
    'form-soat': {
      title: 'Registrar SOAT o Tecnomecánica',
      subtitle: 'Renovación de pólizas, certificados CDA y alertas de vencimiento',
      navKey: 'documentacion',
      btnText: 'Ver Documentación',
      btnIcon: 'description',
      btnAction: 'documentacion'
    },
    'form-movimiento': {
      title: 'Registrar Gasto o Movimiento',
      subtitle: 'Entrada o salida de dinero asociada a motocarro, repuesto o administración',
      navKey: 'gastos',
      btnText: 'Ver Libro de Gastos',
      btnIcon: 'receipt_long',
      btnAction: 'gastos'
    }
  };

  // --- Capa de Datos Reactiva ---
  const MotoData = window.FirebaseManager || {
    data: {
      vehicles: [],
      transactions: [],
      maintenanceOrders: [],
      documents: [],
      accounts: [],
      spareParts: [],
      maintenanceTypes: []
    },
    init() {},
    getVehicles() { return this.data.vehicles || []; },
    getTransactions() { return this.data.transactions || []; },
    getDocuments() { return this.data.documents || []; },
    getAccounts() { return this.data.accounts || []; },
    getSpareParts() { return this.data.spareParts || []; },
    getMaintenanceTypes() { return this.data.maintenanceTypes || []; },
    getDrivers() { return []; },
    getDriverDetails() { return null; },
    getDriverVehicles() { return []; },
    getColors() { return ['Azul', 'Salmón']; }
  };

  // --- Controlador Dinámico del Botón Superior ---
  function updateHeaderActionButton(viewId) {
    const meta = VIEWS_META[viewId] || VIEWS_META.dashboard;
    const btn = document.getElementById('global-new-tx-btn');
    const iconEl = document.getElementById('global-btn-icon');
    const textEl = document.getElementById('global-btn-text');

    if (!btn) return;
    if (iconEl) iconEl.textContent = meta.btnIcon;
    if (textEl) textEl.textContent = meta.btnText;
    btn.dataset.action = meta.btnAction;
  }

  const globalBtn = document.getElementById('global-new-tx-btn');
  if (globalBtn) {
    globalBtn.addEventListener('click', () => {
      const action = globalBtn.dataset.action;
      if (action === 'tarifa') {
        const quickTarifaModal = document.getElementById('fin-modal');
        if (quickTarifaModal) {
          quickTarifaModal.classList.remove('hidden');
          quickTarifaModal.classList.add('flex');
        } else {
          navigateTo('form-tarifa');
        }
      } else if (action && VIEWS_META[action]) {
        navigateTo(action);
      } else {
        navigateTo('form-motocarro');
      }
    });
  }

  // --- Router y Navegación SPA ---
  function navigateTo(viewId) {
    const targetMeta = VIEWS_META[viewId] || VIEWS_META.dashboard;
    const targetSection = document.getElementById(`view-${viewId}`);

    if (!targetSection) {
      console.warn(`Vista no encontrada: view-${viewId}, redirigiendo a dashboard.`);
      navigateTo('dashboard');
      return;
    }

    document.querySelectorAll('.app-view').forEach(v => {
      v.classList.add('hidden');
      v.classList.remove('flex');
    });

    targetSection.classList.remove('hidden');
    targetSection.classList.add('flex');

    const header = document.getElementById('main-app-header');
    if (viewId.startsWith('form-')) {
      if (header) header.classList.add('hidden');
    } else {
      if (header) header.classList.remove('hidden');
      const titleEl = document.getElementById('app-header-title');
      const subEl = document.getElementById('app-header-subtitle');
      if (titleEl) titleEl.textContent = targetMeta.title;
      if (subEl) subEl.textContent = targetMeta.subtitle;
    }

    updateActiveNav(viewId);
    updateHeaderActionButton(viewId);
    setSidebar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-render context
    if (viewId === 'dashboard') {
      window.dispatchEvent(new CustomEvent('motocontrol-render-dashboard'));
    } else if (viewId === 'flota') {
      window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    }
  }

  function updateActiveNav(viewId) {
    const navKey = VIEWS_META[viewId]?.navKey || viewId;
    document.querySelectorAll('#app-sidebar nav a').forEach(link => {
      const href = link.getAttribute('href');
      const match = href === `#${viewId}` || (navKey && href === `#${navKey}`);
      if (match) {
        link.setAttribute('aria-current', 'page');
        link.className = 'flex items-center gap-gutter-sm px-gutter-sm py-2.5 rounded bg-light-secondary-container text-light-on-secondary-container font-semibold';
        const icon = link.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 1";
      } else {
        link.removeAttribute('aria-current');
        link.className = 'flex items-center gap-gutter-sm px-gutter-sm py-2.5 rounded text-light-on-surface-variant hover:bg-light-surface-container-low hover:text-light-on-surface transition-colors duration-state-change';
        const icon = link.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 0";
      }
    });
  }

  // --- Sidebar Mobile Controller ---
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const openBtn = document.getElementById('open-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');

  function setSidebar(open) {
    if (!sidebar || !backdrop) return;
    if (open) {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    } else {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }

  if (openBtn) openBtn.addEventListener('click', () => setSidebar(true));
  if (closeBtn) closeBtn.addEventListener('click', () => setSidebar(false));
  if (backdrop) backdrop.addEventListener('click', () => setSidebar(false));

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        const route = href.substring(1);
        if (VIEWS_META[route]) {
          e.preventDefault();
          history.pushState(null, '', href);
          navigateTo(route);
        }
      }
    }
  });

  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  });

  // --- Firebase Modal Management ---
  const fbModal = document.getElementById('firebase-config-modal');
  const openFbBtn = document.getElementById('firebase-status-badge');
  const closeFbBtn = document.getElementById('close-fb-modal-btn');
  const cancelFbBtn = document.getElementById('cancel-fb-btn');

  function toggleFbModal(show) {
    if (!fbModal) return;
    fbModal.classList.toggle('hidden', !show);
    fbModal.classList.toggle('flex', show);
  }

  if (openFbBtn) openFbBtn.addEventListener('click', () => toggleFbModal(true));
  if (closeFbBtn) closeFbBtn.addEventListener('click', () => toggleFbModal(false));
  if (cancelFbBtn) cancelFbBtn.addEventListener('click', () => toggleFbModal(false));

  const fbForm = document.getElementById('firebase-config-form');
  if (fbForm) {
    fbForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const apiKey = (document.getElementById('fb-apiKey') || document.getElementById('fb-api-key'))?.value.trim();
      const projectId = (document.getElementById('fb-projectId') || document.getElementById('fb-project-id'))?.value.trim();
      const appId = (document.getElementById('fb-appId') || document.getElementById('fb-app-id'))?.value.trim();
      const storageBucket = (document.getElementById('fb-storageBucket') || document.getElementById('fb-storage-bucket'))?.value.trim();

      if (apiKey && projectId) {
        MotoData.saveFirebaseConfig({ apiKey, projectId, appId, storageBucket });
        toggleFbModal(false);
        alert('Configuración de Firebase guardada. Conectando con Cloud Firestore...');
      } else {
        alert('Por favor ingresa al menos API Key y Project ID.');
      }
    });
  }

  // =========================================================================
  // SISTEMA DE AUTENTICACIÓN (LOGIN, REGISTRO, SESIÓN Y CIERRE DE SESIÓN)
  // =========================================================================
  function initAuthLogic() {
    const authModal = document.getElementById('auth-modal');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const feedback = document.getElementById('auth-feedback');

    function showFeedback(msg, isError = true) {
      if (!feedback) return;
      feedback.textContent = msg;
      feedback.className = isError
        ? 'p-2.5 rounded text-xs font-body border border-light-error bg-light-error-container text-light-on-error-container'
        : 'p-2.5 rounded text-xs font-body border border-success bg-success-container text-on-success-container';
      feedback.classList.remove('hidden');
    }

    function clearFeedback() {
      if (feedback) feedback.classList.add('hidden');
    }

    function setAuthMode(mode) {
      clearFeedback();
      if (mode === 'login') {
        tabLogin?.classList.add('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabLogin?.classList.remove('text-light-on-surface-variant', 'font-medium');
        tabRegister?.classList.remove('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabRegister?.classList.add('text-light-on-surface-variant', 'font-medium');
        loginForm?.classList.remove('hidden');
        loginForm?.classList.add('flex');
        registerForm?.classList.add('hidden');
        registerForm?.classList.remove('flex');
      } else {
        tabRegister?.classList.add('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabRegister?.classList.remove('text-light-on-surface-variant', 'font-medium');
        tabLogin?.classList.remove('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabLogin?.classList.add('text-light-on-surface-variant', 'font-medium');
        registerForm?.classList.remove('hidden');
        registerForm?.classList.add('flex');
        loginForm?.classList.add('hidden');
        loginForm?.classList.remove('flex');
      }
    }

    if (tabLogin) tabLogin.addEventListener('click', () => setAuthMode('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => setAuthMode('register'));

    function updateProfileUI(user) {
      if (!user) return;
      const initials = (user.name || user.username || 'AR')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const sideAvatar = document.getElementById('sidebar-user-avatar');
      const sideName = document.getElementById('sidebar-user-name');
      const sideRole = document.getElementById('sidebar-user-role');
      const headAvatar = document.getElementById('header-user-avatar');
      const headName = document.getElementById('header-user-name');

      if (sideAvatar) sideAvatar.textContent = initials;
      if (sideName) sideName.textContent = user.name || user.username;
      if (sideRole) sideRole.textContent = user.role || 'Administrador Flota';
      if (headAvatar) headAvatar.textContent = initials;
      if (headName) headName.textContent = user.name || user.username;
    }

    function checkAuth() {
      const cur = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
      if (!cur) {
        if (authModal) {
          authModal.classList.remove('hidden');
          authModal.classList.add('flex');
        }
      } else {
        if (authModal) {
          authModal.classList.add('hidden');
          authModal.classList.remove('flex');
        }
        updateProfileUI(cur);
      }
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('login-identifier')?.value.trim();
        const pass = document.getElementById('login-password')?.value.trim();
        if (!window.AuthManager) return;
        const res = window.AuthManager.login(id, pass);
        if (res.success) {
          clearFeedback();
          checkAuth();
        } else {
          showFeedback(res.message, true);
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name')?.value.trim();
        const id = document.getElementById('reg-identifier')?.value.trim();
        const role = document.getElementById('reg-role')?.value;
        const pass = document.getElementById('reg-password')?.value.trim();
        if (!window.AuthManager) return;
        const res = window.AuthManager.register(name, id, role, pass);
        if (res.success) {
          clearFeedback();
          checkAuth();
        } else {
          showFeedback(res.message, true);
        }
      });
    }

    document.querySelectorAll('.quick-demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.user;
        const p = btn.dataset.pass;
        const uInput = document.getElementById('login-identifier');
        const pInput = document.getElementById('login-password');
        if (uInput) uInput.value = u;
        if (pInput) pInput.value = p;
        if (window.AuthManager) {
          const res = window.AuthManager.login(u, p);
          if (res.success) checkAuth();
        }
      });
    });

    function doLogout() {
      if (confirm('¿Deseas cerrar tu sesión en MotoControl?')) {
        if (window.AuthManager) window.AuthManager.logout();
        checkAuth();
      }
    }

    document.getElementById('btn-sidebar-logout')?.addEventListener('click', doLogout);
    document.getElementById('btn-header-logout')?.addEventListener('click', doLogout);

    function doResetDatabase() {
      const msg = '¿Deseas vaciar todos los datos de demostración y dejar la base de datos totalmente en blanco?\n\n' +
                  'Se borrarán los motocarros, repuestos, movimientos y documentos de prueba para que puedas registrar tu flota real desde cero.';
      if (confirm(msg)) {
        if (window.MotoData && window.MotoData.clearAllData) {
          window.MotoData.clearAllData().then(() => {
            alert('¡Base de datos restablecida a cero! Tu sistema ahora está completamente en blanco.');
            window.location.reload();
          });
        }
      }
    }
    document.getElementById('btn-reset-db-header')?.addEventListener('click', doResetDatabase);
    document.getElementById('btn-reset-db-sidebar')?.addEventListener('click', doResetDatabase);

    checkAuth();
  }

  // =========================================================================
  // AUTO-COMPLETADO INTELIGENTE (CONDUCTOR + COLOR -> PLACA)
  // CON SOPORTE PARA ASOCIAR UN MISMO CONDUCTOR A DOS MOTOCARROS
  // =========================================================================
  function setupVehicleAutoFiller({
    driverSelectId,
    colorSelectId,
    plateSelectId,
    badgeId,
    badgeTextId,
    onMatched
  }) {
    const driverSelect = document.getElementById(driverSelectId);
    const colorSelect = document.getElementById(colorSelectId);
    const plateSelect = document.getElementById(plateSelectId);
    const badge = document.getElementById(badgeId);
    const badgeText = document.getElementById(badgeTextId);

    function refreshOptions() {
      const vehicles = (MotoData.data && MotoData.data.vehicles) ? MotoData.data.vehicles.filter(v => v.status !== 'sold') : [];
      const drivers = MotoData.getDrivers ? MotoData.getDrivers() : [];

      if (driverSelect) {
        const curD = driverSelect.value;
        const firstOptText = driverSelect.options[0]?.text || '-- Seleccionar Conductor --';
        driverSelect.innerHTML = `<option value="">${firstOptText}</option>`;
        drivers.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d;
          opt.textContent = d;
          driverSelect.appendChild(opt);
        });
        driverSelect.value = curD;
      }

      if (colorSelect && colorSelect.options.length <= 1) {
        colorSelect.innerHTML = `
          <option value="">-- Seleccionar Color --</option>
          <option value="Azul">🔵 Azul</option>
          <option value="Salmón">🟠 Salmón</option>
        `;
      }

      if (plateSelect) {
        const curP = plateSelect.value;
        const firstOptText = plateSelect.options[0]?.text || '-- Seleccionar Placa --';
        plateSelect.innerHTML = `<option value="">${firstOptText}</option>`;
        vehicles.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.plate;
          opt.textContent = `${v.plate} (${v.color || 'Azul'} — ${v.driver})`;
          plateSelect.appendChild(opt);
        });
        plateSelect.value = curP;
      }
    }

    function matchVehicle() {
      const dVal = driverSelect ? driverSelect.value.trim() : '';
      const cVal = colorSelect ? colorSelect.value.trim() : '';
      const vehicles = (MotoData.data && MotoData.data.vehicles) ? MotoData.data.vehicles.filter(v => v.status !== 'sold') : [];

      if (!dVal && !cVal) {
        if (badge) badge.classList.add('hidden');
        return;
      }

      let matched = null;

      // 1. Si se eligió conductor y color, buscar la unidad exacta
      if (dVal && cVal) {
        matched = vehicles.find(v =>
          v.driver.toLowerCase() === dVal.toLowerCase() &&
          (v.color || '').toLowerCase() === cVal.toLowerCase()
        );
      } else if (dVal && !cVal) {
        // Conductor seleccionado sin color aún
        const matches = vehicles.filter(v => v.driver.toLowerCase() === dVal.toLowerCase());
        if (matches.length === 1) {
          matched = matches[0];
          if (colorSelect && matched.color) {
            colorSelect.value = matched.color;
          }
        } else if (matches.length > 1) {
          // Conductor asignado a más de 1 motocarro (intercalado)
          if (badge) {
            badge.classList.remove('hidden');
            if (badgeText) badgeText.textContent = `${matches.length} motocarros asignados. Escoge color.`;
          }
        }
      } else if (!dVal && cVal) {
        // Color seleccionado sin conductor
        const matches = vehicles.filter(v => (v.color || '').toLowerCase() === cVal.toLowerCase());
        if (matches.length === 1) {
          matched = matches[0];
          if (driverSelect && matched.driver) {
            driverSelect.value = matched.driver;
          }
        }
      }

      if (matched && plateSelect) {
        plateSelect.value = matched.plate;
        if (badge) {
          badge.classList.remove('hidden');
          if (badgeText) {
            badgeText.textContent = `Placa ${matched.plate} cargada (${matched.color || 'Azul'})`;
          }
        }
        if (typeof onMatched === 'function') {
          onMatched(matched);
        }
      } else if (!matched && dVal && cVal) {
        if (badge) {
          badge.classList.remove('hidden');
          if (badgeText) badgeText.textContent = 'Sin motocarro para esta combinación';
        }
      }
    }

    if (driverSelect) driverSelect.addEventListener('change', matchVehicle);
    if (colorSelect) colorSelect.addEventListener('change', matchVehicle);

    if (plateSelect) {
      plateSelect.addEventListener('change', () => {
        const val = plateSelect.value;
        const vehicles = (MotoData.data && MotoData.data.vehicles) ? MotoData.data.vehicles : [];
        const found = vehicles.find(v => v.plate === val);
        if (found) {
          if (driverSelect && found.driver && found.driver !== 'Sin conductor') {
            driverSelect.value = found.driver;
          }
          if (colorSelect && found.color) {
            colorSelect.value = found.color;
          }
          if (badge) {
            badge.classList.remove('hidden');
            if (badgeText) badgeText.textContent = `Placa ${found.plate} (${found.color || 'Azul'})`;
          }
          if (typeof onMatched === 'function') onMatched(found);
        }
      });
    }

    refreshOptions();
    window.addEventListener('motocontrol-data-updated', refreshOptions);
  }

  // --- Poblado de Selects Globales y Datalist de Conductores ---
  function populateDynamicSelects() {
    const vehicles = (MotoData.data && MotoData.data.vehicles) ? MotoData.data.vehicles.filter(v => v.status !== 'sold') : [];
    const drivers = MotoData.getDrivers ? MotoData.getDrivers() : [];

    // Poblado de datalist de conductores existentes para asociar a un 2do motocarro
    const conductorList = document.getElementById('existing-conductores-list');
    if (conductorList) {
      conductorList.innerHTML = '';
      drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        conductorList.appendChild(opt);
      });
    }

    document.querySelectorAll('.vehicle-plate-select').forEach(sel => {
      const cur = sel.value;
      sel.innerHTML = '<option value="">-- Seleccionar Placa --</option>';
      vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.plate;
        opt.textContent = `${v.plate} (${v.color || 'Azul'} — ${v.driver})`;
        sel.appendChild(opt);
      });
      sel.value = cur;
    });

    document.querySelectorAll('.driver-name-select').forEach(sel => {
      const cur = sel.value;
      sel.innerHTML = '<option value="">-- Seleccionar Conductor --</option>';
      drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        sel.appendChild(opt);
      });
      sel.value = cur;
    });

    // Poblado de selects de cuentas bancarias
    const accounts = MotoData.getAccounts ? MotoData.getAccounts() : [];
    const accountSelectIds = [
      'filter-account', 'dashboard-filter-account', 'mov-cuenta', 'mov-cuenta-destino',
      'cuenta-recaudo', 'cuenta-pago', 'doc-cuenta', 'sp-account', 'buy-account', 'sell-account'
    ];

    accountSelectIds.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      const hasAll = id.includes('filter');
      sel.innerHTML = hasAll ? '<option value="all">Todas las cuentas</option>' : '';
      if (accounts.length === 0 && !hasAll) {
        sel.innerHTML = '<option value="">Sin cuentas registradas (Crea una en Gastos)</option>';
      } else {
        accounts.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a.name;
          opt.textContent = `${a.name} (${a.type || 'Bancaria'})`;
          sel.appendChild(opt);
        });
      }
      if (cur) sel.value = cur;
    });

    const saldoTotalEl = document.getElementById('mov-saldo-total');
    if (saldoTotalEl) {
      const sumAccounts = accounts.reduce((acc, cur) => acc + Number(cur.balance || 0), 0);
      saldoTotalEl.textContent = `Saldo total: $ ${sumAccounts.toLocaleString('es-CO')}`;
    }
  }

  // =========================================================================
  // 1. DASHBOARD PRINCIPAL (CON FILTROS DE CUENTA BANCARIA Y CONDUCTOR)
  // =========================================================================
  function initDashboardLogic() {
    const fromInput = document.getElementById('date-from');
    const toInput = document.getElementById('date-to');
    const filterAccount = document.getElementById('dashboard-filter-account');
    const filterDriver = document.getElementById('dashboard-filter-driver');
    const resetFiltersBtn = document.getElementById('btn-dashboard-reset-filters');
    const activeBadge = document.getElementById('dashboard-active-filter-badge');
    const activeBadgeText = document.getElementById('dashboard-active-filter-text');
    const activeBadgeStats = document.getElementById('dashboard-active-filter-stats');
    const txTableBody = document.getElementById('dashboard-tx-table-body');
    const accountsContainer = document.getElementById('dashboard-accounts-container');
    const accountsCountEl = document.getElementById('dashboard-accounts-count');
    const maintTableBody = document.getElementById('dashboard-maint-table-body');
    const docTableBody = document.getElementById('doc-table-body');

    function populateDashboardDrivers() {
      if (!filterDriver) return;
      const cur = filterDriver.value;
      filterDriver.innerHTML = '<option value="all">Todos los conductores</option>';
      const drivers = MotoData.getDrivers ? MotoData.getDrivers() : [];
      drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        filterDriver.appendChild(opt);
      });
      filterDriver.value = cur;
    }

    function renderDashboardAccounts() {
      if (!accountsContainer) return;
      const accountsList = MotoData.getAccounts ? MotoData.getAccounts() : [];
      accountsContainer.innerHTML = '';
      if (accountsCountEl) accountsCountEl.textContent = `${accountsList.length} cuenta${accountsList.length === 1 ? '' : 's'} activa${accountsList.length === 1 ? '' : 's'}`;

      if (accountsList.length === 0) {
        accountsContainer.innerHTML = `
          <div class="p-gutter-sm rounded bg-light-surface-container-low border border-dashed border-light-outline-variant text-center py-6">
            <p class="font-body text-body-sm text-light-on-surface-variant">No hay cuentas bancarias registradas</p>
            <a href="#gastos" class="inline-flex items-center gap-1 text-xs text-light-primary font-bold hover:underline mt-1">
              <span class="material-symbols-outlined text-[14px]">add_circle</span>
              <span>Crear cuenta</span>
            </a>
          </div>
        `;
        return;
      }

      accountsList.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'p-gutter-sm rounded bg-light-surface-container-low border border-light-outline-variant flex items-center justify-between gap-gutter-sm';
        div.innerHTML = `
          <div class="min-w-0">
            <p class="font-label text-label-lg text-light-on-surface truncate">${acc.name}</p>
            <p class="font-body text-body-sm text-light-on-surface-variant truncate">${acc.description || `${acc.type || 'Cuenta'} · ${acc.number || ''}`}</p>
          </div>
          <p class="font-mono text-mono-md text-light-on-surface tabular-nums shrink-0 font-bold">$ ${(acc.balance || 0).toLocaleString('es-CO')}</p>
        `;
        accountsContainer.appendChild(div);
      });
    }

    function renderDashboardMaintAndDocs() {
      // 1. Dashboard Mantenimientos
      if (maintTableBody) {
        maintTableBody.innerHTML = '';
        const orders = MotoData.getMaintenanceOrders ? MotoData.getMaintenanceOrders() : [];
        if (orders.length === 0) {
          maintTableBody.innerHTML = `
            <tr>
              <td colspan="4" class="px-gutter-md py-6 text-center text-light-on-surface-variant font-body">
                <div class="flex flex-col items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-[28px] text-light-outline">build</span>
                  <p class="text-sm font-semibold text-light-on-surface">Sin mantenimientos pendientes</p>
                  <p class="text-xs text-light-on-surface-variant">La flota está al día.</p>
                </div>
              </td>
            </tr>
          `;
        } else {
          orders.slice(0, 5).forEach(o => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
            tr.innerHTML = `
              <td class="px-gutter-md py-3">
                <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap font-bold">${o.plate}</p>
                <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${o.driver || '-'}</p>
              </td>
              <td class="px-gutter-md py-3">
                <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${o.type || 'Preventivo'}</p>
                <p class="font-body text-body-sm text-light-outline whitespace-nowrap">${o.desc || '-'}</p>
              </td>
              <td class="px-gutter-md py-3">
                <span class="font-body text-body-md text-light-on-surface tabular-nums whitespace-nowrap">${o.date || '-'}</span>
              </td>
              <td class="px-gutter-md py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'done' ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container'}">
                  ${o.status === 'done' ? 'Realizado' : 'Pendiente'}
                </span>
              </td>
            `;
            maintTableBody.appendChild(tr);
          });
        }
      }

      // 2. Dashboard Documentos
      if (docTableBody) {
        docTableBody.innerHTML = '';
        const docs = MotoData.getDocuments ? MotoData.getDocuments() : [];
        if (docs.length === 0) {
          docTableBody.innerHTML = `
            <tr>
              <td colspan="4" class="px-gutter-md py-6 text-center text-light-on-surface-variant font-body">
                <div class="flex flex-col items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-[28px] text-light-outline">verified_user</span>
                  <p class="text-sm font-semibold text-light-on-surface">Sin documentos registrados</p>
                  <p class="text-xs text-light-on-surface-variant">Registra el SOAT o Tecnomecánica de tus motocarros.</p>
                </div>
              </td>
            </tr>
          `;
        } else {
          docs.slice(0, 5).forEach(d => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
            tr.dataset.docType = d.type;
            const isExp = d.status === 'expired';
            const badgeClass = isExp ? 'bg-light-error-container text-light-on-error-container' : 'bg-success-container text-on-success-container';

            tr.innerHTML = `
              <td class="px-gutter-md py-3">
                <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap font-bold">${d.plate}</p>
                <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${d.driver || '-'}</p>
              </td>
              <td class="px-gutter-md py-3">
                <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${d.type}</p>
                <p class="font-body text-body-sm text-light-outline whitespace-nowrap">${d.entity || '-'}</p>
              </td>
              <td class="px-gutter-md py-3">
                <span class="font-body text-body-md text-light-on-surface tabular-nums whitespace-nowrap">${d.expiry || '-'}</span>
              </td>
              <td class="px-gutter-md py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                  ${d.statusText || (isExp ? 'Vencido' : 'Vigente')}
                </span>
              </td>
            `;
            docTableBody.appendChild(tr);
          });
        }
      }

      // 3. Alertas de Documentos y Mantenimientos en Banner y Sidebar Badges
      const docs = MotoData.getDocuments ? MotoData.getDocuments() : [];
      const orders = MotoData.getMaintenanceOrders ? MotoData.getMaintenanceOrders() : [];
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];

      const expiredDocs = docs.filter(d => d.status === 'expired');
      const expiringDocs = docs.filter(d => d.status === 'expiring');
      const pendingMaint = orders.filter(o => o.status !== 'done');

      // Sidebar badges
      const maintBadge = document.getElementById('badge-maint-count');
      const maintBadgeText = document.getElementById('badge-maint-count-text');
      if (maintBadge) {
        if (pendingMaint.length > 0) {
          maintBadge.classList.remove('hidden');
          if (maintBadgeText) maintBadgeText.textContent = pendingMaint.length;
        } else {
          maintBadge.classList.add('hidden');
        }
      }

      const docBadge = document.getElementById('badge-doc-count');
      const docBadgeText = document.getElementById('badge-doc-count-text');
      if (docBadge) {
        const totalAlertDocs = expiredDocs.length + expiringDocs.length;
        if (totalAlertDocs > 0) {
          docBadge.classList.remove('hidden');
          if (docBadgeText) docBadgeText.textContent = totalAlertDocs;
        } else {
          docBadge.classList.add('hidden');
        }
      }

      // Banner de Alerta Crítica (Vencidos)
      const alertBannerErr = document.getElementById('alert-banner-error');
      const alertBannerErrText = document.getElementById('alert-banner-error-text');
      if (alertBannerErr) {
        if (expiredDocs.length > 0) {
          alertBannerErr.classList.remove('hidden');
          alertBannerErr.classList.add('flex');
          if (alertBannerErrText) {
            alertBannerErrText.innerHTML = `<strong>Alerta crítica:</strong> ${expiredDocs[0].type} vencido en <span class="font-mono text-mono-md">${expiredDocs[0].plate}</span> (${expiredDocs[0].driver || 'Conductor'}). Unidad requiere renovación inmediata.`;
          }
        } else {
          alertBannerErr.classList.add('hidden');
          alertBannerErr.classList.remove('flex');
        }
      }

      // Banner de Próximo Vencimiento (Warning)
      const alertBannerWarn = document.getElementById('alert-banner-warning');
      const alertBannerWarnText = document.getElementById('alert-banner-warning-text');
      if (alertBannerWarn) {
        if (expiringDocs.length > 0) {
          alertBannerWarn.classList.remove('hidden');
          alertBannerWarn.classList.add('flex');
          if (alertBannerWarnText) {
            alertBannerWarnText.innerHTML = `<strong>Próximo vencimiento:</strong> El ${expiringDocs[0].type} de <span class="font-mono text-mono-md">${expiringDocs[0].plate}</span> (${expiringDocs[0].driver || ''}) vence el ${expiringDocs[0].expiry}.`;
          }
        } else {
          alertBannerWarn.classList.add('hidden');
          alertBannerWarn.classList.remove('flex');
        }
      }

      // Documentation view KPIs
      const kpiValidCount = document.getElementById('kpi-doc-valid-count');
      const kpiValidPercent = document.getElementById('kpi-doc-valid-percent');
      const kpiExpiringCount = document.getElementById('kpi-doc-expiring-count');
      const kpiExpiredCount = document.getElementById('kpi-doc-expired-count');
      const kpiDocInv = document.getElementById('kpi-doc-investment');

      const totalDocs = docs.length;
      const validDocsCount = docs.filter(d => d.status === 'valid').length;
      let totalDocCost = 0;
      docs.forEach(d => { totalDocCost += Number(d.cost || 0); });

      if (kpiValidCount) kpiValidCount.textContent = `${validDocsCount} / ${totalDocs}`;
      if (kpiValidPercent) kpiValidPercent.textContent = totalDocs > 0 ? `${Math.round((validDocsCount / totalDocs) * 100)}% al día` : '100% al día';
      if (kpiExpiringCount) kpiExpiringCount.textContent = expiringDocs.length;
      if (kpiExpiredCount) kpiExpiredCount.textContent = expiredDocs.length;
      if (kpiDocInv) kpiDocInv.textContent = '$ ' + totalDocCost.toLocaleString('es-CO');

      // Maintenance view KPIs
      const kpiPrevCount = document.getElementById('kpi-maint-prev-count');
      const kpiCorrCount = document.getElementById('kpi-maint-corr-count');
      const kpiMaintExp = document.getElementById('kpi-maint-expense');
      const kpiMaintOrders = document.getElementById('kpi-maint-orders-count');
      const kpiStockItems = document.getElementById('kpi-stock-items');
      const kpiStockLow = document.getElementById('kpi-stock-low');
      const kpiStockVal = document.getElementById('kpi-stock-val');

      const parts = MotoData.getSpareParts ? MotoData.getSpareParts() : [];
      let totalStockVal = 0;
      let lowStockCount = 0;
      parts.forEach(p => {
        totalStockVal += (p.stock || 0) * (p.price || 0);
        if ((p.stock || 0) <= (p.min || 0)) lowStockCount++;
      });

      let totalMaintExpense = 0;
      orders.forEach(o => { totalMaintExpense += Number(o.cost || 0); });

      const corrCount = orders.filter(o => o.type === 'Correctivo' && o.status !== 'done').length;
      const prevCount = orders.filter(o => o.type === 'Preventivo' && o.status !== 'done').length;

      if (kpiPrevCount) kpiPrevCount.textContent = prevCount;
      if (kpiCorrCount) kpiCorrCount.textContent = corrCount;
      if (kpiMaintExp) kpiMaintExp.textContent = '$ ' + totalMaintExpense.toLocaleString('es-CO');
      if (kpiMaintOrders) kpiMaintOrders.textContent = `${orders.length} órdenes`;
      if (kpiStockItems) kpiStockItems.textContent = `${parts.length} ítems`;
      if (kpiStockLow) kpiStockLow.textContent = `${lowStockCount} bajo stock`;
      if (kpiStockVal) kpiStockVal.textContent = `Valorizado en $ ${totalStockVal.toLocaleString('es-CO')}`;
    }

    function applyDashboardFilters() {
      const acct = filterAccount ? filterAccount.value : 'all';
      const drv = filterDriver ? filterDriver.value : 'all';
      const dFrom = fromInput ? fromInput.value : '';
      const dTo = toInput ? toInput.value : '';

      const txs = MotoData.getTransactions ? MotoData.getTransactions() : [];
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles().filter(v => v.status !== 'sold') : [];

      let incTotal = 0;
      let expTotal = 0;
      let matchCount = 0;
      const matchedTxs = [];

      txs.forEach(t => {
        const okAcct = acct === 'all' || (t.account && t.account.toLowerCase().includes(acct.toLowerCase()));
        const okDrv = drv === 'all' || (t.driver && t.driver.toLowerCase() === drv.toLowerCase());
        let okDate = true;
        if (dFrom && t.date && t.date < dFrom) okDate = false;
        if (dTo && t.date && t.date > dTo) okDate = false;

        if (okAcct && okDrv && okDate) {
          matchCount++;
          matchedTxs.push(t);
          if (t.type === 'income') incTotal += Number(t.amount || 0);
          else if (t.type === 'expense') expTotal += Number(t.amount || 0);
        }
      });

      const netBalance = incTotal - expTotal;
      const hasSpecificFilter = acct !== 'all' || drv !== 'all';

      // Live KPI Cards
      const incEl = document.getElementById('kpi-income');
      const expEl = document.getElementById('kpi-expense');
      const balEl = document.getElementById('kpi-balance');
      const fleetCountEl = document.getElementById('kpi-fleet-count');
      const fleetRateEl = document.getElementById('kpi-fleet-rate');
      const fleetSubEl = document.getElementById('kpi-fleet-sub');

      if (incEl) incEl.textContent = '$ ' + incTotal.toLocaleString('es-CO');
      if (expEl) expEl.textContent = '$ ' + expTotal.toLocaleString('es-CO');
      if (balEl) balEl.textContent = '$ ' + netBalance.toLocaleString('es-CO');

      if (fleetCountEl) {
        const inRoute = vehicles.filter(v => v.status === 'route').length;
        fleetCountEl.textContent = `${inRoute} / ${vehicles.length}`;
      }
      if (fleetRateEl) {
        let avgRate = 0;
        if (vehicles.length > 0) {
          let sum = 0;
          vehicles.forEach(v => { sum += Number(v.dailyRate || 45000); });
          avgRate = Math.round(sum / vehicles.length);
        }
        fleetRateEl.textContent = `$ ${(avgRate / 1000).toFixed(0)}k/día`;
      }
      if (fleetSubEl) {
        const inWorkshop = vehicles.filter(v => v.status === 'workshop').length;
        fleetSubEl.textContent = inWorkshop > 0 ? `${inWorkshop} motocarro${inWorkshop === 1 ? '' : 's'} en taller correctivo` : (vehicles.length > 0 ? 'Toda la flota operativa' : 'Sin motocarros registrados');
      }

      if (hasSpecificFilter) {
        if (activeBadge) {
          activeBadge.classList.remove('hidden');
          activeBadge.classList.add('flex');
          const acctText = acct !== 'all' ? `Cuenta: ${acct}` : 'Todas las cuentas';
          const drvText = drv !== 'all' ? `Conductor: ${drv}` : 'Todos los conductores';
          if (activeBadgeText) activeBadgeText.textContent = `Filtro aplicado: ${acctText} · ${drvText} (${matchCount} movimientos)`;
          if (activeBadgeStats) activeBadgeStats.textContent = `Ingresos: $${incTotal.toLocaleString('es-CO')} | Gastos: $${expTotal.toLocaleString('es-CO')} | Neto: $${netBalance.toLocaleString('es-CO')}`;
        }
      } else {
        if (activeBadge) {
          activeBadge.classList.add('hidden');
          activeBadge.classList.remove('flex');
        }
      }

      // Render Dashboard movements table
      if (txTableBody) {
        txTableBody.innerHTML = '';
        const listToRender = hasSpecificFilter ? matchedTxs : txs.slice(0, 6);
        if (listToRender.length === 0) {
          txTableBody.innerHTML = '<tr><td colspan="6" class="px-3 py-6 text-center text-light-on-surface-variant font-body">No hay movimientos registrados para los filtros seleccionados.</td></tr>';
        } else {
          listToRender.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-light-surface-container-low transition-colors';
            const isInc = t.type === 'income';
            const typeBadge = isInc
              ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[11px] font-semibold">Ingreso</span>'
              : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-error-container text-light-on-error-container text-[11px] font-semibold">Gasto</span>';

            tr.innerHTML = `
              <td class="px-3 py-2.5 font-mono text-light-outline whitespace-nowrap">${t.date || '-'}</td>
              <td class="px-3 py-2.5">${typeBadge}</td>
              <td class="px-3 py-2.5 font-body font-medium text-light-on-surface whitespace-nowrap">${t.concept || '-'}</td>
              <td class="px-3 py-2.5">
                <span class="font-mono font-bold text-light-primary">${t.plate || 'General'}</span>
                <span class="font-body text-light-on-surface-variant text-[11px]">${t.driver ? ' · ' + t.driver : ''}</span>
              </td>
              <td class="px-3 py-2.5 font-body text-light-on-surface-variant whitespace-nowrap">${t.account || '-'}</td>
              <td class="px-3 py-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap ${isInc ? 'text-success' : 'text-light-error'}">
                ${isInc ? '+' : '-'} $ ${(t.amount || 0).toLocaleString('es-CO')}
              </td>
            `;
            txTableBody.appendChild(tr);
          });
        }
      }

      renderDashboardAccounts();
      renderDashboardMaintAndDocs();
    }

    if (filterAccount) filterAccount.addEventListener('change', applyDashboardFilters);
    if (filterDriver) filterDriver.addEventListener('change', applyDashboardFilters);
    if (fromInput) fromInput.addEventListener('change', applyDashboardFilters);
    if (toInput) toInput.addEventListener('change', applyDashboardFilters);

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        if (filterAccount) filterAccount.value = 'all';
        if (filterDriver) filterDriver.value = 'all';
        applyDashboardFilters();
      });
    }

    // Dashboard Document Tabs (Todos / SOAT / Tecno)
    document.querySelectorAll('#view-dashboard .doc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.docFilter;
        document.querySelectorAll('#view-dashboard .doc-tab').forEach(t => {
          const active = t === tab;
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          t.className = active
            ? 'doc-tab px-2.5 py-1 rounded font-label text-label-sm bg-light-surface-container-lowest text-light-on-surface font-bold shadow-xs'
            : 'doc-tab px-2.5 py-1 rounded font-label text-label-sm text-light-on-surface-variant hover:text-light-on-surface';
        });

        document.querySelectorAll('#doc-table-body tr').forEach(r => {
          const rowType = (r.dataset.docType || r.textContent || '').toLowerCase();
          const match = filter === 'all' || rowType.includes(filter.toLowerCase());
          r.classList.toggle('hidden', !match);
        });
      });
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => {
          b.className = b === btn
            ? 'preset-btn px-2.5 py-1 rounded font-label text-label-sm bg-light-secondary-container text-light-on-secondary-container transition-colors'
            : 'preset-btn px-2.5 py-1 rounded font-label text-label-sm bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container transition-colors';
        });
        applyDashboardFilters();
      });
    });

    populateDashboardDrivers();
    applyDashboardFilters();
    window.addEventListener('motocontrol-render-dashboard', () => {
      populateDashboardDrivers();
      applyDashboardFilters();
    });
    window.addEventListener('motocontrol-data-updated', () => {
      populateDashboardDrivers();
      applyDashboardFilters();
    });
  }

  // =========================================================================
  // 2. FLOTA Y CONDUCTORES (CON RECONOCIMIENTO DE CONDUCTOR CON 2 MOTOCARROS)
  // =========================================================================
  function initFlotaLogic() {
    let currentFilter = 'all';
    const searchInput = document.getElementById('fleet-search');
    const tableBody = document.getElementById('fleet-table-body');
    const countLabel = document.getElementById('fleet-count-label');

    function renderFleetTable() {
      if (!tableBody) return;
      const data = MotoData.data;
      if (!data || !data.vehicles) return;

      const q = (searchInput?.value || '').trim().toLowerCase();
      let visibleCount = 0;

      // Contar motocarros por conductor para detectar turno intercalado (>=2 motocarros)
      const driverVehicleCount = {};
      data.vehicles.forEach(veh => {
        if (veh.driver && veh.driver !== 'Sin conductor' && veh.status !== 'sold') {
          const k = veh.driver.toLowerCase();
          driverVehicleCount[k] = (driverVehicleCount[k] || 0) + 1;
        }
      });

      tableBody.innerHTML = '';
      data.vehicles.forEach(v => {
        const vColor = v.color || 'Azul';
        const isSalmon = vColor.toLowerCase().includes('salm') || vColor.toLowerCase().includes('salmon');
        const isSold = v.status === 'sold';

        let matchesFilter = false;
        if (currentFilter === 'all') matchesFilter = !isSold;
        else if (currentFilter === 'sold') matchesFilter = isSold;
        else if (currentFilter === 'Azul') matchesFilter = !isSalmon && !isSold;
        else if (currentFilter === 'Salmón') matchesFilter = isSalmon && !isSold;
        else matchesFilter = (v.status === currentFilter);

        const cedulaStr = v.cedula || '';
        const searchStr = `${v.plate} ${vColor} ${v.model} ${v.driver} ${cedulaStr} ${v.phone}`.toLowerCase();
        const matchesQuery = !q || searchStr.includes(q);

        if (matchesFilter && matchesQuery) {
          visibleCount++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          tr.dataset.status = v.status;
          tr.dataset.color = vColor;
          tr.dataset.search = searchStr;

          const statusBadge = isSold
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-surface-container-highest text-light-outline font-label text-label-sm font-semibold">🤝 Vendido</span>'
            : v.status === 'route'
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-success-container text-on-success-container font-label text-label-sm">En ruta</span>'
            : v.status === 'workshop'
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-container text-on-warning-container font-label text-label-sm">En taller</span>'
            : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-surface-container-high text-light-on-surface-variant font-label text-label-sm">Sin conductor</span>';

          const colorBadge = isSalmon
            ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE5DB] text-[#7F4025] border border-[#9C573A]/30 font-label text-label-sm font-semibold">🟠 Salmón</span>'
            : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#38BDF8]/40 font-label text-label-sm font-semibold">🔵 Azul</span>';

          const cedulaDisplay = (v.driver !== 'Sin conductor' && v.cedula && v.cedula !== '-')
            ? `<p class="font-mono text-body-xs text-light-primary font-semibold">C.C. ${v.cedula}</p>`
            : '';

          // Badge si tiene 2 motocarros asignados
          const isIntercalado = (driverVehicleCount[v.driver?.toLowerCase()] || 0) > 1;
          const multiMotocarroBadge = isIntercalado
            ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E0E7FF] text-[#3730A3] border border-[#3730A3]/30 font-label text-[10px] font-semibold mt-0.5">🔄 2 motocarros (Intercalado)</span>'
            : '';

          tr.innerHTML = `
            <td class="px-gutter-md py-3.5">
              <div class="flex items-center gap-2">
                <span class="font-mono text-mono-md text-light-on-surface font-bold whitespace-nowrap">${v.plate}</span>
                ${colorBadge}
              </div>
              <p class="font-body text-body-sm text-light-on-surface-variant">${v.model}</p>
            </td>
            <td class="px-gutter-md py-3.5">
              <div class="flex flex-col">
                <span class="font-body text-body-md text-light-on-surface font-bold whitespace-nowrap">${v.driver}</span>
                ${cedulaDisplay}
                ${multiMotocarroBadge}
                <p class="font-mono text-body-xs text-light-on-surface-variant tabular-nums">${v.phone || '-'}</p>
                <p class="font-body text-[11px] text-light-outline">Licencia: ${v.license || 'A2'} (${v.venceLicencia || 'Vigente'})</p>
              </div>
            </td>
            <td class="px-gutter-md py-3.5 font-mono text-mono-md text-light-on-surface tabular-nums whitespace-nowrap">$ ${(v.dailyRate || 45000).toLocaleString('es-CO')}</td>
            <td class="px-gutter-md py-3.5">
              <p class="font-body text-body-xs text-light-on-surface-variant">SOAT: <span class="font-mono">${v.soatExpiry || 'Vigente'}</span></p>
              <p class="font-body text-body-xs text-light-on-surface-variant">Tecno: <span class="font-mono">${v.tecnoExpiry || 'Vigente'}</span></p>
            </td>
            <td class="px-gutter-md py-3.5">${statusBadge}</td>
            <td class="px-gutter-md py-3.5 text-right whitespace-nowrap">
              ${!isSold ? `
              <button type="button" class="reassign-btn inline-flex items-center gap-1 px-2.5 py-1 rounded text-light-primary hover:bg-light-primary/10 font-label text-label-sm font-semibold" data-plate="${v.plate}" data-driver="${v.driver === 'Sin conductor' ? '' : v.driver}" data-cedula="${v.cedula || ''}" data-color="${vColor}">
                <span class="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar</span>
              </button>
              ` : `
              <span class="text-xs text-light-outline font-body">Vendido a ${v.buyer || 'Particular'}</span>
              `}
            </td>
          `;
          tableBody.appendChild(tr);
        }
      });

      if (visibleCount === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[48px] text-light-outline">electric_rickshaw</span>
                <p class="font-headline text-headline-sm text-light-on-surface">No hay motocarros registrados en la flota</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Registra tu primer motocarro indicando su placa, color (Azul o Salmón) y conductor asignado.</p>
                <a href="#form-motocarro" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Registrar Primer Motocarro</span>
                </a>
              </div>
            </td>
          </tr>
        `;
      }

      if (countLabel) {
        countLabel.textContent = `Mostrando ${visibleCount} de ${data.vehicles.length} motocarros`;
      }

      // Actualizar KPIs de la vista Flota
      const activeVehs = data.vehicles.filter(v => v.status !== 'sold');
      const inRoute = activeVehs.filter(v => v.status === 'route').length;
      const inWorkshop = activeVehs.filter(v => v.status === 'workshop').length;
      const available = activeVehs.filter(v => v.status === 'available').length;
      const driversAssigned = new Set(activeVehs.filter(v => v.driver && v.driver !== 'Sin conductor').map(v => v.driver)).size;

      const kpiTotalEl = document.getElementById('fleet-kpi-total');
      const kpiInRouteEl = document.getElementById('fleet-kpi-in-route');
      const kpiSubEl = document.getElementById('fleet-kpi-sub');
      const kpiDriversEl = document.getElementById('fleet-kpi-drivers');
      const kpiDriversBadgeEl = document.getElementById('fleet-kpi-drivers-badge');
      const kpiDriversSubEl = document.getElementById('fleet-kpi-drivers-sub');
      const kpiRateEl = document.getElementById('fleet-kpi-rate');
      const kpiActiveEl = document.getElementById('fleet-kpi-active');
      const kpiAlertsBadgeEl = document.getElementById('fleet-kpi-alerts-badge');

      if (kpiTotalEl) kpiTotalEl.textContent = activeVehs.length;
      if (kpiInRouteEl) kpiInRouteEl.textContent = `${inRoute} en ruta`;
      if (kpiSubEl) kpiSubEl.textContent = `${inWorkshop} en taller · ${available} disponible`;
      if (kpiDriversEl) kpiDriversEl.textContent = driversAssigned;
      if (kpiDriversBadgeEl) kpiDriversBadgeEl.textContent = `${driversAssigned} asignados`;
      if (kpiRateEl) {
        const avgRate = activeVehs.length > 0
          ? Math.round(activeVehs.reduce((sum, v) => sum + (v.dailyRate || 45000), 0) / activeVehs.length)
          : 0;
        kpiRateEl.textContent = `$ ${avgRate.toLocaleString('es-CO')}`;
      }
      if (kpiActiveEl) kpiActiveEl.textContent = `${inRoute} / ${activeVehs.length}`;
      if (kpiAlertsBadgeEl) kpiAlertsBadgeEl.textContent = `${inWorkshop} alertas`;

      tableBody.querySelectorAll('.reassign-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          toggleAssignModal(true, btn.dataset.plate, btn.dataset.driver, btn.dataset.cedula);
        });
      });
    }

    document.querySelectorAll('.status-tab, .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentFilter = tab.dataset.statusFilter || tab.dataset.filter || 'all';
        document.querySelectorAll('.status-tab, .filter-tab').forEach(t => {
          const active = t === tab;
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          if (active) {
            t.className = 'status-tab px-3 py-1.5 rounded font-label text-label-md bg-light-secondary-container text-light-on-secondary-container font-bold shadow-xs transition-colors duration-state-change';
          } else {
            t.className = 'status-tab px-3 py-1.5 rounded font-label text-label-md bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container transition-colors duration-state-change';
          }
        });
        renderFleetTable();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', renderFleetTable);
    }

    // Modal de Asignación / Edición de Conductor
    const assignModal = document.getElementById('assign-modal');
    const plateInput = document.getElementById('modal-plate');
    const driverInput = document.getElementById('modal-driver');
    const cedulaInput = document.getElementById('modal-cedula');

    function toggleAssignModal(show, plate = '', driver = '', cedula = '') {
      if (!assignModal) return;
      if (show) {
        if (plate && plateInput) plateInput.value = plate;
        if (driverInput) driverInput.value = driver;
        if (cedulaInput) cedulaInput.value = cedula;
        assignModal.classList.remove('hidden');
        assignModal.classList.add('flex');
      } else {
        assignModal.classList.add('hidden');
        assignModal.classList.remove('flex');
      }
    }

    if (driverInput) {
      driverInput.addEventListener('input', () => {
        const val = driverInput.value.trim();
        const details = MotoData.getDriverDetails ? MotoData.getDriverDetails(val) : null;
        if (details && cedulaInput && details.cedula && details.cedula !== '-') {
          cedulaInput.value = details.cedula;
        }
      });
    }

    (document.getElementById('open-assign-secondary-btn') || document.getElementById('btn-goto-add-motocarro') || document.getElementById('open-assign-modal-btn'))?.addEventListener('click', () => navigateTo('form-motocarro'));
    document.getElementById('open-assign-secondary-btn')?.addEventListener('click', () => toggleAssignModal(true));
    document.getElementById('close-assign-modal-btn')?.addEventListener('click', () => toggleAssignModal(false));
    document.getElementById('cancel-assign-btn')?.addEventListener('click', () => toggleAssignModal(false));

    const assignForm = document.getElementById('assign-form');
    if (assignForm) {
      assignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = plateInput?.value.trim().toUpperCase() || '';
        const d = driverInput?.value.trim() || 'Sin conductor';
        const c = cedulaInput?.value.trim() || 'Sin registrar';

        MotoData.updateVehicle(p, {
          driver: d,
          cedula: c,
          status: d === 'Sin conductor' ? 'idle' : 'route'
        });

        toggleAssignModal(false);
        renderFleetTable();
        alert(`Vehículo ${p} actualizado con conductor ${d} (C.C. ${c}).`);
      });
    }

    // Modal Compra de Motocarro
    const buyModal = document.getElementById('buy-motocarro-modal');
    function toggleBuyModal(show) {
      if (!buyModal) return;
      buyModal.classList.toggle('hidden', !show);
      buyModal.classList.toggle('flex', show);
    }

    document.getElementById('btn-open-buy-modal')?.addEventListener('click', () => toggleBuyModal(true));
    document.getElementById('close-buy-modal-btn')?.addEventListener('click', () => toggleBuyModal(false));
    (document.getElementById('cancel-buy-modal-btn') || document.getElementById('cancel-buy-btn'))?.addEventListener('click', () => toggleBuyModal(false));

    const buyForm = document.getElementById('buy-motocarro-form');
    if (buyForm) {
      buyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = document.getElementById('buy-plate')?.value.trim().toUpperCase() || 'MCT-999';
        const color = (document.querySelector('input[name="buyColor"]:checked')?.value) || (document.getElementById('buy-color')?.value) || 'Azul';
        const model = document.getElementById('buy-model')?.value.trim() || 'Bajaj RE 4S';
        const price = Number(document.getElementById('buy-price')?.value || 18500000);
        const account = document.getElementById('buy-account')?.value || 'Bancolombia Ahorros';
        const supplier = document.getElementById('buy-supplier')?.value.trim() || 'Distribuidor';
        const driver = document.getElementById('buy-driver')?.value.trim() || 'Sin conductor';
        const cedula = document.getElementById('buy-cedula')?.value.trim() || '-';
        const phone = document.getElementById('buy-phone')?.value.trim() || '-';

        MotoData.buyVehicle({
          plate, color, model, price, account, supplier, driver, cedula, phone,
          dailyRate: 45000,
          license: 'A2',
          venceLicencia: '2028-11-20'
        });

        toggleBuyModal(false);
        renderFleetTable();
        alert(`¡Motocarro ${plate} (${color}) comprado y agregado a la flota con éxito!`);
      });
    }

    // Modal Venta de Motocarro
    const sellModal = document.getElementById('sell-motocarro-modal');
    function toggleSellModal(show) {
      if (!sellModal) return;
      sellModal.classList.toggle('hidden', !show);
      sellModal.classList.toggle('flex', show);
    }

    document.getElementById('btn-open-sell-modal')?.addEventListener('click', () => toggleSellModal(true));
    document.getElementById('close-sell-modal-btn')?.addEventListener('click', () => toggleSellModal(false));
    (document.getElementById('cancel-sell-modal-btn') || document.getElementById('cancel-sell-btn'))?.addEventListener('click', () => toggleSellModal(false));

    setupVehicleAutoFiller({
      driverSelectId: 'sell-filter-driver',
      colorSelectId: 'sell-filter-color',
      plateSelectId: 'sell-plate',
      badgeId: 'sell-auto-badge',
      badgeTextId: 'sell-auto-badge-text'
    });

    const sellForm = document.getElementById('sell-motocarro-form');
    if (sellForm) {
      sellForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = document.getElementById('sell-plate')?.value;
        const price = Number(document.getElementById('sell-price')?.value || 12000000);
        const buyer = document.getElementById('sell-buyer')?.value.trim() || 'Particular';
        const account = document.getElementById('sell-account')?.value || 'Bancolombia Ahorros';
        const notes = document.getElementById('sell-notes')?.value.trim() || 'Venta de motocarro';

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro a vender.');
          return;
        }

        MotoData.sellVehicle({ plate, price, buyer, account, notes });
        toggleSellModal(false);
        renderFleetTable();
        alert(`¡Motocarro ${plate} marcado como vendido! Ingreso registrado en ${account}.`);
      });
    }

    renderFleetTable();
    window.addEventListener('motocontrol-data-updated', renderFleetTable);
  }

  // =========================================================================
  // 3. TARIFAS Y CONTROL FINANCIERO
  // =========================================================================
  function initTarifasLogic() {
    let activeType = 'all';
    const accountSelect = document.getElementById('account-filter');
    const txTableBody = document.getElementById('tx-table-body');
    const tariffVehiclesBody = document.getElementById('tariff-vehicles-table-body');
    const tariffFormGrid = document.getElementById('tarifa-form-vehicles-grid');

    function renderTarifasMovements() {
      if (!txTableBody) return;
      const data = MotoData.data;
      if (!data || !data.transactions) return;

      const acct = accountSelect ? accountSelect.value : 'all';
      txTableBody.innerHTML = '';

      let matchCount = 0;
      data.transactions.forEach(t => {
        const matchType = activeType === 'all' || t.type === activeType;
        const matchAcct = acct === 'all' || (t.account || '').toLowerCase().includes(acct.toLowerCase());

        if (matchType && matchAcct) {
          matchCount++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          const isInc = t.type === 'income';

          tr.innerHTML = `
            <td class="px-gutter-md py-3.5"><span class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.concept}</span></td>
            <td class="px-gutter-md py-3.5"><span class="font-mono text-mono-md text-light-on-surface font-bold whitespace-nowrap">${t.plate || 'General'}</span></td>
            <td class="px-gutter-md py-3.5"><span class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.account}</span></td>
            <td class="px-gutter-md py-3.5 text-right font-mono text-mono-md font-semibold ${isInc ? 'text-success' : 'text-light-error'} tabular-nums whitespace-nowrap">
              ${isInc ? '+' : '-'} $ ${(t.amount || 0).toLocaleString('es-CO')}
            </td>
          `;
          txTableBody.appendChild(tr);
        }
      });

      if (matchCount === 0) {
        txTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="px-gutter-md py-8 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[32px] text-light-outline">payments</span>
                <p class="text-sm font-semibold text-light-on-surface">No hay recaudos registrados</p>
                <p class="text-xs text-light-on-surface-variant">Usa el botón "Registrar Recaudo / Tarifa" para registrar ingresos de tu flota.</p>
              </div>
            </td>
          </tr>
        `;
      }
    }

    function renderTariffVehiclesTable() {
      if (!tariffVehiclesBody) return;
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles().filter(v => v.status !== 'sold') : [];
      tariffVehiclesBody.innerHTML = '';

      if (vehicles.length === 0) {
        tariffVehiclesBody.innerHTML = `
          <tr>
            <td colspan="3" class="px-gutter-md py-8 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[32px] text-light-outline">electric_rickshaw</span>
                <p class="text-sm font-semibold text-light-on-surface">Sin motocarros registrados</p>
                <p class="text-xs text-light-on-surface-variant">Registra unidades para configurar su tarifa diaria.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      vehicles.forEach(v => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
        tr.innerHTML = `
          <td class="px-gutter-md py-3">
            <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap font-bold">${v.plate}</p>
            <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${v.driver}</p>
          </td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums whitespace-nowrap">
            $ ${(v.dailyRate || 45000).toLocaleString('es-CO')}
          </td>
          <td class="px-gutter-md py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${v.status === 'route' ? 'bg-success-container text-on-success-container' : 'bg-light-surface-container text-light-on-surface-variant'}">
              ${v.status === 'route' ? 'En ruta' : 'Pendiente'}
            </span>
          </td>
        `;
        tariffVehiclesBody.appendChild(tr);
      });

      // Update form-tarifa vehicle checklist
      if (tariffFormGrid) {
        tariffFormGrid.innerHTML = '';
        vehicles.forEach(v => {
          const lbl = document.createElement('label');
          lbl.className = 'flex items-center justify-between gap-gutter-sm p-gutter-sm rounded border border-light-outline-variant bg-light-surface hover:bg-light-surface-container-low cursor-pointer';
          lbl.innerHTML = `
            <span class="flex items-center gap-gutter-sm">
              <input class="tarifa-vehiculo rounded border-light-outline-variant text-light-primary focus:ring-light-primary" type="checkbox" value="${v.plate}" checked/>
              <span class="font-mono text-mono-md text-light-on-surface tabular-nums">${v.plate}</span>
            </span>
            <span class="font-body text-body-sm text-light-on-surface-variant">${v.driver}</span>
          `;
          tariffFormGrid.appendChild(lbl);
        });
      }
    }

    document.querySelectorAll('.tx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeType = tab.dataset.txFilter;
        document.querySelectorAll('.tx-tab').forEach(t => {
          const isActive = t === tab;
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
          t.className = isActive
            ? 'tx-tab px-2.5 py-1 rounded font-label text-label-sm bg-light-surface-container-lowest text-light-on-surface font-bold'
            : 'tx-tab px-2.5 py-1 rounded font-label text-label-sm text-light-on-surface-variant hover:text-light-on-surface';
        });
        renderTarifasMovements();
      });
    });

    if (accountSelect) accountSelect.addEventListener('change', renderTarifasMovements);

    const finModal = document.getElementById('fin-modal');
    function toggleFinModal(show) {
      if (!finModal) return;
      finModal.classList.toggle('hidden', !show);
      finModal.classList.toggle('flex', show);
    }

    document.getElementById('open-fin-modal-btn')?.addEventListener('click', () => toggleFinModal(true));
    document.getElementById('close-fin-modal-btn')?.addEventListener('click', () => toggleFinModal(false));
    document.getElementById('cancel-fin-btn')?.addEventListener('click', () => toggleFinModal(false));

    setupVehicleAutoFiller({
      driverSelectId: 'quick-tarifa-driver',
      colorSelectId: 'quick-tarifa-color',
      plateSelectId: 'modal-tx-plate',
      badgeId: 'quick-tarifa-auto-badge',
      badgeTextId: 'quick-tarifa-auto-badge-text'
    });

    const finForm = document.getElementById('fin-form');
    if (finForm) {
      finForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = (document.getElementById('fin-modal-plate') || document.getElementById('modal-tx-plate'))?.value;
        const amount = Number(finForm.querySelector('input[type="number"]')?.value || document.getElementById('modal-tx-amount')?.value || 45000);
        const acct = finForm.querySelectorAll('select')[1]?.value || document.getElementById('modal-tx-account')?.value || 'Nequi Flota';
        const concept = finForm.querySelector('input[placeholder*="Ej."]')?.value || 'Recaudo tarifa diaria';

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }

        const vehicles = MotoData.getVehicles();
        const v = vehicles.find(veh => veh.plate === plate) || {};

        MotoData.addTransaction({
          type: 'income',
          account: acct,
          plate: plate,
          driver: v.driver || 'Conductor',
          category: 'Tarifa diaria',
          concept: concept,
          amount: amount,
          date: new Date().toISOString().split('T')[0]
        });

        toggleFinModal(false);
        renderTarifasMovements();
        renderTarifasKPIs();
        alert(`Recaudo de $ ${amount.toLocaleString('es-CO')} registrado para el motocarro ${plate}.`);
      });
    }

    function renderTarifasKPIs() {
      const txs = MotoData.getTransactions ? MotoData.getTransactions() : [];
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles().filter(v => v.status !== 'sold') : [];
      const accounts = MotoData.getAccounts ? MotoData.getAccounts() : [];

      let income = 0;
      let incomeCount = 0;
      let expense = 0;
      let expenseCount = 0;

      txs.forEach(t => {
        if (t.type === 'income') {
          income += Number(t.amount || 0);
          incomeCount++;
        } else if (t.type === 'expense') {
          expense += Number(t.amount || 0);
          expenseCount++;
        }
      });
      const balance = income - expense;

      const baseRate = vehicles.length > 0 ? (vehicles[0].dailyRate || 45000) : 0;
      const baseRateEl = document.getElementById('kpi-tarifas-base-rate');
      const baseRateBadgeEl = document.getElementById('kpi-tarifas-base-rate-badge');
      if (baseRateEl) baseRateEl.textContent = `$ ${baseRate.toLocaleString('es-CO')}`;
      if (baseRateBadgeEl) baseRateBadgeEl.textContent = vehicles.length > 0 ? 'Estándar' : 'Sin tarifa';

      const incomeEl = document.getElementById('kpi-tarifas-income');
      const incomeBadgeEl = document.getElementById('kpi-tarifas-income-badge');
      const incomeSubEl = document.getElementById('kpi-tarifas-income-sub');
      if (incomeEl) incomeEl.textContent = `$ ${income.toLocaleString('es-CO')}`;
      if (incomeBadgeEl) incomeBadgeEl.textContent = `${incomeCount} recaudos`;
      if (incomeSubEl) incomeSubEl.textContent = `${vehicles.filter(v => v.status === 'route').length} unidades liquidando`;

      const expenseEl = document.getElementById('kpi-tarifas-expense');
      const expenseBadgeEl = document.getElementById('kpi-tarifas-expense-badge');
      if (expenseEl) expenseEl.textContent = `$ ${expense.toLocaleString('es-CO')}`;
      if (expenseBadgeEl) expenseBadgeEl.textContent = `${expenseCount} registros`;

      const balanceEl = document.getElementById('kpi-tarifas-balance');
      const balanceBadgeEl = document.getElementById('kpi-tarifas-balance-badge');
      if (balanceEl) balanceEl.textContent = `$ ${balance.toLocaleString('es-CO')}`;
      if (balanceBadgeEl) balanceBadgeEl.textContent = `${accounts.length} cuentas`;

      const acctsGrid = document.getElementById('tarifas-accounts-cards-grid');
      if (acctsGrid) {
        acctsGrid.innerHTML = '';
        if (accounts.length === 0) {
          acctsGrid.innerHTML = `
            <div class="col-span-full p-gutter-md rounded bg-light-surface-container-low border border-dashed border-light-outline-variant text-center py-6">
              <p class="font-body text-body-sm text-light-on-surface-variant">No hay cuentas bancarias configuradas</p>
              <a href="#gastos" class="inline-flex items-center gap-1 text-xs text-light-primary font-bold hover:underline mt-1">
                <span class="material-symbols-outlined text-[14px]">add_circle</span>
                <span>Crear cuenta bancaria o digital</span>
              </a>
            </div>
          `;
        } else {
          accounts.forEach(acc => {
            const art = document.createElement('article');
            art.className = 'h-full bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-gutter-lg flex flex-col justify-between gap-gutter-md shadow-xs';
            const iconName = acc.type === 'Digital' ? 'smartphone' : (acc.type === 'Efectivo' ? 'point_of_sale' : 'account_balance');
            art.innerHTML = `
              <header class="flex items-start justify-between gap-gutter-sm">
                <div>
                  <h2 class="font-headline text-headline-sm text-light-on-surface">${acc.name}</h2>
                  <p class="font-body text-body-sm text-light-on-surface-variant">${acc.description || `${acc.type} · ${acc.number || ''}`}</p>
                </div>
                <span aria-hidden="true" class="material-symbols-outlined text-[20px] text-light-primary">${iconName}</span>
              </header>
              <div class="flex items-baseline justify-between gap-gutter-sm">
                <p class="font-headline text-headline-md text-light-on-surface tabular-nums font-bold">$ ${(acc.balance || 0).toLocaleString('es-CO')}</p>
              </div>
            `;
            acctsGrid.appendChild(art);
          });
        }
      }
    }

    renderTarifasMovements();
    renderTariffVehiclesTable();
    renderTarifasKPIs();
    window.addEventListener('motocontrol-data-updated', () => {
      renderTarifasMovements();
      renderTariffVehiclesTable();
      renderTarifasKPIs();
    });
  }

  // =========================================================================
  // 4. MANTENIMIENTOS E INVENTARIO (CON FILTROS Y BÚSQUEDA OPERATIVA)
  // =========================================================================
  function initMantenimientosLogic() {
    function switchMaintTab(target) {
      const isOrders = target === 'orders';
      const panelOrders = document.getElementById('panel-orders');
      const panelInventory = document.getElementById('panel-inventory');
      const tabOrders = document.getElementById('tab-maint-orders');
      const tabInventory = document.getElementById('tab-maint-inventory');

      if (panelOrders && panelInventory) {
        panelOrders.classList.toggle('hidden', !isOrders);
        panelOrders.classList.toggle('flex', isOrders);
        panelInventory.classList.toggle('hidden', isOrders);
        panelInventory.classList.toggle('flex', !isOrders);
      }

      if (tabOrders) {
        tabOrders.setAttribute('aria-selected', isOrders ? 'true' : 'false');
        tabOrders.className = isOrders
          ? 'main-tab inline-flex items-center gap-gutter-xs px-gutter-md py-2 rounded bg-light-surface-container-lowest text-light-on-surface font-label text-label-lg font-bold shadow-xs'
          : 'main-tab inline-flex items-center gap-gutter-xs px-gutter-md py-2 rounded bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container font-label text-label-lg transition-colors';
      }

      if (tabInventory) {
        tabInventory.setAttribute('aria-selected', !isOrders ? 'true' : 'false');
        tabInventory.className = !isOrders
          ? 'main-tab inline-flex items-center gap-gutter-xs px-gutter-md py-2 rounded bg-light-surface-container-lowest text-light-on-surface font-label text-label-lg font-bold shadow-xs'
          : 'main-tab inline-flex items-center gap-gutter-xs px-gutter-md py-2 rounded bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container font-label text-label-lg transition-colors';
      }

      if (!isOrders) renderStockTable();
    }

    document.querySelectorAll('.main-tab').forEach(tab => {
      tab.addEventListener('click', () => switchMaintTab(tab.dataset.mainTab));
    });

    let orderFilter = 'all';
    const ordersSearch = document.getElementById('orders-search');
    const ordersTableBody = document.getElementById('orders-table-body');

    function renderOrdersTable() {
      if (!ordersTableBody) return;
      const orders = MotoData.getMaintenanceOrders ? MotoData.getMaintenanceOrders() : [];
      const q = (ordersSearch?.value || '').trim().toLowerCase();

      ordersTableBody.innerHTML = '';
      let visible = 0;

      orders.forEach(o => {
        const orderType = (o.type || 'Preventivo').toLowerCase();
        const searchStr = `${o.plate} ${o.driver || ''} ${o.desc || ''} ${orderType}`.toLowerCase();

        let okType = false;
        if (orderFilter === 'all') okType = true;
        else if (orderFilter === 'Preventivo') okType = orderType.includes('preventivo');
        else if (orderFilter === 'Correctivo') okType = orderType.includes('correctivo');
        else if (orderFilter === 'Aceite') okType = searchStr.includes('aceite');
        else if (orderFilter === 'Frenos') okType = searchStr.includes('frenos');

        const okQ = !q || searchStr.includes(q);

        if (okType && okQ) {
          visible++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          tr.dataset.orderType = o.type;
          tr.dataset.search = searchStr;

          const isDone = o.status === 'done';
          const badgeClass = isDone ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container';

          tr.innerHTML = `
            <td class="px-gutter-md py-3">
              <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap font-bold">${o.plate}</p>
              <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${o.driver || '-'}</p>
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-label text-label-md text-light-primary whitespace-nowrap">${o.type || 'Preventivo'}</span>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${o.desc || '-'}</p>
              <p class="font-body text-body-sm text-light-outline whitespace-nowrap">${o.partsUsed || 'Mano de obra y repuestos'}</p>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-body text-body-md text-light-on-surface tabular-nums whitespace-nowrap">${o.date || '-'}</p>
              <p class="font-body text-body-sm text-light-outline tabular-nums whitespace-nowrap">${o.km ? `${o.km} km` : '-'}</p>
            </td>
            <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums whitespace-nowrap font-semibold">
              $ ${(o.cost || 0).toLocaleString('es-CO')}
            </td>
            <td class="px-gutter-md py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                ${isDone ? 'Terminado' : 'En taller'}
              </span>
            </td>
          `;
          ordersTableBody.appendChild(tr);
        }
      });

      if (visible === 0) {
        ordersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[44px] text-light-outline">build</span>
                <p class="font-headline text-headline-sm text-light-on-surface">No hay órdenes de mantenimiento en taller</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Programa órdenes preventivas (cambio de aceite, frenos) o correctivos de taller para tu flota.</p>
                <button type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2" onclick="document.getElementById('maint-modal')?.classList.remove('hidden'); document.getElementById('maint-modal')?.classList.add('flex');">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Registrar Primer Mantenimiento</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
    }

    if (ordersSearch) {
      ordersSearch.addEventListener('input', renderOrdersTable);
      ordersSearch.addEventListener('change', renderOrdersTable);
      ordersSearch.addEventListener('search', renderOrdersTable);
      ordersSearch.addEventListener('keyup', renderOrdersTable);
    }

    document.querySelectorAll('.order-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        orderFilter = btn.dataset.orderFilter;
        document.querySelectorAll('.order-filter-btn').forEach(b => {
          const active = b === btn;
          b.className = active
            ? 'order-filter-btn px-3 py-1.5 rounded font-label text-label-md bg-light-secondary-container text-light-on-secondary-container font-bold shadow-xs'
            : 'order-filter-btn px-3 py-1.5 rounded font-label text-label-md bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container';
        });
        renderOrdersTable();
      });
    });

    // Tabla de Repuestos en Stock
    function renderStockTable() {
      const stockBody = document.getElementById('stock-table-body');
      if (!stockBody) return;
      const parts = MotoData.getSpareParts ? MotoData.getSpareParts() : [];
      stockBody.innerHTML = '';
      if (parts.length === 0) {
        stockBody.innerHTML = `
          <tr>
            <td colspan="7" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[44px] text-light-outline">inventory_2</span>
                <p class="font-headline text-headline-sm text-light-on-surface">Inventario de repuestos vacío</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Ingresa aceites, bandas, filtros o repuestos para controlar las existencias de tu flota.</p>
                <button type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2" onclick="document.getElementById('spare-part-modal')?.classList.remove('hidden'); document.getElementById('spare-part-modal')?.classList.add('flex');">
                  <span class="material-symbols-outlined text-[18px]">add_box</span>
                  <span>Ingresar Primer Repuesto</span>
                </button>
              </div>
            </td>
          </tr>
        `;
        return;
      }
      parts.forEach(p => {
        const isLow = p.stock <= p.min;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
        tr.innerHTML = `
          <td class="px-gutter-md py-3"><span class="font-mono text-mono-md text-light-outline">${p.code}</span></td>
          <td class="px-gutter-md py-3 font-body font-semibold text-light-on-surface">${p.name}</td>
          <td class="px-gutter-md py-3"><span class="font-label text-label-sm px-2 py-0.5 rounded bg-light-surface-container">${p.category}</span></td>
          <td class="px-gutter-md py-3 font-mono text-mono-md ${isLow ? 'text-light-error font-bold' : 'text-light-on-surface'} tabular-nums">${p.stock} und.</td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-outline tabular-nums">${p.min} und.</td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums">$ ${(p.price || 0).toLocaleString('es-CO')}</td>
          <td class="px-gutter-md py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-light-error-container text-light-on-error-container' : 'bg-success-container text-on-success-container'}">
              ${isLow ? 'Bajo stock' : 'Disponible'}
            </span>
          </td>
        `;
        stockBody.appendChild(tr);
      });
    }

    // Modal Ingresar Nuevo Repuesto
    const partModal = document.getElementById('spare-part-modal');
    function togglePartModal(show) {
      if (!partModal) return;
      partModal.classList.toggle('hidden', !show);
      partModal.classList.toggle('flex', show);
    }

    document.getElementById('open-part-modal-btn')?.addEventListener('click', () => togglePartModal(true));
    (document.getElementById('close-spare-part-modal-btn') || document.getElementById('close-part-modal-btn'))?.addEventListener('click', () => togglePartModal(false));
    (document.getElementById('cancel-spare-part-btn') || document.getElementById('cancel-part-btn'))?.addEventListener('click', () => togglePartModal(false));

    const partForm = document.getElementById('spare-part-form');
    if (partForm) {
      partForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = (document.getElementById('sp-code') || document.getElementById('part-code'))?.value.trim() || `REP-${Date.now().toString().slice(-4)}`;
        const name = (document.getElementById('sp-name') || document.getElementById('part-name'))?.value.trim();
        const category = (document.getElementById('sp-category') || document.getElementById('part-category'))?.value || 'Lubricantes';
        const stock = Number((document.getElementById('sp-qty') || document.getElementById('part-stock'))?.value || 1);
        const min = Number((document.getElementById('sp-min-stock') || document.getElementById('part-min'))?.value || 1);
        const price = Number((document.getElementById('sp-price') || document.getElementById('part-price'))?.value || 0);

        MotoData.addSparePart({ code, name, category, stock, min, price });
        togglePartModal(false);
        renderStockTable();
        alert(`¡Repuesto "${name}" registrado en stock exitosamente!`);
      });
    }

    // Modal Nuevo Tipo de Mantenimiento
    const maintTypeModal = document.getElementById('new-maint-type-modal');
    function toggleMaintTypeModal(show) {
      if (!maintTypeModal) return;
      maintTypeModal.classList.toggle('hidden', !show);
      maintTypeModal.classList.toggle('flex', show);
    }

    document.getElementById('btn-open-new-maint-type')?.addEventListener('click', () => toggleMaintTypeModal(true));
    document.getElementById('close-maint-type-modal-btn')?.addEventListener('click', () => toggleMaintTypeModal(false));
    document.getElementById('cancel-maint-type-btn')?.addEventListener('click', () => toggleMaintTypeModal(false));

    const maintTypeForm = document.getElementById('new-maint-type-form');
    if (maintTypeForm) {
      maintTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('mt-name')?.value.trim();
        const classification = document.getElementById('mt-classification')?.value;
        const frequencyKm = Number(document.getElementById('mt-freq')?.value || 0);
        const estLabor = Number(document.getElementById('mt-labor')?.value || 0);
        const desc = document.getElementById('mt-desc')?.value.trim();

        MotoData.addMaintenanceType({ name, classification, frequencyKm, estLabor, desc });
        toggleMaintTypeModal(false);
        alert(`¡Nuevo tipo de mantenimiento "${name}" configurado exitosamente!`);
      });
    }

    // Modal Mantenimiento con auto-carga de placa por conductor y color
    const maintModal = document.getElementById('maint-modal');
    function toggleMaintModal(show) {
      if (!maintModal) return;
      maintModal.classList.toggle('hidden', !show);
      maintModal.classList.toggle('flex', show);
    }

    document.getElementById('open-maint-modal-btn')?.addEventListener('click', () => toggleMaintModal(true));
    document.getElementById('close-maint-modal-btn')?.addEventListener('click', () => toggleMaintModal(false));
    document.getElementById('cancel-maint-btn')?.addEventListener('click', () => toggleMaintModal(false));

    setupVehicleAutoFiller({
      driverSelectId: 'maint-modal-driver',
      colorSelectId: 'maint-modal-color',
      plateSelectId: 'maint-modal-plate',
      badgeId: 'maint-modal-auto-badge'
    });

    const maintForm = document.getElementById('maint-form');
    if (maintForm) {
      maintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = document.getElementById('maint-modal-plate')?.value;
        const cost = Number(maintForm.querySelector('input[type="number"]')?.value || 150000);
        const desc = maintForm.querySelector('input[type="text"]')?.value || 'Mantenimiento preventivo';

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }

        const vehicles = MotoData.getVehicles();
        const v = vehicles.find(veh => veh.plate === plate) || {};

        MotoData.addMaintenanceOrder({
          plate: plate,
          driver: v.driver || 'Conductor',
          cost: cost,
          desc: desc,
          type: 'Preventivo',
          date: new Date().toISOString().split('T')[0],
          status: 'scheduled'
        });

        toggleMaintModal(false);
        renderOrdersTable();
        alert(`Orden de mantenimiento programada para ${plate}.`);
      });
    }

    renderOrdersTable();
    window.addEventListener('motocontrol-data-updated', () => {
      renderOrdersTable();
      renderStockTable();
    });
  }

  // =========================================================================
  // 5. CONTROL DE DOCUMENTACIÓN LEGAL (CON CÉDULAS DE CONDUCTOR)
  // =========================================================================
  function initDocumentacionLogic() {
    let typeFilter = 'all';
    const searchInput = document.getElementById('doc-search');
    const stateSelect = document.getElementById('doc-state-filter');
    const countLabel = document.getElementById('doc-count-label');
    const tableBody = document.getElementById('docs-table-body');

    function renderDocsTable() {
      if (!tableBody) return;
      const docs = MotoData.getDocuments ? MotoData.getDocuments() : [];
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
      const vehMap = {};
      vehicles.forEach(v => { vehMap[v.plate] = v; });

      const q = (searchInput?.value || '').trim().toLowerCase();
      const st = stateSelect ? stateSelect.value : 'all';
      let visible = 0;

      tableBody.innerHTML = '';
      docs.forEach(doc => {
        const v = vehMap[doc.plate] || {};
        const driverName = doc.driver || v.driver || 'Sin conductor';
        const driverCedula = doc.cedula || v.cedula || '-';
        const vColor = v.color || 'Azul';
        const isSalmon = vColor.toLowerCase().includes('salm') || vColor.toLowerCase().includes('salmon');
        const colorBadge = isSalmon
          ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-[#FFE5DB] text-[#7F4025] font-semibold border border-[#9C573A]/20">🟠 Salmón</span>'
          : '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-[#E0F2FE] text-[#0369A1] font-semibold border border-[#38BDF8]/30">🔵 Azul</span>';

        const cedulaDisplay = (driverName !== 'Sin conductor' && driverCedula && driverCedula !== '-')
          ? `<p class="font-mono text-body-xs text-light-primary font-semibold whitespace-nowrap">C.C. ${driverCedula}</p>`
          : '';

        const okType = typeFilter === 'all' || doc.type === typeFilter;
        let docState = doc.status || 'valid';
        if (docState === 'expiring') docState = 'soon';
        const okState = st === 'all' || docState === st;
        const searchTarget = `${doc.plate} ${driverName} ${driverCedula} ${doc.type} ${doc.entity || ''} ${doc.number || ''}`.toLowerCase();
        const okQ = !q || searchTarget.includes(q);

        if (okType && okState && okQ) {
          visible++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          tr.dataset.docState = docState;
          tr.dataset.docType = doc.type;
          tr.dataset.search = searchTarget;

          let badgeHtml = '';
          if (docState === 'expired') {
            badgeHtml = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-light-error-container text-light-on-error-container font-label text-label-sm font-semibold">Vencido</span>';
          } else if (docState === 'soon' || docState === 'expiring') {
            badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-warning-container text-on-warning-container font-label text-label-sm font-semibold">${doc.statusText || 'Por vencer'}</span>`;
          } else {
            badgeHtml = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container font-label text-label-sm font-semibold">Vigente</span>';
          }

          tr.innerHTML = `
            <td class="px-gutter-md py-3">
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-mono-md text-light-on-surface font-bold whitespace-nowrap">${doc.plate}</span>
                ${colorBadge}
              </div>
              <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${driverName}</p>
              ${cedulaDisplay}
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-label text-label-md text-light-on-surface whitespace-nowrap">${doc.type}</span>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${doc.entity || 'Entidad autorizada'}</p>
              <p class="font-mono text-mono-md text-light-outline whitespace-nowrap">${doc.number || '-'}</p>
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-body text-body-md text-light-on-surface tabular-nums whitespace-nowrap">${doc.expiry || '-'}</span>
            </td>
            <td class="px-gutter-md py-3">${badgeHtml}</td>
            <td class="px-gutter-md py-3 text-right">
              <button class="renew-doc-btn font-label text-label-md text-light-primary hover:underline whitespace-nowrap" data-doc="${doc.type}" data-plate="${doc.plate}" type="button">${docState === 'expired' ? 'Renovar' : 'Actualizar'}</button>
            </td>
          `;
          tableBody.appendChild(tr);
        }
      });

      if (visible === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[44px] text-light-outline">description</span>
                <p class="font-headline text-headline-sm text-light-on-surface">No hay pólizas ni certificados registrados</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Registra la vigencia del SOAT y Tecnomecánica CDA de tus motocarros para recibir alertas automáticas.</p>
                <a href="#form-soat" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2">
                  <span class="material-symbols-outlined text-[18px]">note_add</span>
                  <span>Registrar Primer Documento</span>
                </a>
              </div>
            </td>
          </tr>
        `;
      }

      if (countLabel) {
        countLabel.textContent = `Mostrando ${visible} registro${visible === 1 ? '' : 's'} documental${visible === 1 ? '' : 'es'}`;
      }

      tableBody.querySelectorAll('.renew-doc-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleDocModal(true, btn.dataset.plate, btn.dataset.doc));
      });
    }

    if (searchInput) searchInput.addEventListener('input', renderDocsTable);
    if (stateSelect) stateSelect.addEventListener('change', renderDocsTable);

    document.querySelectorAll('.doc-type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        typeFilter = tab.dataset.typeFilter;
        document.querySelectorAll('.doc-type-tab').forEach(t => {
          const active = t === tab;
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          t.className = active
            ? 'doc-type-tab px-3 py-1 rounded font-label text-label-sm bg-light-surface-container-lowest text-light-on-surface font-bold'
            : 'doc-type-tab px-3 py-1 rounded font-label text-label-sm text-light-on-surface-variant hover:text-light-on-surface';
        });
        renderDocsTable();
      });
    });

    const docModal = document.getElementById('doc-modal');
    const modalPlate = document.getElementById('modal-doc-plate');
    const modalDoc = document.getElementById('modal-doc-type');

    function toggleDocModal(show, plate = '', docType = '') {
      if (!docModal) return;
      if (show) {
        if (plate && modalPlate) modalPlate.value = plate;
        if (docType && modalDoc) modalDoc.value = docType;
        docModal.classList.remove('hidden');
        docModal.classList.add('flex');
      } else {
        docModal.classList.add('hidden');
        docModal.classList.remove('flex');
      }
    }

    document.getElementById('open-doc-modal-btn')?.addEventListener('click', () => navigateTo('form-soat'));
    document.getElementById('close-doc-modal-btn')?.addEventListener('click', () => toggleDocModal(false));
    document.getElementById('cancel-doc-btn')?.addEventListener('click', () => toggleDocModal(false));

    setupVehicleAutoFiller({
      driverSelectId: 'doc-modal-driver',
      colorSelectId: 'doc-modal-color',
      plateSelectId: 'modal-doc-plate',
      badgeId: 'doc-modal-auto-badge'
    });

    const docModalForm = document.getElementById('doc-modal-form');
    if (docModalForm) {
      docModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = modalPlate?.value || 'MCT-109';
        const type = modalDoc?.value || 'SOAT';
        const number = document.getElementById('modal-doc-number')?.value.trim() || `POL-${Date.now().toString().slice(-6)}`;
        const expiry = document.getElementById('modal-doc-expiry')?.value || '2027-11-22';
        const cost = Number(document.getElementById('modal-doc-cost')?.value || 615000);

        const vehicles = MotoData.getVehicles();
        const v = vehicles.find(veh => veh.plate === plate) || {};

        MotoData.addDocument({
          plate: plate,
          driver: v.driver || 'Conductor asignado',
          cedula: v.cedula || '-',
          type: type,
          entity: type === 'SOAT' ? 'Seguros Sura' : 'CDA Central',
          number: number,
          expiry: expiry,
          status: 'valid',
          statusText: 'Vigente',
          cost: cost
        });

        MotoData.addTransaction({
          type: 'expense',
          account: 'Bancolombia Ahorros',
          plate: plate,
          driver: v.driver || 'Conductor asignado',
          category: 'SOAT / Tecnomecánica',
          concept: `Renovación ${type} ${plate} (${number})`,
          amount: cost,
          date: new Date().toISOString().split('T')[0]
        });

        toggleDocModal(false);
        renderDocsTable();
        alert(`Renovación de ${type} para ${plate} guardada con éxito.`);
      });
    }

    renderDocsTable();
  }

  // =========================================================================
  // 6. GASTOS Y CUENTAS (CON FILTROS OPERATIVOS POR CUENTA, CATEGORÍA Y FECHAS)
  // =========================================================================
  function initGastosLogic() {
    const acctFilter = document.getElementById('filter-account');
    const catFilter = document.getElementById('filter-category');
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');
    const clearBtn = document.getElementById('btn-clear-gastos-filters');
    const countEl = document.getElementById('ledger-count');
    const ledgerBody = document.getElementById('ledger-body');

    function renderLedgerTable() {
      if (!ledgerBody) return;
      const txs = MotoData.getTransactions ? MotoData.getTransactions() : [];
      const a = acctFilter ? acctFilter.value.toLowerCase() : 'all';
      const c = catFilter ? catFilter.value.toLowerCase() : 'all';
      const dFrom = dateFrom ? dateFrom.value : '';
      const dTo = dateTo ? dateTo.value : '';

      ledgerBody.innerHTML = '';
      let visible = 0;

      txs.forEach(t => {
        const rowAccount = (t.account || '').toLowerCase();
        const rowCat = (t.category || (t.type === 'income' ? 'Ingreso' : 'Gasto')).toLowerCase();
        const rowDate = t.date || '';

        const okAccount = a === 'all' || rowAccount.includes(a);
        const okCat = c === 'all' || rowCat.includes(c);
        let okDate = true;
        if (dFrom && rowDate && rowDate < dFrom) okDate = false;
        if (dTo && rowDate && rowDate > dTo) okDate = false;

        if (okAccount && okCat && okDate) {
          visible++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          tr.dataset.account = t.account;
          tr.dataset.category = t.category;
          tr.dataset.date = t.date;
          const isInc = t.type === 'income';

          tr.innerHTML = `
            <td class="px-gutter-md py-3">
              <span class="font-body text-body-sm text-light-outline tabular-nums whitespace-nowrap">${t.date || '-'}</span>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.concept || '-'}</p>
              <p class="font-mono text-body-xs text-light-outline">${t.plate || 'General'}${t.driver ? ' · ' + t.driver : ''}</p>
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-label text-label-sm px-2 py-0.5 rounded ${isInc ? 'bg-success-container text-on-success-container' : 'bg-light-surface-container text-light-on-surface-variant'}">${t.category || (isInc ? 'Ingreso' : 'Operativo')}</span>
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-body text-body-sm text-light-on-surface whitespace-nowrap">${t.account || '-'}</span>
            </td>
            <td class="px-gutter-md py-3 text-right">
              <span class="font-mono text-mono-md font-semibold ${isInc ? 'text-success' : 'text-light-error'} tabular-nums whitespace-nowrap">
                ${isInc ? '+' : '-'} $ ${(t.amount || 0).toLocaleString('es-CO')}
              </span>
            </td>
          `;
          ledgerBody.appendChild(tr);
        }
      });

      if (visible === 0) {
        ledgerBody.innerHTML = `
          <tr>
            <td colspan="5" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[44px] text-light-outline">account_balance_wallet</span>
                <p class="font-headline text-headline-sm text-light-on-surface">No hay movimientos en el libro contable</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Registra ingresos por tarifas diarias o gastos de taller, repuestos y pólizas para llevar el control financiero.</p>
                <a href="#form-movimiento" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Registrar Primer Movimiento</span>
                </a>
              </div>
            </td>
          </tr>
        `;
      }

      if (countEl) countEl.textContent = `Mostrando ${visible} movimiento${visible === 1 ? '' : 's'}`;
    }

    if (acctFilter) acctFilter.addEventListener('change', renderLedgerTable);
    if (catFilter) catFilter.addEventListener('change', renderLedgerTable);
    if (dateFrom) dateFrom.addEventListener('change', renderLedgerTable);
    if (dateTo) dateTo.addEventListener('change', renderLedgerTable);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (acctFilter) acctFilter.value = 'all';
        if (catFilter) catFilter.value = 'all';
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        renderLedgerTable();
      });
    }

    // Renderizado dinámico de tarjetas de cuentas activas
    function renderAccountsCards() {
      const grid = document.getElementById('accounts-cards-grid');
      if (!grid) return;
      const accountsList = MotoData.getAccounts ? MotoData.getAccounts() : [];
      const txs = MotoData.getTransactions ? MotoData.getTransactions() : [];

      grid.innerHTML = '';

      if (accountsList.length === 0) {
        grid.innerHTML = `
          <div class="md:col-span-3 p-gutter-lg rounded-md border border-dashed border-light-outline-variant bg-light-surface-container-lowest text-center py-10">
            <div class="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
              <span class="material-symbols-outlined text-[40px] text-light-outline">account_balance</span>
              <p class="font-headline text-headline-sm text-light-on-surface">No tienes cuentas de dinero configuradas</p>
              <p class="text-sm text-light-on-surface-variant">Crea tus cuentas de Bancolombia, Nequi, Daviplata o Caja Efectivo para registrar y conciliar tus fondos.</p>
              <button type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2" onclick="document.getElementById('new-account-modal')?.classList.remove('hidden'); document.getElementById('new-account-modal')?.classList.add('flex'); document.getElementById('acct-name')?.focus();">
                <span class="material-symbols-outlined text-[18px]">account_balance</span>
                <span>Crear Primera Cuenta</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      accountsList.forEach(acc => {
        let inc = 0;
        let exp = 0;
        txs.forEach(t => {
          if ((t.account || '').toLowerCase() === acc.name.toLowerCase()) {
            if (t.type === 'income') inc += Number(t.amount || 0);
            else if (t.type === 'expense') exp += Number(t.amount || 0);
          }
        });

        const iconName = acc.type === 'Digital' ? 'smartphone' : (acc.type === 'Efectivo' ? 'point_of_sale' : 'account_balance');
        const card = document.createElement('article');
        card.className = 'h-full bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-gutter-lg flex flex-col justify-between gap-gutter-md shadow-xs';
        card.innerHTML = `
          <header class="flex items-start justify-between gap-gutter-sm">
            <div>
              <h3 class="font-headline text-headline-sm text-light-on-surface font-bold">${acc.name}</h3>
              <p class="font-body text-body-sm text-light-on-surface-variant">${acc.description || `${acc.type} · ${acc.number || ''}`}</p>
            </div>
            <span class="material-symbols-outlined text-[22px] text-light-primary p-2 rounded-full bg-light-secondary-container/40">${iconName}</span>
          </header>
          <div>
            <p class="font-headline text-headline-md text-light-on-surface tabular-nums font-bold">$ ${(acc.balance || 0).toLocaleString('es-CO')}</p>
          </div>
          <footer class="pt-gutter-sm border-t border-light-outline-variant flex items-center justify-between gap-gutter-sm">
            <span class="font-body text-body-sm text-success tabular-nums font-medium">+$ ${inc.toLocaleString('es-CO')}</span>
            <span class="font-body text-body-sm text-light-error tabular-nums font-medium">-$ ${exp.toLocaleString('es-CO')}</span>
          </footer>
        `;
        grid.appendChild(card);
      });
    }

    // Modal para Crear Nueva Cuenta Bancaria / Billetera / Caja
    const newAccountModal = document.getElementById('new-account-modal');
    function toggleNewAccountModal(show) {
      if (!newAccountModal) return;
      newAccountModal.classList.toggle('hidden', !show);
      newAccountModal.classList.toggle('flex', show);
      if (show) {
        document.getElementById('acct-name')?.focus();
      }
    }

    document.getElementById('open-account-modal-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNewAccountModal(true);
    });
    document.getElementById('close-account-modal-btn')?.addEventListener('click', () => toggleNewAccountModal(false));
    document.getElementById('cancel-account-modal-btn')?.addEventListener('click', () => toggleNewAccountModal(false));

    const newAccountForm = document.getElementById('new-account-form');
    if (newAccountForm) {
      newAccountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('acct-name')?.value.trim();
        const type = document.getElementById('acct-type')?.value;
        const bank = document.getElementById('acct-bank')?.value.trim();
        const number = document.getElementById('acct-number')?.value.trim();
        const balance = Number(document.getElementById('acct-balance')?.value || 0);
        const desc = document.getElementById('acct-desc')?.value.trim();

        if (!name) {
          alert('Por favor ingresa el nombre de la cuenta.');
          return;
        }

        if (MotoData.addAccount) {
          const res = MotoData.addAccount({ name, type, bank, number, balance, description: desc });
          if (!res.success) {
            alert(res.message);
            return;
          }
        }

        toggleNewAccountModal(false);
        newAccountForm.reset();
        renderAccountsCards();
        populateDynamicSelects();
        renderLedgerTable();
        alert(`¡Cuenta "${name}" agregada exitosamente con saldo inicial de $ ${balance.toLocaleString('es-CO')}!`);
      });
    }

    renderAccountsCards();
    renderLedgerTable();
    window.addEventListener('motocontrol-data-updated', () => {
      renderAccountsCards();
      renderLedgerTable();
    });
  }

  // =========================================================================
  // 7. FORMULARIOS DE REGISTRO Y OPERACIÓN
  // =========================================================================
  function initFormsLogic() {
    // Formulario Motocarro y Conductor
    const formMoto = document.getElementById('motocarro-form') || document.getElementById('form-motocarro');
    const sinConductorToggle = document.getElementById('sin-conductor-toggle');
    const conductorFields = document.getElementById('conductor-fields');
    const nombreConductor = document.getElementById('nombre-conductor');
    const cedula = document.getElementById('cedula');
    const telefono = document.getElementById('telefono');
    const intercaladoBadge = document.getElementById('conductor-intercalado-badge');
    const intercaladoBadgeText = document.getElementById('conductor-intercalado-badge-text');

    if (sinConductorToggle) {
      sinConductorToggle.addEventListener('change', () => {
        const disabled = sinConductorToggle.checked;
        if (conductorFields) conductorFields.classList.toggle('opacity-50', disabled);
        [nombreConductor, cedula, telefono].forEach(input => {
          if (input) {
            input.disabled = disabled;
            if (disabled) input.removeAttribute('required');
            else input.setAttribute('required', '');
          }
        });
        if (disabled && intercaladoBadge) {
          intercaladoBadge.classList.add('hidden');
          intercaladoBadge.classList.remove('flex');
        }
      });
    }

    // Detección automática al escribir o seleccionar un conductor existente (turno intercalado)
    if (nombreConductor) {
      nombreConductor.addEventListener('input', () => {
        const val = nombreConductor.value.trim();
        const details = MotoData.getDriverDetails ? MotoData.getDriverDetails(val) : null;
        const existingVehicles = MotoData.getDriverVehicles ? MotoData.getDriverVehicles(val) : [];

        if (details) {
          if (cedula && details.cedula && details.cedula !== '-') cedula.value = details.cedula;
          if (telefono && details.phone && details.phone !== '-') telefono.value = details.phone;
        }

        if (existingVehicles.length > 0) {
          if (intercaladoBadge) {
            intercaladoBadge.classList.remove('hidden');
            intercaladoBadge.classList.add('flex');
            if (intercaladoBadgeText) {
              const plates = existingVehicles.map(v => `${v.plate} (${v.color})`).join(', ');
              intercaladoBadgeText.textContent = `Conductor activo en ${plates}. Se asociará para turno intercalado (1 día sí y 1 día no).`;
            }
          }
        } else {
          if (intercaladoBadge) {
            intercaladoBadge.classList.add('hidden');
            intercaladoBadge.classList.remove('flex');
          }
        }
      });
    }

    if (formMoto) {
      formMoto.addEventListener('submit', (e) => {
        e.preventDefault();
        const placa = (document.getElementById('placa')?.value || 'MCT-999').toUpperCase().trim();
        const colorRadio = document.querySelector('input[name=\"colorVehiculo\"]:checked') || document.querySelector('input[name=\"color-motocarro\"]:checked');
        const color = colorRadio ? colorRadio.value : 'Azul';
        const modelo = (document.getElementById('marca-modelo') || document.getElementById('modelo'))?.value || 'Bajaj RE 4S';
        const anio = document.getElementById('anio')?.value || '2026';
        const conductor = sinConductorToggle?.checked ? 'Sin conductor' : (nombreConductor?.value.trim() || 'Sin conductor');
        const cc = sinConductorToggle?.checked ? '-' : (cedula?.value.trim() || 'Sin registrar');
        const tel = sinConductorToggle?.checked ? '-' : (telefono?.value.trim() || '-');
        const lic = document.getElementById('licencia')?.value || 'A2';
        const venceLic = document.getElementById('vence-licencia')?.value || '2028-04-15';
        const tarifa = Number(document.getElementById('tarifa-asignada')?.value || 45000);

        MotoData.addVehicle({
          plate: placa,
          color: color,
          model: `${modelo} (${anio})`,
          driver: conductor,
          cedula: cc,
          phone: tel,
          license: lic,
          venceLicencia: venceLic,
          dailyRate: tarifa,
          status: conductor === 'Sin conductor' ? 'idle' : 'route',
          statusText: conductor === 'Sin conductor' ? 'Sin conductor' : 'En ruta',
          soatExpiry: 'Vigente',
          tecnoExpiry: 'Vigente',
          km: 100
        });

        alert(`¡Motocarro ${placa} color ${color} con conductor ${conductor} (C.C. ${cc}) registrado exitosamente!`);
        navigateTo('flota');
        populateDynamicSelects();
      });
    }

    // Formulario Configurar Tarifa (CON CÁLCULO PARA TURNO INTERCALADO 1 DÍA SÍ, 1 DÍA NO)
    const valorDiario = document.getElementById('valor-diario');
    const valorDominical = document.getElementById('valor-dominical');
    const proyeccion = document.getElementById('proyeccion-semanal');
    const proyMes = document.getElementById('proyeccion-mensual');
    const proyDet = document.getElementById('proyeccion-detalle');
    const selectedCount = document.getElementById('selected-count');

    function updateProjection() {
      const diario = Number(valorDiario?.value || 0);
      const dom = Number(valorDominical?.value || 0);

      // Turno intercalado: 1 día sí y 1 día no
      // Promedio semanal de 3.5 días laborados (3 ordinarios + 1 domingo alterno quincenal)
      const semanal = Math.round(diario * 3 + dom * 0.5);
      // Promedio mensual de 15 días laborados (13 ordinarios + 2 domingos)
      const mensual = Math.round(diario * 13 + dom * 2);

      if (proyeccion) proyeccion.textContent = '$ ' + semanal.toLocaleString('es-CO');
      if (proyMes) proyMes.textContent = `Est. mensual: $ ${mensual.toLocaleString('es-CO')} (15 turnos)`;
      if (proyDet) proyDet.textContent = `Turno intercalado: 3 ordinarios ($${(diario*3).toLocaleString('es-CO')}) + 1 domingo alterno ($${Math.round(dom*0.5).toLocaleString('es-CO')})`;
    }

    function updateTarifaCount() {
      const checkboxes = document.querySelectorAll('.tarifa-vehiculo');
      const count = Array.from(checkboxes).filter(c => c.checked).length;
      if (selectedCount) selectedCount.textContent = `${count} seleccionado${count === 1 ? '' : 's'}`;
    }

    if (valorDiario) valorDiario.addEventListener('input', updateProjection);
    if (valorDominical) valorDominical.addEventListener('input', updateProjection);

    const formTarifa = document.getElementById('tarifa-form') || document.getElementById('form-tarifa');
    if (formTarifa) {
      formTarifa.addEventListener('submit', (e) => {
        e.preventDefault();
        const nom = document.getElementById('nombre-tarifa')?.value || 'Tarifa Personalizada';
        const val = Number(valorDiario?.value || 58000);
        alert(`¡Tarifa "${nom}" ($${val.toLocaleString('es-CO')}/día en turno intercalado) guardada con éxito!`);
        navigateTo('tarifas');
      });
    }

    updateProjection();

    // Formulario Mantenimiento y Repuestos
    setupVehicleAutoFiller({
      driverSelectId: 'maint-filter-driver',
      colorSelectId: 'maint-filter-color',
      plateSelectId: 'maint-motocarro',
      badgeId: 'maint-auto-badge',
      badgeTextId: 'maint-auto-badge-text'
    });

    const formMantenimiento = document.getElementById('mant-form') || document.getElementById('form-mantenimiento');
    if (formMantenimiento) {
      formMantenimiento.addEventListener('submit', (e) => {
        e.preventDefault();
        const placa = document.getElementById('maint-motocarro')?.value || 'MCT-305';
        const tipo = (document.getElementById('mant-clasificacion') || document.getElementById('tipo-mantenimiento'))?.value || 'Preventivo';
        const costo = Number((document.getElementById('mano-obra') || document.getElementById('costo-estimado'))?.value || 65000);
        const desc = (document.getElementById('proximo-preventivo') || document.getElementById('descripcion-trabajo'))?.value || 'Mantenimiento preventivo';
        const cuenta = document.getElementById('cuenta-pago')?.value || 'Caja Efectivo';

        MotoData.addMaintenanceOrder({
          plate: placa,
          type: tipo,
          desc: desc,
          cost: costo,
          date: new Date().toISOString().split('T')[0],
          status: 'scheduled'
        });

        MotoData.addTransaction({
          type: 'expense',
          account: cuenta,
          plate: placa,
          category: 'Mantenimiento',
          concept: `${tipo}: ${desc}`,
          amount: costo,
          date: new Date().toISOString().split('T')[0]
        });

        const detail = document.getElementById('feedback-detail');
        if (detail) detail.textContent = `Orden agendada para ${placa}. Costo estimado: $ ${costo.toLocaleString('es-CO')}.`;
        const fb = document.getElementById('mant-feedback') || document.getElementById('maint-feedback');
        if (fb) fb.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Formulario SOAT / Tecnomecánica
    setupVehicleAutoFiller({
      driverSelectId: 'doc-filter-driver',
      colorSelectId: 'doc-filter-color',
      plateSelectId: 'doc-motocarro',
      badgeId: 'doc-auto-badge',
      badgeTextId: 'doc-auto-badge-text'
    });

    const docForm = document.getElementById('doc-form');
    if (docForm) {
      docForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('doc-tipo')?.value || 'SOAT';
        const placa = document.getElementById('doc-motocarro')?.value || 'MCT-109';
        const vence = document.getElementById('doc-vencimiento')?.value || '2027-11-20';
        const val = Number(document.getElementById('doc-valor')?.value || 615000);
        const cuenta = document.getElementById('doc-cuenta')?.value || 'Bancolombia Ahorros';
        const numero = document.getElementById('doc-numero')?.value.trim() || `POL-${Date.now().toString().slice(-6)}`;
        const entidad = document.getElementById('doc-entidad')?.value.trim() || 'Seguros Bolívar';

        const vehicles = MotoData.getVehicles();
        const v = vehicles.find(veh => veh.plate === placa) || {};

        MotoData.addDocument({
          plate: placa,
          driver: v.driver || 'Conductor asignado',
          cedula: v.cedula || '-',
          type: tipo,
          entity: entidad,
          number: numero,
          cost: val,
          expiry: vence,
          status: 'valid',
          statusText: 'Vigente'
        });

        MotoData.addTransaction({
          type: 'expense',
          account: cuenta,
          plate: placa,
          driver: v.driver || 'Conductor asignado',
          category: 'SOAT / Tecnomecánica',
          concept: `Renovación ${tipo} ${placa} (${numero})`,
          amount: val,
          date: new Date().toISOString().split('T')[0]
        });

        const detail = document.getElementById('doc-feedback-detail');
        if (detail) detail.textContent = `${tipo} de ${placa} (${v.driver || ''}) vigente hasta ${vence}.`;
        const fb = document.getElementById('doc-feedback');
        if (fb) fb.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Formulario Gasto o Movimiento
    setupVehicleAutoFiller({
      driverSelectId: 'mov-filter-driver',
      colorSelectId: 'mov-filter-color',
      plateSelectId: 'mov-motocarro',
      badgeId: 'mov-auto-badge',
      badgeTextId: 'mov-auto-badge-text'
    });

    const formMovimiento = document.getElementById('mov-form') || document.getElementById('form-movimiento');
    if (formMovimiento) {
      formMovimiento.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipoRadio = document.querySelector('input[name="tipo-movimiento"]:checked');
        const esIngreso = tipoRadio ? tipoRadio.value === 'ingreso' : false;
        const cuenta = document.getElementById('mov-cuenta')?.value || 'Caja Efectivo';
        const categoria = document.getElementById('mov-categoria')?.value || 'Operativo';
        const placa = document.getElementById('mov-motocarro')?.value || 'General flota';
        const monto = Number(document.getElementById('mov-monto')?.value || 50000);
        const concepto = (document.getElementById('mov-descripcion') || document.getElementById('mov-concepto'))?.value.trim() || 'Movimiento de caja';
        const fecha = document.getElementById('mov-fecha')?.value || new Date().toISOString().split('T')[0];

        const vehicles = MotoData.getVehicles();
        const v = vehicles.find(veh => veh.plate === placa) || {};

        MotoData.addTransaction({
          type: esIngreso ? 'income' : 'expense',
          account: cuenta,
          category: categoria,
          plate: placa,
          driver: v.driver || 'Conductor',
          concept: concepto,
          amount: monto,
          date: fecha
        });

        alert(`¡Movimiento de ${esIngreso ? 'ingreso' : 'egreso'} por $${monto.toLocaleString('es-CO')} registrado con éxito!`);
        navigateTo('gastos');
      });
    }
  }

  // =========================================================================
  // ARRANQUE DE LA APLICACIÓN
  // =========================================================================
  function initApp() {
    MotoData.init();
    initAuthLogic();
    populateDynamicSelects();

    initDashboardLogic();
    initFlotaLogic();
    initTarifasLogic();
    initMantenimientosLogic();
    initDocumentacionLogic();
    initGastosLogic();
    initFormsLogic();

    const initialRoute = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(initialRoute);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
