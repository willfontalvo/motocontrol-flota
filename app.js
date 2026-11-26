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
  // IMPORTANTE: usar window.MotoData que es definido por firebase_manager.js
  // No declarar una variable local para no sombear el objeto global
  if (!window.MotoData) {
    window.MotoData = {
      data: { vehicles: [], transactions: [], maintenanceOrders: [], documents: [], accounts: [], spareParts: [], maintenanceTypes: [] },
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
  }
  const MotoData = window.MotoData;

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
          if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
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
    if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
    const todayStr = (window.MotoData && window.MotoData.getTodayLocalISO) ? window.MotoData.getTodayLocalISO() : new Date().toISOString().split('T')[0];
    if (viewId === 'form-movimiento') {
      const mf = document.getElementById('mov-fecha');
      if (mf && !mf.value) mf.value = todayStr;
    } else if (viewId === 'form-tarifa') {
      const vf = document.getElementById('vigencia-desde');
      if (vf && !vf.value) vf.value = todayStr;
    } else if (viewId === 'form-mantenimiento') {
      const mtf = document.getElementById('mant-fecha');
      if (mtf && !mtf.value) mtf.value = todayStr;
    } else if (viewId === 'form-soat') {
      const df = document.getElementById('doc-expedicion');
      if (df && !df.value) df.value = todayStr;
    }

    if (viewId === 'dashboard') {
      window.dispatchEvent(new CustomEvent('motocontrol-render-dashboard'));
    } else {
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
  const clearFbBtn = document.getElementById('clear-fb-btn');
  const fbStatusMsg = document.getElementById('fb-status-msg');

  function toggleFbModal(show) {
    if (!fbModal) return;
    if (show) {
      // Cargar credenciales guardadas en el formulario
      try {
        const storedStr = localStorage.getItem('motocontrol_firebase_config');
        if (storedStr) {
          const cfg = JSON.parse(storedStr);
          if (cfg.apiKey) document.getElementById('fb-apiKey').value = cfg.apiKey;
          if (cfg.authDomain) document.getElementById('fb-authDomain').value = cfg.authDomain.replace(/\.cor$/i, '.com');
          if (cfg.projectId) document.getElementById('fb-projectId').value = cfg.projectId;
          if (cfg.storageBucket) document.getElementById('fb-storageBucket').value = cfg.storageBucket;
          if (cfg.messagingSenderId) document.getElementById('fb-messagingSenderId').value = cfg.messagingSenderId;
          if (cfg.appId) document.getElementById('fb-appId').value = cfg.appId;
        }
      } catch (e) {}

      if (fbStatusMsg) {
        if (window.MotoData && window.MotoData.isFirebaseActive) {
          fbStatusMsg.className = 'p-3 rounded text-xs font-body border border-success bg-success-container text-on-success-container flex items-center gap-2';
          fbStatusMsg.innerHTML = '<span class="material-symbols-outlined text-[18px]">cloud_done</span> <span><strong>Conectado:</strong> Base de datos sincronizada en tiempo real con Cloud Firestore.</span>';
          fbStatusMsg.classList.remove('hidden');
        } else if (window.MotoData && window.MotoData.lastFirebaseError) {
          const err = window.MotoData.lastFirebaseError;
          const isPerm = err.includes('Reglas') || err.includes('permission') || err.includes('insufficient');
          fbStatusMsg.className = 'p-3 rounded text-xs font-body border border-light-error bg-light-error-container text-light-on-error-container flex flex-col gap-1.5';
          fbStatusMsg.innerHTML = `
            <div class="flex items-center gap-1.5 font-bold">
              <span class="material-symbols-outlined text-[18px]">error</span>
              <span>Error de sincronización con Firestore</span>
            </div>
            <p class="text-xs"><strong>Causa reportada:</strong> ${err}</p>
            ${isPerm ? `
            <div class="mt-1 p-2 bg-light-surface rounded border border-light-outline-variant text-[11px] text-light-on-surface">
              <strong>Solución:</strong> En Firebase Console &gt; Firestore Database &gt; Reglas, asegúrate de permitir lectura/escritura (<code>allow read, write: if true;</code>) y pulsar <strong>Publicar</strong>.
            </div>` : ''}
          `;
          fbStatusMsg.classList.remove('hidden');
        } else {
          fbStatusMsg.className = 'p-3 rounded text-xs font-body border border-warning bg-warning-container text-on-warning-container flex items-center gap-2';
          fbStatusMsg.innerHTML = '<span class="material-symbols-outlined text-[18px]">cloud_queue</span> <span><strong>Modo Local activo:</strong> Haz clic en "Conectar Firebase" para sincronizar tus datos en la nube.</span>';
          fbStatusMsg.classList.remove('hidden');
        }
      }
      fbModal.classList.remove('hidden');
      fbModal.classList.add('flex');
    } else {
      fbModal.classList.add('hidden');
      fbModal.classList.remove('flex');
    }
  }

  if (openFbBtn) openFbBtn.addEventListener('click', () => {
    if (window.AuthManager && typeof window.AuthManager.can === 'function' && !window.AuthManager.can('firebase_config')) {
      alert('Solo el Administrador Principal puede ver o modificar la configuración de Firebase.');
      return;
    }
    toggleFbModal(true);
  });
  if (closeFbBtn) closeFbBtn.addEventListener('click', () => toggleFbModal(false));
  if (cancelFbBtn) cancelFbBtn.addEventListener('click', () => toggleFbModal(false));

  if (clearFbBtn) {
    clearFbBtn.addEventListener('click', () => {
      if (confirm('¿Deseas desconectar Firebase y volver a trabajar únicamente en almacenamiento local (LocalStorage)?')) {
        if (window.MotoData && window.MotoData.clearFirebaseConfig) {
          window.MotoData.clearFirebaseConfig();
        }
        toggleFbModal(false);
        alert('Firebase desconectado. Modo Local activo.');
      }
    });
  }

  const fbForm = document.getElementById('firebase-config-form');
  if (fbForm) {
    fbForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiKey = (document.getElementById('fb-apiKey') || document.getElementById('fb-api-key'))?.value.trim();
      let authDomain = document.getElementById('fb-authDomain')?.value.trim();
      const projectId = (document.getElementById('fb-projectId') || document.getElementById('fb-project-id'))?.value.trim();
      let storageBucket = (document.getElementById('fb-storageBucket') || document.getElementById('fb-storage-bucket'))?.value.trim();
      const messagingSenderId = document.getElementById('fb-messagingSenderId')?.value.trim();
      const appId = (document.getElementById('fb-appId') || document.getElementById('fb-app-id'))?.value.trim();

      if (!apiKey || !projectId) {
        alert('Por favor ingresa al menos API Key y Project ID.');
        return;
      }

      // Auto-corregir .cor a .com
      if (authDomain && authDomain.endsWith('.cor')) {
        authDomain = authDomain.replace(/\.cor$/i, '.com');
        const authDomInput = document.getElementById('fb-authDomain');
        if (authDomInput) authDomInput.value = authDomain;
      }
      if (storageBucket && !storageBucket.includes('.')) {
        storageBucket += '.firebasestorage.app';
        const stInput = document.getElementById('fb-storageBucket');
        if (stInput) stInput.value = storageBucket;
      }

      const submitBtn = fbForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Conectar Firebase';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span> Conectando...';
      }

      if (window.MotoData && window.MotoData.saveFirebaseConfig) {
        const res = await window.MotoData.saveFirebaseConfig({
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          messagingSenderId,
          appId
        });

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }

        if (res && res.success) {
          toggleFbModal(false);
          alert('✅ ¡Conectado exitosamente a Firebase Cloud Firestore!\n\nTu base de datos ahora está respaldada y sincronizada en tiempo real.');
        } else {
          if (fbStatusMsg) {
            fbStatusMsg.className = 'p-3 rounded text-xs font-body border border-light-error bg-light-error-container text-light-on-error-container';
            fbStatusMsg.innerHTML = `<strong>Error de conexión:</strong> ${res && res.error ? res.error : 'Verifica tus credenciales y que las reglas de Firestore permitan lectura y escritura.'}`;
            fbStatusMsg.classList.remove('hidden');
          }
          alert(`⚠️ No se pudo completar la conexión con Firebase:\n\n${res && res.error ? res.error : 'Revisa tus credenciales o las reglas de seguridad en Firebase Console.'}`);
        }
      }
    });
  }

  // =========================================================================
  // CONTROL DE PERMISOS POR ROL (OWNER / CO-ADMIN / OPERADOR SOLO INGRESO)
  // =========================================================================
  function applyRolePermissions() {
    const am = window.AuthManager;
    if (!am) return;
    const cur = am.getCurrentUser();
    if (!cur) return;

    const canEdit = am.can('edit');
    const canDelete = am.can('delete');
    const canManageUsers = am.can('manage_users');
    const canAudit = am.can('view_audit');

    // Controles de edición bloqueados para Operador (Solo Ingreso)
    const editSelectors = [
      '#edit-tariff-btn', '#btn-open-intervals-config', '#btn-open-intervals-from-form',
      '#btn-open-new-maint-type', '#btn-open-buy-modal', '#btn-open-sell-modal',
      '#open-account-modal-btn', '#btn-open-email-alerts-modal', '.reassign-btn',
      '.complete-order-btn', '.renew-doc-btn'
    ];
    editSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.toggle('hidden', !canEdit);
      });
    });

    // Controles de eliminación bloqueados para Operador (Solo Ingreso)
    const deleteSelectors = [
      '.delete-vehicle-btn', '.delete-order-btn', '.btn-del-part',
      '.delete-doc-btn', '.delete-tx-btn', '.btn-delete-account'
    ];
    deleteSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.toggle('hidden', !canDelete);
      });
    });

    // Selectores de plan de trabajo (solo lectura para Operador)
    ['workplan-azul-days', 'workplan-salmon-days', 'workplan-day31-color'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !canEdit;
    });

    // Botón Firebase (solo Administrador Principal)
    const fbBadge = document.getElementById('firebase-status-badge');
    if (fbBadge) {
      fbBadge.classList.toggle('cursor-pointer', am.can('firebase_config'));
      fbBadge.classList.toggle('cursor-default', !am.can('firebase_config'));
    }

    // Pestañas del modal de seguridad
    const secTabUsers = document.getElementById('sec-tab-btn-users');
    const secTabAudit = document.getElementById('sec-tab-btn-audit');
    if (secTabUsers) secTabUsers.classList.toggle('hidden', !canManageUsers);
    if (secTabAudit) secTabAudit.classList.toggle('hidden', !canAudit);
  }

  // =========================================================================
  // SISTEMA DE AUTENTICACIÓN SEGURA, ROLES Y AUDITORÍA DE TURNOS
  // =========================================================================
  function initAuthLogic() {
    const appShell = document.getElementById('app-main-shell');
    const authModal = document.getElementById('auth-modal');
    const authTabsBar = document.getElementById('auth-tabs-bar');
    const authSecPill = document.getElementById('auth-security-pill');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
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

    function setAuthMode(mode, preserveFeedback = false) {
      if (!preserveFeedback) clearFeedback();
      const canSetup = window.AuthManager && window.AuthManager.needsInitialSetup();
      const effectiveMode = (mode === 'register' && canSetup)
        ? 'register'
        : (mode === 'forgot' && !canSetup ? 'forgot' : 'login');

      if (effectiveMode === 'login') {
        tabLogin?.classList.add('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabLogin?.classList.remove('text-light-on-surface-variant', 'font-medium');
        tabRegister?.classList.remove('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabRegister?.classList.add('text-light-on-surface-variant', 'font-medium');
        loginForm?.classList.remove('hidden');
        loginForm?.classList.add('flex');
        registerForm?.classList.add('hidden');
        registerForm?.classList.remove('flex');
        forgotForm?.classList.add('hidden');
        forgotForm?.classList.remove('flex');
      } else if (effectiveMode === 'register') {
        tabRegister?.classList.add('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabRegister?.classList.remove('text-light-on-surface-variant', 'font-medium');
        tabLogin?.classList.remove('bg-light-surface-container-lowest', 'text-light-on-surface', 'font-bold', 'shadow-xs');
        tabLogin?.classList.add('text-light-on-surface-variant', 'font-medium');
        registerForm?.classList.remove('hidden');
        registerForm?.classList.add('flex');
        loginForm?.classList.add('hidden');
        loginForm?.classList.remove('flex');
        forgotForm?.classList.add('hidden');
        forgotForm?.classList.remove('flex');
      } else {
        forgotForm?.classList.remove('hidden');
        forgotForm?.classList.add('flex');
        loginForm?.classList.add('hidden');
        loginForm?.classList.remove('flex');
        registerForm?.classList.add('hidden');
        registerForm?.classList.remove('flex');
        const loginIdVal = document.getElementById('login-identifier')?.value.trim();
        const forgotEmailInp = document.getElementById('forgot-email');
        if (forgotEmailInp && loginIdVal && !forgotEmailInp.value) {
          forgotEmailInp.value = loginIdVal;
        }
      }
    }

    if (tabLogin) tabLogin.addEventListener('click', () => setAuthMode('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => setAuthMode('register'));
    document.getElementById('btn-forgot-password')?.addEventListener('click', () => setAuthMode('forgot'));
    document.getElementById('btn-back-to-login')?.addEventListener('click', () => setAuthMode('login'));

    function bindPasswordToggle(btnId, inputId, iconSize = 18) {
      const btn = document.getElementById(btnId);
      const inp = document.getElementById(inputId);
      if (!btn || !inp) return;
      btn.addEventListener('click', () => {
        const isPass = inp.type === 'password';
        inp.type = isPass ? 'text' : 'password';
        btn.innerHTML = `<span class="material-symbols-outlined text-[${iconSize}px]">${isPass ? 'visibility_off' : 'visibility'}</span>`;
      });
    }
    bindPasswordToggle('toggle-login-pass', 'login-password', 18);
    bindPasswordToggle('toggle-forgot-rec-key', 'forgot-recovery-key', 18);
    bindPasswordToggle('toggle-forgot-new-pass', 'forgot-new-password', 17);

    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.AuthManager) return;
        const email = document.getElementById('forgot-email')?.value.trim();
        const recoveryKey = document.getElementById('forgot-recovery-key')?.value.trim();
        const newPassword = document.getElementById('forgot-new-password')?.value.trim();
        const confirmPassword = document.getElementById('forgot-confirm-password')?.value.trim();
        if (newPassword !== confirmPassword) {
          showFeedback('Las nuevas contraseñas no coinciden.', true);
          return;
        }
        const btn = document.getElementById('btn-forgot-submit');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Verificando...';
        }
        try {
          const res = await window.AuthManager.recoverPassword({ identifier: email, recoveryKey, newPassword });
          if (res.success) {
            forgotForm.reset();
            const loginIdInp = document.getElementById('login-identifier');
            if (loginIdInp && res.email) loginIdInp.value = res.email;
            setAuthMode('login', true);
            showFeedback('✅ Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva clave.', false);
          } else {
            showFeedback(res.message, true);
          }
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Restablecer Contraseña';
          }
        }
      });
    }

    function updateProfileUI(user) {
      if (!user) return;
      const initials = (user.name || user.username || 'US')
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
      if (sideRole) sideRole.textContent = user.role || 'Administrador';
      if (headAvatar) headAvatar.textContent = initials;
      if (headName) headName.textContent = user.name || user.username;
    }

    function syncAuthChrome() {
      const canSetup = window.AuthManager && window.AuthManager.needsInitialSetup();
      if (authTabsBar) {
        authTabsBar.classList.toggle('hidden', !canSetup);
        authTabsBar.classList.toggle('flex', canSetup);
      }
      if (authSecPill) {
        authSecPill.classList.toggle('hidden', canSetup);
        authSecPill.classList.toggle('inline-flex', !canSetup);
      }
      const projWrap = document.getElementById('reg-project-verify-wrap');
      if (projWrap) {
        const needVerify = Boolean(canSetup && window.AuthManager && window.AuthManager.cloudHasExistingData);
        projWrap.classList.toggle('hidden', !needVerify);
        projWrap.classList.toggle('flex', needVerify);
      }
      if (!canSetup && (!forgotForm || forgotForm.classList.contains('hidden'))) {
        setAuthMode('login', !feedback?.classList.contains('hidden'));
      }
    }

    function checkAuth() {
      const cur = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
      syncAuthChrome();
      if (!cur) {
        if (appShell) appShell.classList.add('hidden');
        if (authModal) {
          authModal.classList.remove('hidden');
          authModal.classList.add('flex');
        }
      } else {
        forgotForm?.classList.add('hidden');
        forgotForm?.classList.remove('flex');
        if (appShell) appShell.classList.remove('hidden');
        if (authModal) {
          authModal.classList.add('hidden');
          authModal.classList.remove('flex');
        }
        updateProfileUI(cur);
        applyRolePermissions();
      }
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-identifier')?.value.trim();
        const pass = document.getElementById('login-password')?.value.trim();
        const remember = document.getElementById('login-remember')?.checked !== false;
        if (!window.AuthManager) return;

        const submitBtn = document.getElementById('btn-login-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verificando...';
        }
        try {
          const res = await window.AuthManager.login(id, pass, remember);
          if (res.success) {
            clearFeedback();
            loginForm.reset();
            if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
            checkAuth();
            const activeView = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeView);
          } else {
            showFeedback(res.message, true);
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Ingresar al Sistema';
          }
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-identifier')?.value.trim();
        const pass = document.getElementById('reg-password')?.value.trim();
        const recoveryKey = document.getElementById('reg-recovery-key')?.value.trim() || '';
        const projectVerify = document.getElementById('reg-project-verify')?.value.trim() || '';
        if (!window.AuthManager) return;

        const res = await window.AuthManager.registerInitialOwner({ name, email, password: pass, recoveryKey, projectVerify });
        if (res.success) {
          clearFeedback();
          registerForm.reset();
          if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
          checkAuth();
          navigateTo('dashboard');
          alert(`¡Bienvenido ${res.user.name}! Tu cuenta de Administrador Principal está protegida y el registro público ha quedado bloqueado.`);
        } else {
          showFeedback(res.message, true);
        }
      });
    }

    function doLogout() {
      if (confirm('¿Deseas cerrar tu sesión en MotoControl?')) {
        if (window.AuthManager) window.AuthManager.logout();
        const li = document.getElementById('login-identifier');
        const lp = document.getElementById('login-password');
        if (li) li.value = '';
        if (lp) lp.value = '';
        forgotForm?.reset();
        setAuthMode('login');
        clearFeedback();
        if (secModal) {
          secModal.classList.add('hidden');
          secModal.classList.remove('flex');
        }
        checkAuth();
      }
    }

    document.getElementById('btn-sidebar-logout')?.addEventListener('click', doLogout);
    document.getElementById('btn-header-logout')?.addEventListener('click', doLogout);

    // =========================================================================
    // CENTRO DE SEGURIDAD, USUARIOS Y AUDITORÍA DE TURNOS
    // =========================================================================
    const secModal = document.getElementById('security-center-modal');
    const secPanelUsers = document.getElementById('sec-panel-users');
    const secPanelAudit = document.getElementById('sec-panel-audit');
    const secPanelAccount = document.getElementById('sec-panel-account');

    function updateRecoveryStatusUI() {
      const badge = document.getElementById('sec-recovery-status-badge');
      if (!badge || !window.AuthManager) return;
      const configured = window.AuthManager.hasPersonalRecoveryKey();
      badge.textContent = configured ? '✅ Llave personal configurada' : 'Pendiente de configurar';
      badge.className = configured
        ? 'inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-label font-semibold bg-success-container text-on-success-container'
        : 'inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-label font-semibold bg-warning-container text-on-warning-container';
    }

    function switchSecTab(tab) {
      const canUsers = window.AuthManager?.can('manage_users');
      const canAudit = window.AuthManager?.can('view_audit');
      let target = tab;
      if (target === 'users' && !canUsers) target = canAudit ? 'audit' : 'account';
      if (target === 'audit' && !canAudit) target = 'account';

      if (secPanelUsers) {
        secPanelUsers.classList.toggle('hidden', target !== 'users');
        secPanelUsers.classList.toggle('flex', target === 'users');
      }
      if (secPanelAudit) {
        secPanelAudit.classList.toggle('hidden', target !== 'audit');
        secPanelAudit.classList.toggle('flex', target === 'audit');
      }
      if (secPanelAccount) {
        secPanelAccount.classList.toggle('hidden', target !== 'account');
        secPanelAccount.classList.toggle('flex', target === 'account');
      }
      document.querySelectorAll('.sec-tab-btn').forEach(btn => {
        const active = btn.dataset.secTab === target;
        btn.className = active
          ? 'sec-tab-btn px-3 py-1.5 rounded font-label text-label-sm bg-light-surface-container-lowest text-light-on-surface font-bold shadow-xs'
          : 'sec-tab-btn px-3 py-1.5 rounded font-label text-label-sm text-light-on-surface-variant hover:text-light-on-surface';
        if (btn.dataset.secTab === 'users' && !canUsers) btn.classList.add('hidden');
        if (btn.dataset.secTab === 'audit' && !canAudit) btn.classList.add('hidden');
      });
      if (target === 'users') renderUsersTable();
      if (target === 'audit') renderAuditTable();
      if (target === 'account') updateRecoveryStatusUI();
    }

    function renderUsersTable() {
      const tbody = document.getElementById('sec-users-tbody');
      if (!tbody || !window.AuthManager) return;
      const users = window.AuthManager.getUsers();
      tbody.innerHTML = '';
      users.forEach(u => {
        const isOwner = u.roleKey === 'owner';
        const isActive = u.active !== false;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-3 py-2.5">
            <p class="font-body text-body-sm font-bold text-light-on-surface">${u.name}</p>
            <p class="font-mono text-body-xs text-light-outline">${u.email}</p>
          </td>
          <td class="px-3 py-2.5">
            ${isOwner
              ? `<span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-label font-bold bg-light-primary text-light-on-primary">${u.role}</span>`
              : `<select class="sec-user-role-sel h-8 rounded border border-light-outline-variant bg-light-surface px-2 font-body text-xs" data-uid="${u.id}">
                  <option value="admin" ${u.roleKey === 'admin' ? 'selected' : ''}>Co-Administrador</option>
                  <option value="operator" ${u.roleKey === 'operator' ? 'selected' : ''}>Operador (Solo Ingreso)</option>
                </select>`
            }
          </td>
          <td class="px-3 py-2.5">
            <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${isActive ? 'bg-success-container text-on-success-container' : 'bg-light-error-container text-light-on-error-container'}">
              ${isActive ? 'Activo' : 'Bloqueado'}
            </span>
          </td>
          <td class="px-3 py-2.5 text-right whitespace-nowrap">
            ${isOwner ? '<span class="text-[11px] text-light-outline font-body">Cuenta protegida</span>' : `
            <div class="inline-flex items-center gap-1.5">
              <button type="button" class="sec-toggle-user-btn px-2 py-1 rounded border border-light-outline-variant text-xs font-label hover:bg-light-surface-container" data-uid="${u.id}" data-next="${!isActive}">
                ${isActive ? 'Bloquear' : 'Activar'}
              </button>
              <button type="button" class="sec-reset-pass-btn px-2 py-1 rounded border border-light-outline-variant text-xs font-label text-light-primary hover:bg-light-secondary-container/40" data-uid="${u.id}" data-name="${u.name}">
                Clave
              </button>
              <button type="button" class="sec-del-user-btn p-1 rounded text-red-500 hover:bg-red-50" data-uid="${u.id}" data-name="${u.name}" title="Eliminar usuario">
                <span class="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>`}
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.sec-user-role-sel').forEach(sel => {
        sel.addEventListener('change', async () => {
          const res = await window.AuthManager.adminUpdateUser(sel.dataset.uid, { roleKey: sel.value });
          if (res.success) renderUsersTable();
          else alert(res.message);
        });
      });
      tbody.querySelectorAll('.sec-toggle-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const res = await window.AuthManager.adminUpdateUser(btn.dataset.uid, { active: btn.dataset.next === 'true' });
          if (res.success) renderUsersTable();
          else alert(res.message);
        });
      });
      tbody.querySelectorAll('.sec-reset-pass-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const np = prompt(`Ingresa nueva contraseña (mínimo 6 caracteres) para ${btn.dataset.name}:`);
          if (!np) return;
          const res = await window.AuthManager.adminUpdateUser(btn.dataset.uid, { newPassword: np });
          if (res.success) alert(`✅ Contraseña actualizada para ${btn.dataset.name}.`);
          else alert(res.message);
        });
      });
      tbody.querySelectorAll('.sec-del-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm(`¿Seguro que deseas eliminar el acceso de "${btn.dataset.name}"?`)) {
            const res = await window.AuthManager.adminDeleteUser(btn.dataset.uid);
            if (res.success) renderUsersTable();
            else alert(res.message);
          }
        });
      });
    }

    function renderAuditTable() {
      const tbody = document.getElementById('audit-logs-tbody');
      const userSel = document.getElementById('audit-filter-user');
      const actionSel = document.getElementById('audit-filter-action');
      const countLbl = document.getElementById('audit-count-label');
      if (!tbody || !window.MotoData) return;

      const logs = window.MotoData.getAuditLogs ? window.MotoData.getAuditLogs() : [];
      if (userSel) {
        const curU = userSel.value || 'all';
        const names = [...new Set(logs.map(l => l.userName).filter(Boolean))];
        userSel.innerHTML = '<option value="all">Todos los usuarios</option>';
        names.forEach(n => {
          const opt = document.createElement('option');
          opt.value = n;
          opt.textContent = n;
          userSel.appendChild(opt);
        });
        if (names.includes(curU)) userSel.value = curU;
      }

      const fUser = userSel ? userSel.value : 'all';
      const fAct = actionSel ? actionSel.value : 'all';
      const filtered = logs.filter(l => (fUser === 'all' || l.userName === fUser) && (fAct === 'all' || l.action === fAct));

      tbody.innerHTML = '';
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-3 py-8 text-center text-xs text-light-outline font-body">No hay eventos registrados aún para este filtro.</td></tr>';
      } else {
        filtered.forEach(l => {
          const badgeMap = {
            'Creación': 'bg-success-container text-on-success-container',
            'Transferencia': 'bg-light-secondary-container text-light-on-secondary-container',
            'Edición': 'bg-warning-container text-on-warning-container',
            'Eliminación': 'bg-light-error-container text-light-on-error-container',
            'Inicio de sesión': 'bg-light-surface-container text-light-primary'
          };
          const cls = badgeMap[l.action] || 'bg-light-surface-container text-light-on-surface';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="px-3 py-2 font-mono text-[11px] text-light-outline whitespace-nowrap">${l.timestamp || '-'}</td>
            <td class="px-3 py-2">
              <p class="font-body text-xs font-bold text-light-on-surface whitespace-nowrap">${l.userName || '-'}</p>
              <p class="font-body text-[10px] text-light-outline whitespace-nowrap">${l.userRole || ''}</p>
            </td>
            <td class="px-3 py-2"><span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cls}">${l.action}</span></td>
            <td class="px-3 py-2 font-body text-xs text-light-on-surface">${l.detail || l.module || '-'}</td>
          `;
          tbody.appendChild(tr);
        });
      }
      if (countLbl) countLbl.textContent = `${filtered.length} evento${filtered.length === 1 ? '' : 's'}`;
    }

    function openSecModal() {
      if (!secModal) return;
      applyRolePermissions();
      secModal.classList.remove('hidden');
      secModal.classList.add('flex');
      const canUsers = window.AuthManager?.can('manage_users');
      const canAudit = window.AuthManager?.can('view_audit');
      switchSecTab(canUsers ? 'users' : (canAudit ? 'audit' : 'account'));
    }

    document.getElementById('btn-open-security-modal')?.addEventListener('click', openSecModal);
    document.getElementById('btn-sidebar-security')?.addEventListener('click', openSecModal);
    document.getElementById('close-security-modal-btn')?.addEventListener('click', () => {
      secModal?.classList.add('hidden');
      secModal?.classList.remove('flex');
    });
    document.querySelectorAll('.sec-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchSecTab(btn.dataset.secTab));
    });
    document.getElementById('audit-filter-user')?.addEventListener('change', renderAuditTable);
    document.getElementById('audit-filter-action')?.addEventListener('change', renderAuditTable);

    document.getElementById('sec-create-user-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.AuthManager) return;
      const name = document.getElementById('sec-new-name')?.value.trim();
      const email = document.getElementById('sec-new-email')?.value.trim();
      const roleKey = document.getElementById('sec-new-role')?.value;
      const password = document.getElementById('sec-new-password')?.value.trim();
      const res = await window.AuthManager.adminCreateUser({ name, email, roleKey, password });
      if (res.success) {
        e.target.reset();
        renderUsersTable();
        alert(`✅ Usuario ${res.user.name} (${res.user.role}) creado correctamente.`);
      } else {
        alert('⚠️ ' + res.message);
      }
    });

    document.getElementById('sec-change-pass-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.AuthManager) return;
      const curr = document.getElementById('sec-curr-pass')?.value.trim();
      const next = document.getElementById('sec-next-pass')?.value.trim();
      const res = await window.AuthManager.changeOwnPassword(curr, next);
      if (res.success) {
        e.target.reset();
        alert('✅ Tu contraseña se actualizó de forma segura.');
      } else {
        alert('⚠️ ' + res.message);
      }
    });

    document.getElementById('btn-gen-rec-phrase')?.addEventListener('click', () => {
      if (!window.AuthManager) return;
      const inp = document.getElementById('sec-rec-phrase');
      if (!inp) return;
      inp.value = window.AuthManager.generateRecoveryCode();
      inp.focus();
      inp.select();
    });

    document.getElementById('btn-copy-rec-phrase')?.addEventListener('click', async () => {
      const inp = document.getElementById('sec-rec-phrase');
      const val = inp ? inp.value.trim() : '';
      if (!val) {
        alert('Primero escribe o genera una llave de recuperación.');
        return;
      }
      try {
        await navigator.clipboard.writeText(val);
        alert('📋 Llave copiada al portapapeles. Guárdala en un lugar seguro y luego pulsa "Guardar Llave".');
      } catch (e) {
        inp.select();
        document.execCommand('copy');
        alert('📋 Llave copiada. Luego pulsa "Guardar Llave" para activarla.');
      }
    });

    document.getElementById('sec-recovery-phrase-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.AuthManager) return;
      const curr = document.getElementById('sec-rec-curr-pass')?.value.trim();
      const phrase = document.getElementById('sec-rec-phrase')?.value.trim();
      const res = await window.AuthManager.setPersonalRecoveryKey(curr, phrase);
      if (res.success) {
        e.target.reset();
        updateRecoveryStatusUI();
        alert('✅ Llave de recuperación personal guardada (cifrada SHA-256). Recuerda conservar una copia segura.');
      } else {
        alert('⚠️ ' + res.message);
      }
    });

    function doResetDatabase() {
      if (window.AuthManager && !window.AuthManager.can('reset_db')) {
        alert('Solo el Administrador Principal puede restablecer la base de datos.');
        return;
      }
      const msg = '¿Deseas vaciar los datos operativos y dejar la base de datos en blanco?\n\n' +
                  'Se borrarán los motocarros, repuestos, movimientos y documentos.';
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

    window.addEventListener('motocontrol-security-ready', checkAuth);
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

    document.querySelectorAll('.driver-name-select, #tarifa-filter-driver').forEach(sel => {
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
    let accounts = MotoData.getAccounts ? MotoData.getAccounts() : [];
    if (!accounts) accounts = [];
    const accountSelectIds = [
      'filter-account', 'dashboard-filter-account', 'account-filter',
      'mov-cuenta', 'mov-cuenta-destino', 'fin-tx-account', 'modal-doc-account',
      'cuenta-recaudo', 'cuenta-pago', 'doc-cuenta', 'sp-account', 'buy-account', 'sell-account'
    ];
    const optionalAccountIds = new Set(['cuenta-pago', 'doc-cuenta', 'modal-doc-account', 'buy-account', 'sell-account', 'sp-account']);

    accountSelectIds.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      const hasAll = id.includes('filter');
      if (hasAll) {
        sel.innerHTML = '<option value="all">Todas las cuentas</option>';
      } else if (optionalAccountIds.has(id)) {
        sel.innerHTML = '<option value="">-- Sin descontar / No afecta caja --</option>';
      } else if (accounts.length === 0) {
        sel.innerHTML = '<option value="">-- Sin cuentas (Crea una en Gastos y Cuentas) --</option>';
      } else {
        sel.innerHTML = '';
      }
      accounts.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name;
        opt.textContent = `${a.name} (${a.type || 'Bancaria'})`;
        sel.appendChild(opt);
      });
      if (cur && Array.from(sel.options).some(o => o.value === cur)) {
        sel.value = cur;
      }
    });

    // Poblado dinámico de selects de repuestos en bodega
    const parts = MotoData.getSpareParts ? MotoData.getSpareParts() : [];
    ['usage-part', 'repuesto-select'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      if (parts.length === 0) {
        sel.innerHTML = '<option value="">-- Sin repuestos en bodega --</option>';
      } else {
        sel.innerHTML = '<option value="">-- Seleccionar repuesto --</option>';
        parts.forEach(p => {
          const price = Number(p.unitPrice ?? p.price ?? 0);
          const stock = Number(p.stock ?? 0);
          const opt = document.createElement('option');
          opt.value = p.code || p.name;
          opt.textContent = `${p.name} (Stock: ${stock} · $${price.toLocaleString('es-CO')})`;
          sel.appendChild(opt);
        });
      }
      if (cur && Array.from(sel.options).some(o => o.value === cur)) sel.value = cur;
    });

    // Badges dinámicos en cabeceras de formularios
    const activeCount = vehicles.length;
    const fleetBadge = document.getElementById('form-moto-fleet-badge');
    if (fleetBadge) fleetBadge.textContent = `Flota activa: ${activeCount}`;

    const docs = MotoData.getDocuments ? MotoData.getDocuments() : [];
    const alertDocsCount = docs.filter(d => {
      const st = MotoData.computeDocumentStatus ? MotoData.computeDocumentStatus(d.expiry).status : (d.status || 'valid');
      return st === 'expired' || st === 'expiring';
    }).length;
    const soatAlertsBadge = document.getElementById('form-soat-alerts-badge');
    if (soatAlertsBadge) {
      soatAlertsBadge.textContent = alertDocsCount > 0 ? `${alertDocsCount} alerta${alertDocsCount === 1 ? '' : 's'} documental${alertDocsCount === 1 ? '' : 'es'}` : 'Documentación al día';
      soatAlertsBadge.className = alertDocsCount > 0
        ? 'font-label text-label-md px-gutter-sm py-1 rounded-full bg-light-error-container text-light-on-error-container whitespace-nowrap'
        : 'font-label text-label-md px-gutter-sm py-1 rounded-full bg-success-container text-on-success-container whitespace-nowrap';
    }

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
            const computed = MotoData.computeDocumentStatus ? MotoData.computeDocumentStatus(d.expiry) : { status: d.status || 'valid', statusText: d.statusText || 'Vigente' };
            const isExp = computed.status === 'expired';
            const isSoon = computed.status === 'expiring';
            const badgeClass = isExp
              ? 'bg-light-error-container text-light-on-error-container'
              : (isSoon ? 'bg-warning-container text-on-warning-container' : 'bg-success-container text-on-success-container');

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
                  ${computed.statusText}
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

      const docsWithStatus = docs.map(d => ({
        ...d,
        computed: MotoData.computeDocumentStatus ? MotoData.computeDocumentStatus(d.expiry) : { status: d.status || 'valid', statusText: d.statusText || 'Vigente' }
      }));
      const expiredDocs = docsWithStatus.filter(d => d.computed.status === 'expired');
      const expiringDocs = docsWithStatus.filter(d => d.computed.status === 'expiring');
      const validDocsList = docsWithStatus.filter(d => d.computed.status === 'valid');
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

      // Banner de Alerta Crítica (Vencidos) en Dashboard y Documentación
      const alertBannerErr = document.getElementById('alert-banner-error');
      const alertBannerErrText = document.getElementById('alert-banner-error-text');
      if (alertBannerErr) {
        if (expiredDocs.length > 0) {
          alertBannerErr.classList.remove('hidden');
          alertBannerErr.classList.add('flex');
          if (alertBannerErrText) {
            alertBannerErrText.innerHTML = `<strong>Alerta crítica:</strong> ${expiredDocs[0].type} vencido en <span class="font-mono text-mono-md">${expiredDocs[0].plate}</span> (${expiredDocs[0].driver || 'Sin conductor'}). Unidad requiere renovación inmediata.`;
          }
        } else {
          alertBannerErr.classList.add('hidden');
          alertBannerErr.classList.remove('flex');
        }
      }

      const docPageAlert = document.getElementById('doc-alert-error');
      const docPageAlertText = document.getElementById('doc-alert-error-text');
      if (docPageAlert) {
        if (expiredDocs.length > 0) {
          docPageAlert.classList.remove('hidden');
          docPageAlert.classList.add('flex');
          if (docPageAlertText) {
            docPageAlertText.innerHTML = `<strong>Documento vencido (${expiredDocs.length}):</strong> ${expiredDocs[0].type} de <strong>${expiredDocs[0].plate}</strong> venció el ${expiredDocs[0].expiry}.`;
          }
          const renewTopBtn = docPageAlert.querySelector('.renew-doc-btn');
          if (renewTopBtn) {
            renewTopBtn.dataset.plate = expiredDocs[0].plate;
            renewTopBtn.dataset.doc = expiredDocs[0].type;
          }
        } else {
          docPageAlert.classList.add('hidden');
          docPageAlert.classList.remove('flex');
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
      const validDocsCount = validDocsList.length;
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
        const qty = Number(p.stock ?? 0);
        const price = Number(p.unitPrice ?? p.price ?? 0);
        const minQty = Number(p.minStock ?? p.min ?? 2);
        totalStockVal += qty * price;
        if (qty <= minQty) lowStockCount++;
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

    function renderDashboardCharts(matchedTxs, vehicles) {
      // 1. Gráfico de barras semanal: Ingresos vs Gastos
      const cashflowEl = document.getElementById('cashflow-chart');
      if (cashflowEl) {
        const buckets = [
          { label: 'Sem 1', inc: 0, exp: 0 },
          { label: 'Sem 2', inc: 0, exp: 0 },
          { label: 'Sem 3', inc: 0, exp: 0 },
          { label: 'Sem 4+', inc: 0, exp: 0 }
        ];
        matchedTxs.forEach(t => {
          if (t.category === 'Apertura de cuenta' || t.category === 'Transferencia') return;
          const day = t.date ? Number((t.date.split('-')[2] || '1')) : 1;
          const idx = day <= 7 ? 0 : (day <= 14 ? 1 : (day <= 21 ? 2 : 3));
          const amt = Number(t.amount || 0);
          if (t.type === 'income') buckets[idx].inc += amt;
          else if (t.type === 'expense') buckets[idx].exp += amt;
        });
        const maxVal = Math.max(1, ...buckets.flatMap(b => [b.inc, b.exp]));

        cashflowEl.innerHTML = buckets.map(b => {
          const incPct = Math.round((b.inc / maxVal) * 100);
          const expPct = Math.round((b.exp / maxVal) * 100);
          return `
            <div class="flex flex-col items-center gap-2 h-full justify-end">
              <div class="w-full flex items-end justify-center gap-1.5 h-[150px]">
                <div class="w-5 sm:w-7 rounded-t bg-light-primary transition-all duration-300" style="height: ${b.inc > 0 ? Math.max(8, incPct) : 3}%" title="Ingresos ${b.label}: $${b.inc.toLocaleString('es-CO')}"></div>
                <div class="w-5 sm:w-7 rounded-t bg-light-tertiary-container transition-all duration-300" style="height: ${b.exp > 0 ? Math.max(8, expPct) : 3}%" title="Gastos ${b.label}: $${b.exp.toLocaleString('es-CO')}"></div>
              </div>
              <div class="text-center">
                <span class="font-label text-label-sm text-light-on-surface-variant block">${b.label}</span>
                <span class="font-mono text-body-xs text-light-outline tabular-nums">$${Math.round((b.inc - b.exp) / 1000)}k</span>
              </div>
            </div>
          `;
        }).join('');
      }

      // 2. Ingresos y gastos por motocarro (Top 6)
      const vehMap = {};
      (vehicles || []).forEach(v => { vehMap[v.plate] = v; });

      const renderUnitBars = (containerId, txType, barClass) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        const totals = {};
        matchedTxs.forEach(t => {
          const isTransf = MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia');
          if (isTransf || t.category === 'Apertura de cuenta') return;
          if (t.type !== txType || !t.plate || t.plate === 'General' || t.plate === 'General flota' || t.plate === 'Entre cuentas') return;
          totals[t.plate] = (totals[t.plate] || 0) + Number(t.amount || 0);
        });
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
        if (sorted.length === 0) {
          el.innerHTML = `<p class="font-body text-body-sm text-light-on-surface-variant py-6 text-center">Sin ${txType === 'income' ? 'ingresos' : 'gastos'} asociados a motocarros en este período.</p>`;
          return;
        }
        const maxU = Math.max(1, sorted[0][1]);
        el.innerHTML = sorted.map(([plate, amt]) => {
          const pct = Math.max(6, Math.round((amt / maxU) * 100));
          const v = vehMap[plate] || {};
          const drv = v.driver && v.driver !== 'Sin conductor' ? ` · ${v.driver}` : '';
          return `
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-mono font-bold text-light-on-surface">${plate}<span class="font-body font-normal text-light-on-surface-variant">${drv}</span></span>
                <span class="font-mono font-semibold text-light-on-surface tabular-nums">$ ${amt.toLocaleString('es-CO')}</span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-light-surface-container overflow-hidden">
                <div class="h-full rounded-full ${barClass}" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      };

      renderUnitBars('income-by-unit-chart', 'income', 'bg-light-primary');
      renderUnitBars('expense-by-unit-chart', 'expense', 'bg-light-tertiary-container');
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
          matchedTxs.push(t);
          const isTransf = MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia');
          if (!isTransf) {
            matchCount++;
            if (t.type === 'income') incTotal += Number(t.amount || 0);
            else if (t.type === 'expense') expTotal += Number(t.amount || 0);
          }
        }
      });

      const netBalance = incTotal - expTotal;
      const hasSpecificFilter = acct !== 'all' || drv !== 'all' || Boolean(dFrom) || Boolean(dTo);

      // Period label
      const periodLbl = document.getElementById('chart-period-label');
      if (periodLbl) {
        periodLbl.textContent = (dFrom || dTo)
          ? `Comparativa del ${dFrom || 'inicio'} al ${dTo || 'hoy'}`
          : 'Comparativa por semana (Todos los movimientos)';
      }

      // Live KPI Cards
      const incEl = document.getElementById('kpi-income');
      const incDeltaEl = document.getElementById('kpi-income-delta');
      const expEl = document.getElementById('kpi-expense');
      const expDeltaEl = document.getElementById('kpi-expense-delta');
      const balEl = document.getElementById('kpi-balance');
      const balStatusEl = document.getElementById('kpi-balance-status');
      const fleetCountEl = document.getElementById('kpi-fleet-count');
      const fleetRateEl = document.getElementById('kpi-fleet-rate');
      const fleetSubEl = document.getElementById('kpi-fleet-sub');

      const operationalTxs = matchedTxs.filter(t => !(MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia')));
      const incCount = operationalTxs.filter(t => t.type === 'income').length;
      const expCount = operationalTxs.filter(t => t.type === 'expense').length;
      if (incEl) incEl.textContent = '$ ' + incTotal.toLocaleString('es-CO');
      if (incDeltaEl) incDeltaEl.textContent = `${incCount} reg.`;
      if (expEl) expEl.textContent = '$ ' + expTotal.toLocaleString('es-CO');
      if (expDeltaEl) expDeltaEl.textContent = `${expCount} reg.`;
      if (balEl) balEl.textContent = '$ ' + netBalance.toLocaleString('es-CO');
      if (balStatusEl) balStatusEl.textContent = netBalance >= 0 ? 'Disponible' : 'Déficit';

      let paidTodayCnt = 0;
      let pendingTodayCnt = 0;
      let restingTodayCnt = 0;
      let workshopCnt = 0;
      vehicles.forEach(v => {
        const ws = MotoData.getVehicleWorkStatus ? MotoData.getVehicleWorkStatus(v) : { code: v.status === 'workshop' ? 'workshop' : 'pending' };
        if (ws.code === 'paid') paidTodayCnt++;
        else if (ws.code === 'pending') pendingTodayCnt++;
        else if (ws.code === 'resting') restingTodayCnt++;
        else if (ws.code === 'workshop') workshopCnt++;
      });

      if (fleetCountEl) {
        fleetCountEl.textContent = `${paidTodayCnt + pendingTodayCnt} / ${vehicles.length}`;
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
        if (vehicles.length === 0) {
          fleetSubEl.textContent = 'Sin motocarros registrados';
        } else {
          const partsSub = [`${paidTodayCnt} pago${paidTodayCnt === 1 ? '' : 's'}`, `${pendingTodayCnt} pendiente${pendingTodayCnt === 1 ? '' : 's'}`];
          if (restingTodayCnt > 0) partsSub.push(`${restingTodayCnt} descansando`);
          if (workshopCnt > 0) partsSub.push(`${workshopCnt} en taller`);
          fleetSubEl.textContent = partsSub.join(' · ');
        }
      }

      if (hasSpecificFilter) {
        if (activeBadge) {
          activeBadge.classList.remove('hidden');
          activeBadge.classList.add('flex');
          const acctText = acct !== 'all' ? `Cuenta: ${acct}` : 'Todas las cuentas';
          const drvText = drv !== 'all' ? `Conductor: ${drv}` : 'Todos los conductores';
          const dateText = (dFrom || dTo) ? ` · Fechas: ${dFrom || '...'} a ${dTo || '...'}` : '';
          if (activeBadgeText) activeBadgeText.textContent = `Filtro: ${acctText} · ${drvText}${dateText} (${matchCount} mov.)`;
          if (activeBadgeStats) activeBadgeStats.textContent = `Ingresos: $${incTotal.toLocaleString('es-CO')} | Gastos: $${expTotal.toLocaleString('es-CO')} | Neto: $${netBalance.toLocaleString('es-CO')}`;
        }
      } else {
        if (activeBadge) {
          activeBadge.classList.add('hidden');
          activeBadge.classList.remove('flex');
        }
      }

      renderDashboardCharts(matchedTxs, vehicles);
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
        if (fromInput) fromInput.value = '';
        if (toInput) toInput.value = '';
        document.querySelectorAll('.preset-btn').forEach(b => {
          const isAll = b.dataset.preset === 'all';
          b.className = isAll
            ? 'preset-btn px-2.5 py-1 rounded font-label text-label-sm bg-light-secondary-container text-light-on-secondary-container transition-colors'
            : 'preset-btn px-2.5 py-1 rounded font-label text-label-sm bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container transition-colors';
        });
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
        const preset = btn.dataset.preset;
        const now = new Date();
        const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (preset === 'all') {
          if (fromInput) fromInput.value = '';
          if (toInput) toInput.value = '';
        } else if (preset === 'today') {
          const t = toIso(now);
          if (fromInput) fromInput.value = t;
          if (toInput) toInput.value = t;
        } else if (preset === '7d') {
          const d7 = new Date(now);
          d7.setDate(d7.getDate() - 6);
          if (fromInput) fromInput.value = toIso(d7);
          if (toInput) toInput.value = toIso(now);
        } else if (preset === 'month') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          if (fromInput) fromInput.value = toIso(start);
          if (toInput) toInput.value = toIso(now);
        } else if (preset === 'prev') {
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          if (fromInput) fromInput.value = toIso(start);
          if (toInput) toInput.value = toIso(end);
        }
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

      // Actualizar contadores de pestañas de flota dinámicamente
      const fleetActiveVehs = data.vehicles.filter(v => v.status !== 'sold');
      const soldCount = data.vehicles.filter(v => v.status === 'sold').length;
      const azulCount = fleetActiveVehs.filter(v => !(v.color || '').toLowerCase().includes('salm')).length;
      const salmonCount = fleetActiveVehs.filter(v => (v.color || '').toLowerCase().includes('salm')).length;
      const todosEl = document.getElementById('count-todos');
      const azulEl = document.getElementById('count-azul');
      const salmonEl = document.getElementById('count-salmon');
      const soldEl = document.getElementById('count-sold');
      if (todosEl) todosEl.textContent = fleetActiveVehs.length;
      if (azulEl) azulEl.textContent = azulCount;
      if (salmonEl) salmonEl.textContent = salmonCount;
      if (soldEl) soldEl.textContent = soldCount;

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
        const ws = (!isSold && MotoData.getVehicleWorkStatus)
          ? MotoData.getVehicleWorkStatus(v)
          : { code: isSold ? 'sold' : (v.status === 'workshop' ? 'workshop' : (v.status === 'resting' ? 'resting' : 'pending')) };

        let matchesFilter = false;
        if (currentFilter === 'all') matchesFilter = !isSold;
        else if (currentFilter === 'sold') matchesFilter = isSold;
        else if (currentFilter === 'Azul') matchesFilter = !isSalmon && !isSold;
        else if (currentFilter === 'Salmón') matchesFilter = isSalmon && !isSold;
        else if (currentFilter === 'active' || currentFilter === 'route') matchesFilter = !isSold && (ws.code === 'paid' || ws.code === 'pending');
        else if (currentFilter === 'resting') matchesFilter = !isSold && ws.code === 'resting';
        else if (currentFilter === 'unassigned') matchesFilter = !isSold && (ws.code === 'idle' || !v.driver || v.driver === 'Sin conductor');
        else matchesFilter = !isSold && (v.status === currentFilter || ws.code === currentFilter);

        const cedulaStr = v.cedula || '';
        const searchStr = `${v.plate} ${vColor} ${v.model} ${v.driver} ${cedulaStr} ${v.phone}`.toLowerCase();
        const matchesQuery = !q || searchStr.includes(q);

        if (matchesFilter && matchesQuery) {
          visibleCount++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          tr.dataset.status = ws.code;
          tr.dataset.color = vColor;
          tr.dataset.search = searchStr;

          let statusBadge = '';
          if (isSold) {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-surface-container-highest text-light-outline font-label text-label-sm font-semibold">🤝 Vendido</span>';
          } else if (ws.code === 'workshop') {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-container text-on-warning-container font-label text-label-sm font-semibold">En taller</span>';
          } else if (ws.code === 'resting') {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-surface-container-high text-light-on-surface-variant font-label text-label-sm font-semibold">Descansando</span>';
          } else if (ws.code === 'idle') {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-light-surface-container-high text-light-on-surface-variant font-label text-label-sm">Sin conductor</span>';
          } else if (ws.code === 'paid') {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-success-container text-on-success-container font-label text-label-sm font-semibold">En ruta · Pago</span>';
          } else {
            statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-container text-on-warning-container font-label text-label-sm font-semibold">En ruta · Pendiente</span>';
          }

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
              <p class="font-body text-body-sm text-light-on-surface-variant">${v.model || 'Bajaj RE'}</p>
              ${v.chassis && v.chassis !== '-' ? `<p class="font-mono text-body-xs text-light-outline">Chasis: ${v.chassis}</p>` : ''}
              ${v.ownerName ? `<p class="font-body text-body-xs text-light-outline">Prop: ${v.ownerName}${v.ownerCedula ? ' · C.C. ' + v.ownerCedula : ''}</p>` : ''}
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
              <button type="button" class="delete-vehicle-btn inline-flex items-center gap-1 px-2.5 py-1 rounded text-red-600 hover:bg-red-50 font-label text-label-sm font-semibold ml-1" data-plate="${v.plate}">
                <span class="material-symbols-outlined text-[16px]">delete</span>
                <span>Eliminar</span>
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
      let inRoute = 0;
      let inWorkshop = 0;
      let restingCnt = 0;
      let available = 0;
      activeVehs.forEach(v => {
        const ws = MotoData.getVehicleWorkStatus ? MotoData.getVehicleWorkStatus(v) : { code: v.status === 'workshop' ? 'workshop' : 'pending' };
        if (ws.code === 'paid' || ws.code === 'pending') inRoute++;
        else if (ws.code === 'workshop') inWorkshop++;
        else if (ws.code === 'resting') restingCnt++;
        else available++;
      });
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
      if (kpiInRouteEl) kpiInRouteEl.textContent = `${inRoute} en ruta hoy`;
      if (kpiSubEl) kpiSubEl.textContent = `${restingCnt} descansando · ${inWorkshop} en taller · ${available} sin conductor`;
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

      // Listeners botones Eliminar motocarro
      tableBody.querySelectorAll('.delete-vehicle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const plate = btn.dataset.plate;
          if (confirm(`¿Seguro que deseas eliminar el motocarro ${plate} de la flota? Esta acción no se puede deshacer.`)) {
            const res = window.MotoData.deleteVehicle(plate);
            if (res && res.success) {
              renderFleetTable();
              if (typeof renderDashboard === 'function') renderDashboard();
              alert(`Motocarro ${plate} eliminado de la flota.`);
            } else {
              alert('No se pudo eliminar: ' + (res?.message || 'Error desconocido'));
            }
          }
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
    // Modal de Edición Completa de Motocarro, Conductor y Propietario
    const assignModal = document.getElementById('assign-modal');
    const plateInput = document.getElementById('modal-plate');
    const plateBadge = document.getElementById('modal-plate-badge');
    const driverInput = document.getElementById('modal-driver');
    const cedulaInput = document.getElementById('modal-cedula');
    const sinConductorCheckbox = document.getElementById('modal-sin-conductor');
    const conductorBox = document.getElementById('modal-conductor-box');

    function toggleAssignModal(show, plate = '') {
      if (!assignModal) return;
      if (show) {
        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const v = vehicles.find(veh => veh.plate.toUpperCase() === (plate || '').toUpperCase()) || {};

        if (plateInput) plateInput.value = v.plate || plate || '';
        if (plateBadge) plateBadge.textContent = v.plate || plate || 'MCT-000';

        // Color
        const isSalmon = (v.color || '').toLowerCase().includes('salm');
        const colorAzulRadio = document.getElementById('modal-color-azul');
        const colorSalmonRadio = document.getElementById('modal-color-salmon');
        if (isSalmon && colorSalmonRadio) colorSalmonRadio.checked = true;
        else if (colorAzulRadio) colorAzulRadio.checked = true;

        // Modelo, chasis, km
        const modelInp = document.getElementById('modal-model');
        if (modelInp) modelInp.value = v.model || 'Bajaj RE 4S';
        const chasisInp = document.getElementById('modal-chasis');
        if (chasisInp) chasisInp.value = v.chassis && v.chassis !== '-' ? v.chassis : '';
        const kmInp = document.getElementById('modal-km');
        if (kmInp) kmInp.value = v.km || 0;

        // Propietario
        const ownerNameInp = document.getElementById('modal-owner-name');
        if (ownerNameInp) ownerNameInp.value = v.ownerName || '';
        const ownerCedulaInp = document.getElementById('modal-owner-cedula');
        if (ownerCedulaInp) ownerCedulaInp.value = v.ownerCedula || '';

        // Conductor
        const isSinCond = !v.driver || v.driver === 'Sin conductor';
        if (sinConductorCheckbox) sinConductorCheckbox.checked = isSinCond;
        if (driverInput) driverInput.value = isSinCond ? '' : v.driver;
        if (cedulaInput) cedulaInput.value = (v.cedula && v.cedula !== '-') ? v.cedula : '';
        const phoneInp = document.getElementById('modal-phone');
        if (phoneInp) phoneInp.value = (v.phone && v.phone !== '-') ? v.phone : '';
        const venceLicInp = document.getElementById('modal-license-vence');
        if (venceLicInp) venceLicInp.value = v.venceLicencia || '';

        // Tarifa y estado
        const dailyRateInp = document.getElementById('modal-daily-rate');
        if (dailyRateInp) dailyRateInp.value = v.dailyRate || 50000;
        const statusSel = document.getElementById('modal-status');
        if (statusSel) statusSel.value = v.status || (isSinCond ? 'idle' : 'route');

        if (conductorBox && sinConductorCheckbox) {
          conductorBox.style.opacity = isSinCond ? '0.4' : '1';
          conductorBox.style.pointerEvents = isSinCond ? 'none' : 'auto';
        }

        assignModal.classList.remove('hidden');
        assignModal.classList.add('flex');
      } else {
        assignModal.classList.add('hidden');
        assignModal.classList.remove('flex');
      }
    }

    if (sinConductorCheckbox) {
      sinConductorCheckbox.addEventListener('change', () => {
        const checked = sinConductorCheckbox.checked;
        if (conductorBox) {
          conductorBox.style.opacity = checked ? '0.4' : '1';
          conductorBox.style.pointerEvents = checked ? 'none' : 'auto';
        }
      });
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

    ['btn-goto-add-motocarro', 'open-assign-secondary-btn', 'open-assign-modal-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => navigateTo('form-motocarro'));
    });
    document.getElementById('close-assign-modal-btn')?.addEventListener('click', () => toggleAssignModal(false));
    document.getElementById('cancel-assign-btn')?.addEventListener('click', () => toggleAssignModal(false));

    const assignForm = document.getElementById('assign-form');
    if (assignForm) {
      assignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = plateInput?.value.trim().toUpperCase() || '';
        if (!p) {
          alert('Placa no identificada.');
          return;
        }

        const isSalmon = document.getElementById('modal-color-salmon')?.checked;
        const colorVal = isSalmon ? 'Salmón' : 'Azul';
        const modelVal = document.getElementById('modal-model')?.value.trim() || 'Bajaj RE 4S';
        const chasisVal = document.getElementById('modal-chasis')?.value.trim().toUpperCase() || '-';
        const kmVal = Number(document.getElementById('modal-km')?.value || 0);

        const ownerNameVal = document.getElementById('modal-owner-name')?.value.trim() || '';
        const ownerCedulaVal = document.getElementById('modal-owner-cedula')?.value.trim() || '';

        const isSinCond = sinConductorCheckbox ? sinConductorCheckbox.checked : false;
        const dVal = (driverInput?.value || '').trim();
        const driverFinal = isSinCond || !dVal ? 'Sin conductor' : dVal;
        const cedulaFinal = isSinCond ? '-' : ((cedulaInput?.value || '').trim() || '-');
        const phoneFinal = isSinCond ? '-' : ((document.getElementById('modal-phone')?.value || '').trim() || '-');
        const venceLicFinal = isSinCond ? '' : (document.getElementById('modal-license-vence')?.value || 'Vigente');

        const dailyRateVal = Number(document.getElementById('modal-daily-rate')?.value || 50000);
        let statusVal = document.getElementById('modal-status')?.value || (driverFinal === 'Sin conductor' ? 'idle' : 'route');
        if (driverFinal === 'Sin conductor' && statusVal === 'route') statusVal = 'idle';

        window.MotoData.updateVehicle(p, {
          color: colorVal,
          model: modelVal,
          chassis: chasisVal,
          km: kmVal,
          ownerName: ownerNameVal || (driverFinal !== 'Sin conductor' ? driverFinal : 'Propietario Flota'),
          ownerCedula: ownerCedulaVal || (cedulaFinal !== '-' ? cedulaFinal : ''),
          driver: driverFinal,
          cedula: cedulaFinal,
          phone: phoneFinal,
          venceLicencia: venceLicFinal,
          dailyRate: dailyRateVal,
          status: statusVal,
          statusText: statusVal === 'route' ? 'En ruta' : (statusVal === 'workshop' ? 'En taller' : (statusVal === 'resting' ? 'Descansando' : 'Sin conductor'))
        });

        toggleAssignModal(false);
        renderFleetTable();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
        alert(`¡Motocarro ${p} actualizado correctamente con todos sus datos!`);
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
    ['cancel-buy-modal-btn', 'cancel-buy-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => toggleBuyModal(false));
    });

    const buyForm = document.getElementById('buy-motocarro-form');
    if (buyForm) {
      buyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = document.getElementById('buy-plate')?.value.trim().toUpperCase() || '';
        if (!plate) {
          alert('Por favor ingresa la placa del motocarro.');
          return;
        }
        const color = (document.querySelector('input[name="buyColor"]:checked')?.value) || (document.getElementById('buy-color')?.value) || 'Azul';
        const model = document.getElementById('buy-model')?.value.trim() || 'Bajaj RE 4S';
        const price = Number(document.getElementById('buy-price')?.value || 0);
        const account = document.getElementById('buy-account')?.value || '';
        const supplier = document.getElementById('buy-supplier')?.value.trim() || 'Distribuidor';
        const driver = document.getElementById('buy-driver')?.value.trim() || 'Sin conductor';
        const cedula = document.getElementById('buy-cedula')?.value.trim() || '-';
        const phone = document.getElementById('buy-phone')?.value.trim() || '-';

        MotoData.buyVehicle({
          plate, color, model, price, account, supplier, driver, cedula, phone,
          dailyRate: 45000,
          license: 'A2',
          venceLicencia: ''
        });

        toggleBuyModal(false);
        buyForm.reset();
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
    ['cancel-sell-modal-btn', 'cancel-sell-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => toggleSellModal(false));
    });

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
        const price = Number(document.getElementById('sell-price')?.value || 0);
        const buyer = document.getElementById('sell-buyer')?.value.trim() || 'Particular';
        const account = document.getElementById('sell-account')?.value || '';
        const notes = document.getElementById('sell-notes')?.value.trim() || 'Venta de motocarro';

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro a vender.');
          return;
        }
        if (price <= 0) {
          alert('Por favor ingresa un valor de venta válido.');
          return;
        }

        MotoData.sellVehicle({ plate, price, buyer, account, notes });
        toggleSellModal(false);
        sellForm.reset();
        renderFleetTable();
        alert(`¡Motocarro ${plate} marcado como vendido!${account ? ' Ingreso registrado en ' + account + '.' : ''}`);
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
        const isTransf = MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia');
        const matchType = activeType === 'all' || (!isTransf && t.type === activeType);
        const matchAcct = acct === 'all' || (t.account || '').toLowerCase().includes(acct.toLowerCase());

        if (matchType && matchAcct) {
          matchCount++;
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
          const isInc = t.type === 'income' && !isTransf;
          const amountClass = isTransf ? 'text-light-primary' : (isInc ? 'text-success' : 'text-light-error');
          const prefix = isTransf ? '⇄ ' : (isInc ? '+ ' : '- ');

          tr.innerHTML = `
            <td class="px-gutter-md py-3.5">
              <span class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.concept}</span>
              ${t.createdBy ? `<span class="block font-body text-[11px] text-light-outline">Turno: ${t.createdBy}</span>` : ''}
            </td>
            <td class="px-gutter-md py-3.5"><span class="font-mono text-mono-md text-light-on-surface font-bold whitespace-nowrap">${t.plate || 'General'}</span></td>
            <td class="px-gutter-md py-3.5"><span class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.account}</span></td>
            <td class="px-gutter-md py-3.5 text-right font-mono text-mono-md font-semibold ${amountClass} tabular-nums whitespace-nowrap">
              ${prefix}$ ${(t.amount || 0).toLocaleString('es-CO')}
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

    function syncWorkPlanUI() {
      const settings = MotoData.getSettings ? MotoData.getSettings() : {};
      const plan = settings.workPlan || { azulDays: 'even', salmonDays: 'odd', day31Color: 'salmon' };
      const todayBadge = document.getElementById('workplan-today-badge');
      const azulSel = document.getElementById('workplan-azul-days');
      const salmonSel = document.getElementById('workplan-salmon-days');
      const day31Sel = document.getElementById('workplan-day31-color');
      const now = new Date();
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayNum = now.getDate();
      let parityLabel = dayNum % 2 === 0 ? 'Día PAR' : 'Día IMPAR';
      if (dayNum === 31) {
        const d31Map = { salmon: 'Día 31 (🟠 Salmón)', azul: 'Día 31 (🔵 Azul)', all: 'Día 31 (Ambos)', none: 'Día 31 (Descanso)' };
        parityLabel = d31Map[plan.day31Color || 'salmon'] || 'Día 31 (Especial)';
      }
      if (todayBadge) todayBadge.textContent = `${dayNames[now.getDay()]} ${dayNum} · ${parityLabel}`;
      if (azulSel) azulSel.value = plan.azulDays || 'even';
      if (salmonSel) salmonSel.value = plan.salmonDays || 'odd';
      if (day31Sel) day31Sel.value = plan.day31Color || 'salmon';
    }

    document.getElementById('workplan-azul-days')?.addEventListener('change', (e) => {
      const settings = MotoData.getSettings ? MotoData.getSettings() : {};
      const plan = { ...(settings.workPlan || {}), azulDays: e.target.value };
      MotoData.saveSettings({ workPlan: plan });
      renderTariffVehiclesTable();
      renderTarifasKPIs();
    });
    document.getElementById('workplan-salmon-days')?.addEventListener('change', (e) => {
      const settings = MotoData.getSettings ? MotoData.getSettings() : {};
      const plan = { ...(settings.workPlan || {}), salmonDays: e.target.value };
      MotoData.saveSettings({ workPlan: plan });
      renderTariffVehiclesTable();
      renderTarifasKPIs();
    });
    document.getElementById('workplan-day31-color')?.addEventListener('change', (e) => {
      const settings = MotoData.getSettings ? MotoData.getSettings() : {};
      const plan = { ...(settings.workPlan || {}), day31Color: e.target.value };
      MotoData.saveSettings({ workPlan: plan });
      renderTariffVehiclesTable();
      renderTarifasKPIs();
    });

    function renderTariffVehiclesTable() {
      syncWorkPlanUI();
      if (!tariffVehiclesBody) return;
      const vehicles = MotoData.getVehicles ? MotoData.getVehicles().filter(v => v.status !== 'sold') : [];
      tariffVehiclesBody.innerHTML = '';

      let paidCnt = 0;
      let pendingCnt = 0;
      let restingCnt = 0;

      if (vehicles.length === 0) {
        const wpPaidEl = document.getElementById('wp-count-paid');
        const wpPendEl = document.getElementById('wp-count-pending');
        const wpRestEl = document.getElementById('wp-count-resting');
        if (wpPaidEl) wpPaidEl.textContent = 'Pago: 0';
        if (wpPendEl) wpPendEl.textContent = 'Pendiente: 0';
        if (wpRestEl) wpRestEl.textContent = 'Descansando: 0';
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
        const ws = MotoData.getVehicleWorkStatus ? MotoData.getVehicleWorkStatus(v) : { code: 'pending', label: 'Pendiente', paidToday: 0 };
        if (ws.code === 'paid') paidCnt++;
        else if (ws.code === 'pending') pendingCnt++;
        else if (ws.code === 'resting') restingCnt++;

        const isSalmon = (v.color || '').toLowerCase().includes('salm');
        const colorDot = isSalmon ? '🟠' : '🔵';

        let badgeHtml = '';
        if (ws.code === 'paid') {
          badgeHtml = `<div class="flex flex-col gap-0.5"><span class="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success-container text-on-success-container">Pago</span><span class="font-mono text-[11px] text-success tabular-nums">$ ${ws.paidToday.toLocaleString('es-CO')}</span></div>`;
        } else if (ws.code === 'pending') {
          badgeHtml = `<div class="flex items-center gap-1.5 flex-wrap"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-container text-on-warning-container">Pendiente</span><button type="button" class="quick-pay-btn px-2 py-0.5 rounded bg-light-primary text-light-on-primary text-[11px] font-label font-semibold hover:bg-light-primary-container transition-colors" data-plate="${v.plate}" data-rate="${v.dailyRate || 45000}">Cobrar</button></div>`;
        } else if (ws.code === 'resting') {
          badgeHtml = `<div class="flex items-center gap-1.5 flex-wrap"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-light-surface-container text-light-on-surface-variant">Descansando</span><button type="button" class="quick-pay-btn text-[11px] font-label text-light-primary hover:underline" data-plate="${v.plate}" data-rate="${v.dailyRate || 45000}">Registrar</button></div>`;
        } else if (ws.code === 'workshop') {
          badgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-light-error-container text-light-on-error-container">En taller</span>`;
        } else {
          badgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-light-surface-container text-light-outline">Sin conductor</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
        tr.innerHTML = `
          <td class="px-gutter-md py-3">
            <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap font-bold">${colorDot} ${v.plate}</p>
            <p class="font-body text-body-sm text-light-on-surface-variant whitespace-nowrap">${v.driver}</p>
          </td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums whitespace-nowrap">
            $ ${(v.dailyRate || 45000).toLocaleString('es-CO')}
          </td>
          <td class="px-gutter-md py-3">${badgeHtml}</td>
        `;
        tariffVehiclesBody.appendChild(tr);
      });

      const wpPaidEl = document.getElementById('wp-count-paid');
      const wpPendEl = document.getElementById('wp-count-pending');
      const wpRestEl = document.getElementById('wp-count-resting');
      if (wpPaidEl) wpPaidEl.textContent = `Pago: ${paidCnt}`;
      if (wpPendEl) wpPendEl.textContent = `Pendiente: ${pendingCnt}`;
      if (wpRestEl) wpRestEl.textContent = `Descansando: ${restingCnt}`;

      tariffVehiclesBody.querySelectorAll('.quick-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          toggleFinModal(true);
          const typeSel = document.getElementById('fin-tx-type');
          const plateSel = document.getElementById('fin-modal-plate');
          const amtInp = document.getElementById('fin-amount');
          const conceptInp = document.getElementById('fin-concept');
          if (typeSel) typeSel.value = 'income';
          if (plateSel) plateSel.value = btn.dataset.plate || '';
          if (amtInp) amtInp.value = btn.dataset.rate || '45000';
          if (conceptInp) conceptInp.value = 'Tarifa diaria';
        });
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
      const scEl = document.getElementById('selected-count');
      if (scEl) {
        const checkedCnt = document.querySelectorAll('.tarifa-vehiculo:checked').length;
        scEl.textContent = `${checkedCnt} seleccionado${checkedCnt === 1 ? '' : 's'}`;
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
      if (show && typeof populateDynamicSelects === 'function') populateDynamicSelects();
    }

    document.getElementById('edit-tariff-btn')?.addEventListener('click', () => navigateTo('form-tarifa'));
    document.getElementById('open-fin-modal-btn')?.addEventListener('click', () => toggleFinModal(true));
    document.getElementById('close-fin-modal-btn')?.addEventListener('click', () => toggleFinModal(false));
    document.getElementById('cancel-fin-btn')?.addEventListener('click', () => toggleFinModal(false));

    setupVehicleAutoFiller({
      driverSelectId: 'fin-modal-driver',
      colorSelectId: 'fin-modal-color',
      plateSelectId: 'fin-modal-plate',
      badgeId: 'fin-modal-auto-badge',
      badgeTextId: 'fin-modal-auto-badge-text'
    });

    const finForm = document.getElementById('fin-form');
    if (finForm) {
      finForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const txType = document.getElementById('fin-tx-type')?.value || 'income';
        const plate = (document.getElementById('fin-modal-plate') || document.getElementById('modal-tx-plate'))?.value || '';
        const amount = Number((document.getElementById('fin-amount') || finForm.querySelector('input[type="number"]'))?.value || 0);
        const acct = (document.getElementById('fin-tx-account') || finForm.querySelectorAll('select')[1])?.value || '';
        const concept = (document.getElementById('fin-concept') || finForm.querySelector('input[placeholder*="Ej."]'))?.value.trim() || (txType === 'income' ? 'Recaudo tarifa diaria' : 'Gasto operativo');

        if (!acct) {
          alert('Por favor selecciona o crea una cuenta financiera antes de registrar el movimiento.');
          return;
        }
        if (isNaN(amount) || amount <= 0) {
          alert('Por favor ingresa un monto válido mayor a 0.');
          return;
        }
        if (txType === 'income' && !plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const v = vehicles.find(veh => veh.plate === plate) || {};

        MotoData.addTransaction({
          type: txType,
          account: acct,
          plate: plate || 'General flota',
          driver: v.driver || 'Conductor',
          category: txType === 'income' ? 'Tarifa diaria' : 'Operativo',
          concept: concept,
          amount: amount,
          date: MotoData.getTodayLocalISO ? MotoData.getTodayLocalISO() : new Date().toISOString().split('T')[0]
        });

        toggleFinModal(false);
        finForm.reset();
        renderTarifasMovements();
        renderTariffVehiclesTable();
        renderTarifasKPIs();
        alert(`${txType === 'income' ? 'Recaudo' : 'Gasto'} de $ ${amount.toLocaleString('es-CO')} registrado en ${acct}.`);
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
        const isTransf = MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia');
        if (isTransf) return;
        if (t.type === 'income') {
          income += Number(t.amount || 0);
          incomeCount++;
        } else if (t.type === 'expense') {
          expense += Number(t.amount || 0);
          expenseCount++;
        }
      });
      const balance = income - expense;
      let paidTodayCnt = 0;
      let pendingTodayCnt = 0;
      vehicles.forEach(v => {
        const ws = MotoData.getVehicleWorkStatus ? MotoData.getVehicleWorkStatus(v) : { code: 'pending' };
        if (ws.code === 'paid') paidTodayCnt++;
        else if (ws.code === 'pending') pendingTodayCnt++;
      });

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
      if (incomeSubEl) incomeSubEl.textContent = `${paidTodayCnt} pago${paidTodayCnt === 1 ? '' : 's'} hoy · ${pendingTodayCnt} pendiente${pendingTodayCnt === 1 ? '' : 's'}`;

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
              <p class="font-body text-body-md text-light-on-surface tabular-nums whitespace-nowrap font-medium">${o.nextDate || o.date || '-'}</p>
              <p class="font-body text-body-xs text-light-outline tabular-nums whitespace-nowrap">${o.nextDate ? `Realizado: ${o.date}` : (o.km ? `${o.km} km` : '-')}</p>
            </td>
            <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums whitespace-nowrap font-semibold">
              $ ${(o.cost || 0).toLocaleString('es-CO')}
            </td>
            <td class="px-gutter-md py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
                ${isDone ? 'Terminado' : 'En taller'}
              </span>
            </td>
            <td class="px-gutter-md py-3 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1 justify-end">
                <button type="button" class="complete-order-btn inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-label font-semibold ${isDone ? 'text-light-on-surface-variant hover:bg-light-surface-container' : 'text-success hover:bg-success-container/50'}" data-id="${o.id}" title="${isDone ? 'Reabrir orden' : 'Marcar terminada'}">
                  <span class="material-symbols-outlined text-[16px]">${isDone ? 'replay' : 'check_circle'}</span>
                  <span>${isDone ? 'Reabrir' : 'Terminar'}</span>
                </button>
                <button type="button" class="delete-order-btn inline-flex items-center p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition" data-id="${o.id}" title="Eliminar orden">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </td>
          `;
          ordersTableBody.appendChild(tr);
        }
      });

      if (visible === 0) {
        ordersTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
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
      } else {
        ordersTableBody.querySelectorAll('.complete-order-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const res = window.MotoData.completeMaintenanceOrder(btn.dataset.id);
            if (res && res.success) {
              renderOrdersTable();
            }
          });
        });
        ordersTableBody.querySelectorAll('.delete-order-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (confirm('¿Seguro que deseas eliminar esta orden de mantenimiento?')) {
              const res = window.MotoData.deleteMaintenanceOrder(btn.dataset.id);
              if (res && res.success) {
                renderOrdersTable();
              }
            }
          });
        });
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
      const stockAllEl = document.getElementById('count-stock-all');
      const stockLowEl = document.getElementById('count-stock-low');
      const stockLowTabEl = document.getElementById('badge-stock-low-tab');
      const lowCount = parts.filter(p => (p.stock ?? p.qty ?? 0) <= (p.minStock ?? p.min ?? 2)).length;
      if (stockAllEl) stockAllEl.textContent = parts.length;
      if (stockLowEl) stockLowEl.textContent = lowCount;
      if (stockLowTabEl) stockLowTabEl.textContent = lowCount;

      stockBody.innerHTML = '';
      if (parts.length === 0) {
        stockBody.innerHTML = `
          <tr>
            <td colspan="7" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[44px] text-light-outline">inventory_2</span>
                <p class="font-headline text-headline-sm text-light-on-surface">Inventario de repuestos vacío</p>
                <p class="text-sm text-light-on-surface-variant max-w-sm">Ingresa aceites, bandas, filtros o repuestos para controlar las existencias de tu flota.</p>
                <button type="button" class="btn-open-spare-modal inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md font-bold hover:bg-light-primary-container shadow-xs mt-2">
                  <span class="material-symbols-outlined text-[18px]">add_box</span>
                  <span>Ingresar Primer Repuesto</span>
                </button>
              </div>
            </td>
          </tr>
        `;
        stockBody.querySelectorAll('.btn-open-spare-modal').forEach(b => {
          b.addEventListener('click', () => togglePartModal(true));
        });
        return;
      }
      parts.forEach(p => {
        const minQty = p.minStock !== undefined ? p.minStock : (p.min !== undefined ? p.min : 2);
        const qty = p.stock !== undefined ? p.stock : (p.qty || 0);
        const isLow = qty <= minQty;
        const unitPrice = p.unitPrice !== undefined ? p.unitPrice : (p.price || 0);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
        tr.innerHTML = `
          <td class="px-gutter-md py-3"><span class="font-mono text-mono-md text-light-outline">${p.code || '-'}</span></td>
          <td class="px-gutter-md py-3 font-body font-semibold text-light-on-surface">${p.name}</td>
          <td class="px-gutter-md py-3"><span class="font-label text-label-sm px-2 py-0.5 rounded bg-light-surface-container">${p.category || 'General'}</span></td>
          <td class="px-gutter-md py-3 font-mono text-mono-md ${isLow ? 'text-light-error font-bold' : 'text-light-on-surface'} tabular-nums">${qty} und.</td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-outline tabular-nums">${minQty} und.</td>
          <td class="px-gutter-md py-3 font-mono text-mono-md text-light-on-surface tabular-nums">$ ${unitPrice.toLocaleString('es-CO')}</td>
          <td class="px-gutter-md py-3 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-light-error-container text-light-on-error-container' : 'bg-success-container text-on-success-container'}">
              ${isLow ? 'Bajo stock' : 'Disponible'}
            </span>
            <button type="button" class="btn-del-part text-red-500 hover:text-red-700 ml-2 inline-flex items-center p-1 rounded hover:bg-red-50 transition" data-code="${p.code}" data-name="${p.name}" title="Eliminar repuesto">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </td>
        `;
        stockBody.appendChild(tr);
      });

      // Listeners de eliminar repuesto
      stockBody.querySelectorAll('.btn-del-part').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          const code = btn.dataset.code;
          if (confirm(`¿Seguro que deseas eliminar el repuesto "${name}" del inventario?`)) {
            const res = window.MotoData.deleteSparePart(code || name);
            if (res && res.success) {
              renderStockTable();
              alert(`Repuesto "${name}" eliminado del inventario.`);
            } else {
              alert('No se pudo eliminar el repuesto: ' + (res?.message || 'Error'));
            }
          }
        });
      });
    }

    // Tabla e ingreso de Uso / Descuento Directo de Repuestos
    function renderUsageTable() {
      const usageBody = document.getElementById('usage-table-body');
      if (!usageBody) return;
      const usages = MotoData.getPartUsages ? MotoData.getPartUsages() : [];
      usageBody.innerHTML = '';

      if (usages.length === 0) {
        usageBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-gutter-md py-8 text-center text-light-on-surface-variant font-body">
              <p class="font-body text-body-md text-light-on-surface font-medium">Aún no se han registrado consumos de repuestos</p>
              <p class="font-body text-body-sm text-light-outline mt-0.5">Selecciona un motocarro y un repuesto del inventario para descontarlo del stock.</p>
            </td>
          </tr>
        `;
        return;
      }

      usages.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-light-surface-container-low transition-colors duration-state-change';
        tr.innerHTML = `
          <td class="px-gutter-md py-3"><span class="font-mono text-mono-md font-bold text-light-on-surface whitespace-nowrap">${u.plate || '-'}</span></td>
          <td class="px-gutter-md py-3 font-body text-body-md text-light-on-surface">${u.partName || u.partCode || '-'}</td>
          <td class="px-gutter-md py-3"><span class="font-label text-label-sm px-2 py-0.5 rounded bg-light-surface-container text-light-on-surface-variant">${u.service || 'Mantenimiento'}</span></td>
          <td class="px-gutter-md py-3 font-mono text-mono-md tabular-nums whitespace-nowrap">${u.qty || 1} und.</td>
          <td class="px-gutter-md py-3 font-body text-body-sm text-light-outline tabular-nums whitespace-nowrap">${u.date || '-'}</td>
          <td class="px-gutter-md py-3 text-right font-mono text-mono-md font-semibold text-light-on-surface tabular-nums whitespace-nowrap">$ ${(u.total || 0).toLocaleString('es-CO')}</td>
        `;
        usageBody.appendChild(tr);
      });
    }

    const partUsageForm = document.getElementById('part-usage-form');
    if (partUsageForm) {
      partUsageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plate = document.getElementById('usage-plate')?.value || '';
        const partKey = document.getElementById('usage-part')?.value || '';
        const qty = Math.max(1, Number(document.getElementById('usage-qty')?.value || 1));

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }
        if (!partKey) {
          alert('Por favor selecciona un repuesto del inventario.');
          return;
        }

        const parts = MotoData.getSpareParts ? MotoData.getSpareParts() : [];
        const partObj = parts.find(p => (p.code || p.name) === partKey) || {};
        const availStock = Number(partObj.stock ?? 0);
        if (partObj.name && availStock <= 0) {
          alert(`El repuesto "${partObj.name}" tiene stock en 0. Ingresa más unidades en Inventario.`);
          return;
        }
        if (partObj.name && qty > availStock) {
          alert(`Solo hay ${availStock} unidad(es) disponible(s) de "${partObj.name}".`);
          return;
        }

        const res = MotoData.addPartUsage({
          plate: plate,
          partCode: partObj.code || partKey,
          partName: partObj.name || partKey,
          service: partObj.category || 'Consumo taller',
          qty: qty,
          unitPrice: Number(partObj.unitPrice ?? partObj.price ?? 0),
          date: new Date().toISOString().split('T')[0]
        });

        if (res && res.success) {
          partUsageForm.reset();
          const qtyInput = document.getElementById('usage-qty');
          if (qtyInput) qtyInput.value = '1';
          if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
          renderUsageTable();
          renderStockTable();
          alert(`Uso de ${qty} und. de "${partObj.name || partKey}" descontado para el motocarro ${plate}.`);
        }
      });
    }

    // Modal Ingresar Nuevo Repuesto
    const partModal = document.getElementById('spare-part-modal');
    function togglePartModal(show) {
      if (!partModal) return;
      partModal.classList.toggle('hidden', !show);
      partModal.classList.toggle('flex', show);
      if (show) {
        if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
        updateSpAccountState();
      }
    }

    function updateSpAccountState() {
      const isCompra = document.getElementById('sp-tipo-compra')?.checked;
      const accountBox = document.getElementById('sp-account-container');
      const noticeBox = document.getElementById('sp-initial-notice');
      if (accountBox) accountBox.classList.toggle('hidden', !isCompra);
      if (noticeBox) noticeBox.classList.toggle('hidden', isCompra);
    }

    document.getElementById('sp-tipo-inicial')?.addEventListener('change', updateSpAccountState);
    document.getElementById('sp-tipo-compra')?.addEventListener('change', updateSpAccountState);

    // Conectar los botones que abren el modal de repuestos
    document.querySelectorAll('#open-part-modal-btn, .btn-open-spare-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePartModal(true);
      });
    });
    ['close-spare-part-modal-btn', 'close-part-modal-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => togglePartModal(false));
    });
    ['cancel-spare-part-btn', 'cancel-part-btn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => togglePartModal(false));
    });

    const partForm = document.getElementById('spare-part-form');
    if (partForm) {
      partForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = (document.getElementById('sp-code') || document.getElementById('part-code'))?.value.trim() || `REP-${Date.now().toString().slice(-4)}`;
        const name = (document.getElementById('sp-name') || document.getElementById('part-name'))?.value.trim();
        if (!name) {
          alert('Por favor ingresa el nombre del repuesto.');
          return;
        }

        const category = (document.getElementById('sp-category') || document.getElementById('part-category'))?.value || 'Lubricantes';
        const supplier = document.getElementById('sp-supplier')?.value.trim() || '';
        const qty = Number((document.getElementById('sp-qty') || document.getElementById('part-stock'))?.value || 1);
        const minStock = Number((document.getElementById('sp-min-stock') || document.getElementById('part-min'))?.value || 1);
        const unitPrice = Number((document.getElementById('sp-price') || document.getElementById('part-price'))?.value || 0);

        const isCompra = document.getElementById('sp-tipo-compra')?.checked;
        const account = isCompra ? (document.getElementById('sp-account')?.value || '') : '';

        if (isCompra && !account) {
          alert('Por favor selecciona la cuenta de la cual se descontará el dinero de la compra.');
          return;
        }

        window.MotoData.addSparePart({
          code,
          name,
          category,
          supplier: supplier || (isCompra ? 'Proveedor' : 'Inventario Inicial'),
          qty,
          unitPrice,
          minStock,
          account,
          isInitial: !isCompra
        });

        togglePartModal(false);
        partForm.reset();
        document.getElementById('sp-tipo-inicial').checked = true;
        updateSpAccountState();
        renderStockTable();
        alert(isCompra 
          ? `¡Repuesto "${name}" registrado en stock y egreso de $${(qty * unitPrice).toLocaleString('es-CO')} descontado de "${account}"!`
          : `¡Repuesto "${name}" agregado como Inventario Inicial (${qty} und.) sin descontar de ninguna cuenta!`
        );
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

    // Botones rápidos de días (chips) en Nuevo Tipo de Mantenimiento
    document.querySelectorAll('.mt-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const daysInput = document.getElementById('mt-freq-days');
        const ctrlSelect = document.getElementById('mt-control-type');
        if (daysInput && btn.dataset.days) daysInput.value = btn.dataset.days;
        if (ctrlSelect) ctrlSelect.value = 'dias';
      });
    });

    const maintTypeForm = document.getElementById('new-maint-type-form');
    if (maintTypeForm) {
      maintTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('mt-name')?.value.trim();
        const classification = document.getElementById('mt-classification')?.value || 'Preventivo';
        const controlType = document.getElementById('mt-control-type')?.value || 'dias';
        const frequencyDays = Number(document.getElementById('mt-freq-days')?.value || 30);
        const frequencyKm = Number(document.getElementById('mt-freq')?.value || 3000);
        const estLabor = Number(document.getElementById('mt-labor')?.value || 0);
        const desc = document.getElementById('mt-desc')?.value.trim();

        MotoData.addMaintenanceType({ name, classification, controlType, frequencyDays, frequencyKm, estLabor, desc });
        toggleMaintTypeModal(false);
        maintTypeForm.reset();
        alert(`¡Nuevo tipo de mantenimiento "${name}" configurado exitosamente (${controlType === 'dias' ? frequencyDays + ' días' : frequencyKm + ' km'})!`);
        window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
      });
    }

    // Modal Configuración de Frecuencias de Mantenimiento (Días / Km)
    const intervalsModal = document.getElementById('intervals-config-modal');
    const intervalsList = document.getElementById('intervals-types-list');

    function toggleIntervalsModal(show) {
      if (!intervalsModal) return;
      if (show) {
        renderIntervalsConfigList();
        intervalsModal.classList.remove('hidden');
        intervalsModal.classList.add('flex');
      } else {
        intervalsModal.classList.add('hidden');
        intervalsModal.classList.remove('flex');
      }
    }

    function renderIntervalsConfigList() {
      if (!intervalsList) return;
      const types = MotoData.getMaintenanceTypes ? MotoData.getMaintenanceTypes() : [];
      intervalsList.innerHTML = '';

      if (types.length === 0) {
        intervalsList.innerHTML = '<div class="p-4 text-center text-sm text-light-on-surface-variant font-body">No hay tipos de mantenimiento configurados.</div>';
        return;
      }

      types.forEach(t => {
        const item = document.createElement('div');
        item.className = 'p-3.5 bg-light-surface flex flex-col gap-2.5 hover:bg-light-surface-container-low transition-colors';
        item.dataset.typeId = t.id;

        const isDays = (t.controlType || 'dias') === 'dias';

        item.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="font-label text-label-md font-bold text-light-on-surface">${t.name}</h4>
              <p class="font-body text-body-xs text-light-on-surface-variant">${t.desc || ''}</p>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded font-label font-semibold ${t.classification === 'Preventivo' ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container'}">${t.classification}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-2 border-t border-light-outline-variant/60">
            <div class="sm:col-span-4 flex items-center gap-2">
              <label class="text-xs font-semibold text-light-on-surface whitespace-nowrap">Controlar por:</label>
              <select class="type-ctrl-select w-full rounded border border-light-outline-variant bg-light-surface text-xs px-2 py-1.5 font-label focus:border-light-primary">
                <option value="dias" ${isDays ? 'selected' : ''}>📅 Por Días</option>
                <option value="km" ${!isDays ? 'selected' : ''}>⚡ Por Kilómetros (Km)</option>
              </select>
            </div>
            <div class="sm:col-span-4 flex items-center gap-1.5">
              <label class="text-xs font-semibold text-light-primary whitespace-nowrap">Días:</label>
              <input type="number" min="1" max="730" value="${t.frequencyDays || 30}" class="type-days-input w-24 rounded border-2 border-light-primary bg-light-surface px-2.5 py-1 text-xs font-mono font-bold text-light-on-surface focus:ring-1 focus:ring-light-primary" />
              <span class="text-xs text-light-outline">días</span>
            </div>
            <div class="sm:col-span-4 flex items-center gap-1.5">
              <label class="text-xs text-light-outline whitespace-nowrap">O en Km:</label>
              <input type="number" min="100" max="100000" step="500" value="${t.frequencyKm || 3000}" class="type-km-input w-28 rounded border border-light-outline-variant bg-light-surface px-2.5 py-1 text-xs font-mono text-light-on-surface" />
              <span class="text-xs text-light-outline">km</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[11px] text-light-on-surface-variant font-medium">Ajustes directos:</span>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-semibold border border-light-outline-variant hover:bg-light-secondary-container/40" data-val="25">25 d</button>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-semibold border border-light-outline-variant hover:bg-light-secondary-container/40" data-val="30">30 d (Aceite)</button>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-semibold border border-light-outline-variant hover:bg-light-secondary-container/40" data-val="60">60 d (Frenos)</button>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-semibold border border-light-outline-variant hover:bg-light-secondary-container/40" data-val="90">90 d (General)</button>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-semibold border border-light-outline-variant hover:bg-light-secondary-container/40" data-val="180">180 d (Cadena)</button>
            <button type="button" class="chip-interval-day px-2 py-0.5 rounded text-[11px] font-label font-bold border border-light-primary text-light-primary hover:bg-light-primary/10" data-val="365">365 d (1 año / Llantas)</button>
          </div>
        `;

        item.querySelectorAll('.chip-interval-day').forEach(chip => {
          chip.addEventListener('click', () => {
            const daysInput = item.querySelector('.type-days-input');
            const ctrlSelect = item.querySelector('.type-ctrl-select');
            if (daysInput && chip.dataset.val) daysInput.value = chip.dataset.val;
            if (ctrlSelect) ctrlSelect.value = 'dias';
          });
        });

        intervalsList.appendChild(item);
      });
    }

    document.getElementById('btn-open-intervals-config')?.addEventListener('click', () => toggleIntervalsModal(true));
    document.getElementById('btn-open-intervals-from-form')?.addEventListener('click', () => toggleIntervalsModal(true));
    document.getElementById('close-intervals-modal-btn')?.addEventListener('click', () => toggleIntervalsModal(false));

    document.getElementById('btn-add-type-from-intervals')?.addEventListener('click', () => {
      toggleIntervalsModal(false);
      toggleMaintTypeModal(true);
    });

    document.getElementById('btn-save-all-intervals')?.addEventListener('click', () => {
      if (!intervalsList) return;
      const items = intervalsList.querySelectorAll('[data-type-id]');
      items.forEach(item => {
        const id = item.dataset.typeId;
        const ctrl = item.querySelector('.type-ctrl-select')?.value || 'dias';
        const days = Number(item.querySelector('.type-days-input')?.value || 30);
        const km = Number(item.querySelector('.type-km-input')?.value || 3000);
        MotoData.updateMaintenanceType(id, {
          controlType: ctrl,
          frequencyDays: days,
          frequencyKm: km
        });
      });
      toggleIntervalsModal(false);
      alert('✅ ¡Frecuencias de mantenimiento actualizadas con éxito!');
      window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    });

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
        const type = document.getElementById('maint-modal-type')?.value || 'Preventivo';
        const desc = (document.getElementById('maint-modal-desc') || maintForm.querySelector('input[type="text"]'))?.value.trim() || `Mantenimiento ${type.toLowerCase()}`;
        const date = document.getElementById('maint-modal-date')?.value || new Date().toISOString().split('T')[0];
        const cost = Number((document.getElementById('maint-modal-cost') || maintForm.querySelector('input[type="number"]'))?.value || 0);

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const v = vehicles.find(veh => veh.plate === plate) || {};

        MotoData.addMaintenanceOrder({
          plate: plate,
          driver: v.driver || 'Conductor',
          cost: cost,
          desc: desc,
          type: type,
          date: date,
          status: 'scheduled'
        });

        toggleMaintModal(false);
        maintForm.reset();
        renderOrdersTable();
        alert(`Orden de mantenimiento programada para ${plate}.`);
      });
    }

    renderOrdersTable();
    renderStockTable();
    renderUsageTable();
    window.addEventListener('motocontrol-data-updated', () => {
      renderOrdersTable();
      renderStockTable();
      renderUsageTable();
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

        let okType = false;
        if (typeFilter === 'all') {
          okType = true;
        } else if (typeFilter === 'SOAT') {
          okType = (doc.type || '').toUpperCase() === 'SOAT';
        } else if (typeFilter === 'Tecnomecánica') {
          okType = (doc.type || '').toLowerCase().includes('tecno');
        } else if (typeFilter === 'Impuesto') {
          const t = (doc.type || '').toLowerCase();
          okType = t.includes('impuesto') || t.includes('derechos') || t.includes('gobernación') || t.includes('alcaldía') || t.includes('rodamiento');
        } else {
          okType = doc.type === typeFilter;
        }

        const computed = (MotoData.computeDocumentStatus && doc.expiry)
          ? MotoData.computeDocumentStatus(doc.expiry)
          : { status: doc.status || 'valid', statusText: doc.statusText || 'Vigente' };
        let docState = computed.status || 'valid';
        const docStatusText = computed.statusText || 'Por vencer';
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
            badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-warning-container text-on-warning-container font-label text-label-sm font-semibold">${docStatusText}</span>`;
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
              <div class="inline-flex items-center gap-2 justify-end">
                <button class="renew-doc-btn font-label text-label-md text-light-primary hover:underline whitespace-nowrap" data-doc="${doc.type}" data-plate="${doc.plate}" type="button">${docState === 'expired' ? 'Renovar' : 'Actualizar'}</button>
                <button class="delete-doc-btn inline-flex items-center p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition" data-id="${doc.id}" data-doc="${doc.type}" data-plate="${doc.plate}" type="button" title="Eliminar documento">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
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

      tableBody.querySelectorAll('.delete-doc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm(`¿Seguro que deseas eliminar el documento ${btn.dataset.doc} del motocarro ${btn.dataset.plate}?`)) {
            const res = window.MotoData.deleteDocument(btn.dataset.id);
            if (res && res.success) renderDocsTable();
          }
        });
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
        if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
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
        const plate = modalPlate?.value || '';
        const type = modalDoc?.value || 'SOAT';
        const number = document.getElementById('modal-doc-number')?.value.trim() || `POL-${Date.now().toString().slice(-6)}`;
        const expiry = document.getElementById('modal-doc-expiry')?.value || '';
        const cost = Number(document.getElementById('modal-doc-cost')?.value || 0);
        const account = document.getElementById('modal-doc-account')?.value || '';

        if (!plate) {
          alert('Por favor selecciona la placa del motocarro.');
          return;
        }
        if (!expiry) {
          alert('Por favor selecciona la nueva fecha de vencimiento.');
          return;
        }

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const v = vehicles.find(veh => veh.plate === plate) || {};
        const entityName = type === 'SOAT' ? 'Aseguradora SOAT' : (type.includes('Tecno') ? 'CDA Autorizado' : 'Tránsito / Gobernación');

        if (MotoData.quickUpdateDocumentByPlate) {
          MotoData.quickUpdateDocumentByPlate(plate, {
            type: type,
            expiry: expiry,
            number: number,
            entity: entityName,
            cost: cost
          });
        } else {
          MotoData.addDocument({
            plate: plate,
            driver: v.driver || 'Conductor asignado',
            cedula: v.cedula || '-',
            type: type,
            entity: entityName,
            number: number,
            expiry: expiry,
            cost: cost
          });
        }

        if (cost > 0 && account) {
          MotoData.addTransaction({
            type: 'expense',
            account: account,
            plate: plate,
            driver: v.driver || 'Conductor asignado',
            category: 'SOAT / Tecnomecánica',
            concept: `Renovación ${type} ${plate} (${number})`,
            amount: cost,
            date: new Date().toISOString().split('T')[0]
          });
        }

        toggleDocModal(false);
        renderDocsTable();
        alert(`Renovación de ${type} para ${plate} guardada con éxito.`);
      });
    }

    // =========================================================================
    // MODAL ALERTAS AUTOMÁTICAS POR CORREO
    // =========================================================================
    const emailModal = document.getElementById('email-alerts-modal');
    const alertEmailsInput = document.getElementById('alert-emails-input');
    const chkSoat = document.getElementById('chk-alert-soat');
    const chkTaxes = document.getElementById('chk-alert-taxes');
    const chkOil = document.getElementById('chk-alert-oil');
    const btnTestEmail = document.getElementById('btn-test-email');
    const emailAlertsForm = document.getElementById('email-alerts-form');

    function openEmailAlertsModal() {
      if (!emailModal) return;
      const settings = MotoData.getSettings ? MotoData.getSettings() : {};
      if (alertEmailsInput) {
        alertEmailsInput.value = settings.alertEmails || '';
      }
      if (chkSoat) chkSoat.checked = settings.alertSoat !== false;
      if (chkTaxes) chkTaxes.checked = settings.alertTaxes !== false;
      if (chkOil) chkOil.checked = settings.alertOil !== false;
      emailModal.classList.remove('hidden');
      emailModal.classList.add('flex');
    }

    function closeEmailAlertsModal() {
      if (!emailModal) return;
      emailModal.classList.add('hidden');
      emailModal.classList.remove('flex');
    }

    document.getElementById('btn-open-email-alerts-modal')?.addEventListener('click', openEmailAlertsModal);
    document.getElementById('close-email-modal-btn')?.addEventListener('click', closeEmailAlertsModal);
    document.getElementById('cancel-email-modal-btn')?.addEventListener('click', closeEmailAlertsModal);

    if (emailAlertsForm) {
      emailAlertsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emails = (alertEmailsInput?.value || '').trim();
        const newSettings = {
          alertEmails: emails,
          emailAlertsEnabled: Boolean(emails),
          alertSoat: chkSoat ? chkSoat.checked : true,
          alertTaxes: chkTaxes ? chkTaxes.checked : true,
          alertOil: chkOil ? chkOil.checked : true
        };
        MotoData.saveSettings(newSettings);
        closeEmailAlertsModal();
        alert(emails ? `✅ Notificaciones por correo activadas para:\n${emails}\n\nRecibirás avisos preventivos de SOAT, Tecno, Impuestos y Cambios de Aceite.` : 'Configuración de alertas guardada.');
      });
    }

    if (btnTestEmail) {
      btnTestEmail.addEventListener('click', () => {
        const emails = (alertEmailsInput?.value || '').trim();
        if (!emails) {
          alert('Por favor ingresa al menos un correo electrónico para enviar la prueba.');
          return;
        }
        btnTestEmail.disabled = true;
        btnTestEmail.innerHTML = '<span class="material-symbols-outlined text-[16px]">sync</span> Enviando...';
        setTimeout(() => {
          btnTestEmail.disabled = false;
          btnTestEmail.innerHTML = '<span class="material-symbols-outlined text-[16px]">send</span> <span>Enviar Correo de Prueba</span>';
          alert(`📧 ¡Correo de prueba enviado con éxito a:\n${emails}!\n\nEl correo incluye:\n- Vigencia de SOAT y Tecnomecánica\n- Impuesto Departamental (Gobernación) y Rodamiento (Alcaldía)\n- Recordatorio de cambios de aceite por cumplir el ciclo de días.`);
        }, 1000);
      });
    }

    renderDocsTable();
    window.addEventListener('motocontrol-data-updated', renderDocsTable);
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

    document.getElementById('btn-goto-transfer')?.addEventListener('click', () => {
      navigateTo('form-movimiento');
      const transfRadio = document.querySelector('input[name="movTipo"][value="Transferencia"]') || document.querySelector('input[name="tipo-movimiento"][value="Transferencia"]');
      if (transfRadio) {
        transfRadio.checked = true;
        transfRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

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
        const isTransf = MotoData.isTransferTx ? MotoData.isTransferTx(t) : (t.type === 'transfer' || t.category === 'Transferencia');
        const rowAccount = (t.account || '').toLowerCase() + ' ' + (t.fromAccount || '').toLowerCase() + ' ' + (t.toAccount || '').toLowerCase();
        const rowCat = (isTransf ? 'Transferencia' : (t.category || (t.type === 'income' ? 'Ingreso' : 'Gasto'))).toLowerCase();
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
          const isInc = t.type === 'income' && !isTransf;
          const badgeClass = isTransf
            ? 'bg-light-secondary-container text-light-on-secondary-container font-semibold'
            : (isInc ? 'bg-success-container text-on-success-container' : 'bg-light-surface-container text-light-on-surface-variant');
          const badgeText = isTransf ? '⇄ Transferencia' : (t.category || (isInc ? 'Ingreso' : 'Operativo'));
          const amtColor = isTransf ? 'text-light-primary' : (isInc ? 'text-success' : 'text-light-error');
          const amtPrefix = isTransf ? '⇄ ' : (isInc ? '+ ' : '- ');

          tr.innerHTML = `
            <td class="px-gutter-md py-3">
              <span class="font-body text-body-sm text-light-outline tabular-nums whitespace-nowrap">${t.date || '-'}</span>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-body text-body-md text-light-on-surface whitespace-nowrap">${t.concept || '-'}</p>
              ${t.createdBy ? `<p class="font-body text-[11px] text-light-outline whitespace-nowrap">Turno: ${t.createdBy}</p>` : ''}
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-label text-label-sm px-2 py-0.5 rounded ${badgeClass}">${badgeText}</span>
            </td>
            <td class="px-gutter-md py-3">
              <p class="font-mono text-mono-md text-light-on-surface whitespace-nowrap">${t.plate || 'General'}</p>
              ${t.driver && t.driver !== '-' ? `<p class="font-body text-body-xs text-light-outline whitespace-nowrap">${t.driver}</p>` : ''}
            </td>
            <td class="px-gutter-md py-3">
              <span class="font-body text-body-sm text-light-on-surface whitespace-nowrap">${t.account || '-'}</span>
            </td>
            <td class="px-gutter-md py-3 text-right">
              <span class="font-mono text-mono-md font-semibold ${amtColor} tabular-nums whitespace-nowrap">
                ${amtPrefix}$ ${(t.amount || 0).toLocaleString('es-CO')}
              </span>
            </td>
            <td class="px-gutter-md py-3 text-right whitespace-nowrap">
              <button type="button" class="delete-tx-btn inline-flex items-center p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition" data-id="${t.id}" title="Eliminar movimiento">
                <span class="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </td>
          `;
          ledgerBody.appendChild(tr);
        }
      });

      if (visible === 0) {
        ledgerBody.innerHTML = `
          <tr>
            <td colspan="7" class="px-gutter-md py-12 text-center text-light-on-surface-variant font-body">
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
      } else {
        ledgerBody.querySelectorAll('.delete-tx-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (confirm('¿Seguro que deseas eliminar este movimiento contable? El saldo de la cuenta se recalculará automáticamente.')) {
              const res = window.MotoData.deleteTransaction(btn.dataset.id);
              if (res && res.success) {
                renderLedgerTable();
                if (typeof renderAccountsCards === 'function') renderAccountsCards();
              }
            }
          });
        });
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
          <div class="pt-2 flex justify-end">
            <button type="button" class="btn-delete-account inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition" data-account-name="${acc.name}">
              <span class="material-symbols-outlined text-[15px]">delete</span> Eliminar cuenta
            </button>
          </div>
        `;
        grid.appendChild(card);
      });

      // Listeners de botones Eliminar cuenta
      grid.querySelectorAll('.btn-delete-account').forEach(btn => {
        btn.addEventListener('click', () => {
          const accName = btn.dataset.accountName;
          if (confirm(`¿Seguro que deseas eliminar la cuenta "${accName}"? Esta acción no se puede deshacer.`)) {
            const res = window.MotoData.deleteAccount(accName);
            if (res && res.success) {
              renderAccountsCards();
              if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
              alert(`Cuenta "${accName}" eliminada.`);
            } else {
              alert('No se pudo eliminar la cuenta: ' + (res?.message || 'Error desconocido'));
            }
          }
        });
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

    // Botones rápidos de tarifa diaria sugerida
    document.querySelectorAll('.chip-tarifa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById('tarifa-asignada');
        if (inp && btn.dataset.val) inp.value = btn.dataset.val;
      });
    });

    // Conexión checkbox: El conductor es el mismo propietario
    const mismoPropietarioToggle = document.getElementById('mismo-propietario-toggle');
    if (mismoPropietarioToggle) {
      mismoPropietarioToggle.addEventListener('change', () => {
        if (mismoPropietarioToggle.checked) {
          const propNombre = document.getElementById('propietario-nombre');
          const propCedula = document.getElementById('propietario-cedula');
          if (nombreConductor && propNombre && nombreConductor.value) propNombre.value = nombreConductor.value;
          if (cedula && propCedula && cedula.value) propCedula.value = cedula.value;
        }
      });
    }

    if (formMoto) {
      let isSubmitting = false;

      const handleMotoSubmit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        if (isSubmitting) return;

        const placaInput = document.getElementById('placa');
        const placa = (placaInput?.value || '').toUpperCase().trim();
        if (!placa) {
          alert('⚠️ Por favor ingresa la Placa del motocarro en la Sección 1 (por ejemplo: MCT-912).');
          if (placaInput) {
            placaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            placaInput.focus();
            placaInput.classList.add('border-red-500', 'ring-2', 'ring-red-500');
            setTimeout(() => {
              placaInput.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            }, 4000);
          }
          return;
        }

        const isSinConductor = Boolean(sinConductorToggle?.checked) || !(nombreConductor?.value || '').trim();
        const nombreConductorVal = isSinConductor ? 'Sin conductor' : (nombreConductor?.value || '').trim();

        const tarifaInput = document.getElementById('tarifa-asignada');
        const tarifa = Number(tarifaInput?.value || 50000);
        if (isNaN(tarifa) || tarifa <= 0) {
          alert('⚠️ Por favor ingresa un valor válido para la tarifa diaria (mayor a 0).');
          if (tarifaInput) {
            tarifaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tarifaInput.focus();
          }
          return;
        }

        const existingVeh = MotoData.findVehicle ? MotoData.findVehicle({ plate: placa }) : null;
        if (existingVeh && existingVeh.status !== 'sold') {
          alert(`⚠️ Ya existe un motocarro activo con la placa ${placa}. Si deseas editarlo, puedes ir a la vista Flota.`);
          if (placaInput) {
            placaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            placaInput.focus();
          }
          return;
        }

        isSubmitting = true;
        setTimeout(() => { isSubmitting = false; }, 1000);

        const colorRadio = document.querySelector('input[name="colorVehiculo"]:checked') || document.querySelector('input[name="color-motocarro"]:checked');
        const color = colorRadio ? colorRadio.value : 'Azul';
        const modelo = (document.getElementById('marca-modelo') || document.getElementById('modelo'))?.value.trim() || 'Bajaj RE 4S';
        const anio = document.getElementById('anio')?.value || '2025';
        const chasisVal = (document.getElementById('chasis')?.value || '').trim().toUpperCase() || '-';
        const propNombreVal = (document.getElementById('propietario-nombre')?.value || '').trim();
        const propCedulaVal = (document.getElementById('propietario-cedula')?.value || '').trim();

        const cc = isSinConductor ? '-' : (cedula?.value.trim() || '-');
        const tel = isSinConductor ? '-' : (telefono?.value.trim() || '-');
        const lic = document.getElementById('licencia')?.value || 'A2';
        const venceLic = document.getElementById('vence-licencia')?.value || '';
        const cuenta = document.getElementById('cuenta-recaudo')?.value || '';
        const kmVal = Number(document.getElementById('kilometraje')?.value || 0);

        try {
          window.MotoData.addVehicle({
            plate: placa,
            color: color,
            model: `${modelo} (${anio})`,
            chassis: chasisVal,
            ownerName: propNombreVal || (nombreConductorVal !== 'Sin conductor' ? nombreConductorVal : 'Propietario Flota'),
            ownerCedula: propCedulaVal || (cc !== '-' ? cc : ''),
            driver: nombreConductorVal,
            cedula: cc,
            phone: tel,
            license: lic,
            venceLicencia: venceLic || 'Vigente',
            dailyRate: tarifa,
            account: cuenta,
            status: isSinConductor ? 'idle' : 'route',
            statusText: isSinConductor ? 'Sin conductor' : 'En ruta',
            soatExpiry: 'Vigente',
            tecnoExpiry: 'Vigente',
            km: kmVal
          });

          // In-page feedback banner si está disponible
          const feedbackSuccess = document.getElementById('feedback-success');
          const feedbackTitle = document.getElementById('feedback-title');
          const feedbackDetail = document.getElementById('feedback-detail');
          if (feedbackSuccess && feedbackTitle && feedbackDetail) {
            feedbackTitle.textContent = `¡Motocarro ${placa} guardado con éxito!`;
            feedbackDetail.textContent = `Asignado a ${nombreConductorVal} con tarifa de $${tarifa.toLocaleString('es-CO')}/día (${color}).`;
            feedbackSuccess.classList.remove('hidden');
          }

          alert(`¡Motocarro ${placa} color ${color} con tarifa de $${tarifa.toLocaleString('es-CO')}/día y conductor ${nombreConductorVal} guardado exitosamente!`);
          
          navigateTo('flota');
          if (typeof populateDynamicSelects === 'function') populateDynamicSelects();
          if (typeof renderFleetTable === 'function') renderFleetTable();
        } catch (err) {
          console.error('Error al guardar motocarro:', err);
          alert('❌ Ocurrió un error al guardar el motocarro: ' + (err.message || err));
        }
      };

      formMoto.addEventListener('submit', handleMotoSubmit);

      const btnSave = document.getElementById('btn-save-motocarro');
      if (btnSave) {
        btnSave.addEventListener('click', (e) => {
          handleMotoSubmit(e);
        });
      }
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

    const tarifaDriverFilter = document.getElementById('tarifa-filter-driver');
    const tarifaColorFilter = document.getElementById('tarifa-filter-color');
    const tarifaPlateText = document.getElementById('tarifa-loaded-plate-text');
    const tarifaPlateBadge = document.getElementById('tarifa-loaded-plate-badge');
    const tarifaGrid = document.getElementById('tarifa-form-vehicles-grid');

    function updateTarifaVehicleMatch() {
      const dVal = (tarifaDriverFilter?.value || '').trim().toLowerCase();
      const cVal = (tarifaColorFilter?.value || '').trim().toLowerCase();
      const vehs = (MotoData.getVehicles ? MotoData.getVehicles() : []).filter(v => v.status !== 'sold');
      const matched = vehs.filter(v => {
        const okD = !dVal || (v.driver || '').toLowerCase() === dVal;
        const okC = !cVal || (v.color || '').toLowerCase().includes(cVal.replace('ó', 'o')) || (v.color || '').toLowerCase() === cVal;
        return okD && okC;
      });
      if (tarifaPlateText) {
        if (matched.length === 1) {
          tarifaPlateText.textContent = `${matched[0].plate} (${matched[0].color || 'Azul'})`;
        } else if (matched.length > 1 && (dVal || cVal)) {
          tarifaPlateText.textContent = `${matched.map(m => m.plate).join(', ')}`;
        } else if (!dVal && !cVal) {
          tarifaPlateText.textContent = '- Escoja conductor y color -';
        } else {
          tarifaPlateText.textContent = 'Sin coincidencia';
        }
      }
      if (tarifaPlateBadge) {
        tarifaPlateBadge.textContent = matched.length > 0 && (dVal || cVal) ? `${matched.length} und.` : '';
      }
      if (dVal || cVal) {
        const matchedSet = new Set(matched.map(m => m.plate));
        document.querySelectorAll('.tarifa-vehiculo').forEach(cb => {
          cb.checked = matchedSet.has(cb.value);
        });
        updateTarifaCount();
      }
    }

    if (tarifaDriverFilter) tarifaDriverFilter.addEventListener('change', updateTarifaVehicleMatch);
    if (tarifaColorFilter) tarifaColorFilter.addEventListener('change', updateTarifaVehicleMatch);
    if (tarifaGrid) {
      tarifaGrid.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('tarifa-vehiculo')) {
          updateTarifaCount();
        }
      });
    }

    if (valorDiario) valorDiario.addEventListener('input', updateProjection);
    if (valorDominical) valorDominical.addEventListener('input', updateProjection);

    const formTarifa = document.getElementById('tarifa-form') || document.getElementById('form-tarifa');
    if (formTarifa) {
      let isSubmittingTarifa = false;
      const handleTarifaSubmit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isSubmittingTarifa) return;

        const nom = document.getElementById('nombre-tarifa')?.value.trim() || 'Tarifa Personalizada';
        const val = Number(valorDiario?.value || 0);
        if (isNaN(val) || val <= 0) {
          alert('⚠️ Por favor ingresa un valor diario válido mayor a 0 para la tarifa.');
          valorDiario?.focus();
          valorDiario?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        isSubmittingTarifa = true;
        setTimeout(() => { isSubmittingTarifa = false; }, 1000);

        // Actualizar tarifa asignada en los motocarros seleccionados
        const checkedVehs = document.querySelectorAll('#tarifa-form-vehicles-grid input[type="checkbox"]:checked');
        let updatedCount = 0;
        checkedVehs.forEach(cb => {
          const pl = cb.value;
          if (pl && MotoData.updateVehicle) {
            MotoData.updateVehicle(pl, { dailyRate: val });
            updatedCount++;
          }
        });

        alert(`¡Tarifa "${nom}" ($${val.toLocaleString('es-CO')}/día en esquema intercalado) guardada exitosamente!${updatedCount > 0 ? ` Se actualizó la tarifa de ${updatedCount} motocarro(s).` : ''}`);
        navigateTo('tarifas');
      };

      formTarifa.addEventListener('submit', handleTarifaSubmit);
      document.getElementById('btn-save-tarifa')?.addEventListener('click', handleTarifaSubmit);
    }

    updateProjection();

    // Formulario Mantenimiento y Repuestos
    setupVehicleAutoFiller({
      driverSelectId: 'mant-filter-driver',
      colorSelectId: 'mant-filter-color',
      plateSelectId: 'mant-motocarro',
      badgeId: 'mant-auto-badge',
      badgeTextId: 'mant-auto-badge-text'
    });

    // Formulario Mantenimiento y Repuestos (Con Cálculo Dinámico de Intervalos en Días / Km y Repuestos)
    const mantServiceSelect = document.getElementById('mant-service-type');
    const mantFechaInput = document.getElementById('mant-fecha');
    const mantNextDateInput = document.getElementById('mant-next-date');
    const mantNextInfo = document.getElementById('mant-next-info');
    const mantManoObra = document.getElementById('mano-obra');
    const mantPlacaSelect = document.getElementById('mant-motocarro');
    const repuestoEquipoInput = document.getElementById('repuesto-equipo');
    const totalOrdenEl = document.getElementById('total-orden');
    const partsTbodyEl = document.getElementById('parts-tbody');
    let orderParts = [];

    function syncMantEquipo() {
      if (repuestoEquipoInput && mantPlacaSelect) {
        repuestoEquipoInput.value = mantPlacaSelect.value || 'Sin placa';
      }
    }

    function renderOrderParts() {
      const labor = Number(mantManoObra?.value || 0);
      let partsTotal = 0;
      orderParts.forEach(p => { partsTotal += p.qty * p.unitPrice; });
      if (totalOrdenEl) {
        totalOrdenEl.textContent = '$ ' + (labor + partsTotal).toLocaleString('es-CO');
      }
      if (!partsTbodyEl) return;
      partsTbodyEl.innerHTML = '';
      if (orderParts.length === 0) {
        partsTbodyEl.innerHTML = `
          <tr>
            <td colspan="5" class="px-gutter-sm py-4 text-center font-body text-body-sm text-light-outline">
              Ningún repuesto agregado aún. Opcionalmente elige uno arriba y pulsa "Agregar repuesto".
            </td>
          </tr>
        `;
        return;
      }
      orderParts.forEach((p, idx) => {
        const sub = p.qty * p.unitPrice;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-gutter-sm py-2 font-body text-body-sm text-light-on-surface font-medium">${p.partName}</td>
          <td class="px-gutter-sm py-2 font-mono text-mono-md text-light-on-surface-variant">${p.plate || '-'}</td>
          <td class="px-gutter-sm py-2 font-mono text-mono-md text-right tabular-nums">${p.qty}</td>
          <td class="px-gutter-sm py-2 font-mono text-mono-md text-right tabular-nums">$ ${sub.toLocaleString('es-CO')}</td>
          <td class="px-gutter-sm py-2 text-right">
            <button type="button" class="remove-order-part-btn text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" data-idx="${idx}" title="Quitar repuesto">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </td>
        `;
        partsTbodyEl.appendChild(tr);
      });
      partsTbodyEl.querySelectorAll('.remove-order-part-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          orderParts.splice(Number(btn.dataset.idx), 1);
          renderOrderParts();
        });
      });
    }

    ['change', 'input'].forEach(ev => {
      mantPlacaSelect?.addEventListener(ev, syncMantEquipo);
    });
    document.getElementById('mant-filter-driver')?.addEventListener('change', () => setTimeout(syncMantEquipo, 20));
    document.getElementById('mant-filter-color')?.addEventListener('change', () => setTimeout(syncMantEquipo, 20));
    mantManoObra?.addEventListener('input', renderOrderParts);

    document.getElementById('btn-add-order-part')?.addEventListener('click', () => {
      const partKey = document.getElementById('repuesto-select')?.value || '';
      const qty = Math.max(1, Number(document.getElementById('repuesto-cantidad')?.value || 1));
      const plate = mantPlacaSelect?.value || '';
      if (!partKey) {
        alert('Selecciona un repuesto del inventario antes de agregarlo.');
        return;
      }
      const parts = MotoData.getSpareParts ? MotoData.getSpareParts() : [];
      const partObj = parts.find(p => (p.code || p.name) === partKey) || {};
      const alreadyAddedQty = orderParts.filter(op => op.partCode === (partObj.code || partKey)).reduce((s, op) => s + op.qty, 0);
      const avail = Number(partObj.stock ?? 0);
      if (partObj.name && (qty + alreadyAddedQty) > avail) {
        alert(`Stock insuficiente para "${partObj.name}". Disponible: ${avail} und.`);
        return;
      }
      const existingItem = orderParts.find(op => op.partCode === (partObj.code || partKey));
      if (existingItem) {
        existingItem.qty += qty;
      } else {
        orderParts.push({
          partCode: partObj.code || partKey,
          partName: partObj.name || partKey,
          service: partObj.category || 'Repuesto',
          plate: plate || 'General',
          qty: qty,
          unitPrice: Number(partObj.unitPrice ?? partObj.price ?? 0)
        });
      }
      syncMantEquipo();
      renderOrderParts();
    });

    syncMantEquipo();
    renderOrderParts();

    function populateMantServiceOptions() {
      if (!mantServiceSelect) return;
      const types = MotoData.getMaintenanceTypes ? MotoData.getMaintenanceTypes() : [];
      const currentVal = mantServiceSelect.value;
      mantServiceSelect.innerHTML = '';

      types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        const isDays = (t.controlType || 'dias') === 'dias';
        const freqText = isDays ? `Cada ${t.frequencyDays || 30} días` : `Cada ${t.frequencyKm || 3000} km`;
        opt.textContent = `${t.name} (${freqText} - ${t.classification})`;
        opt.dataset.days = t.frequencyDays || 30;
        opt.dataset.km = t.frequencyKm || 3000;
        opt.dataset.control = t.controlType || 'dias';
        opt.dataset.labor = t.estLabor || 0;
        opt.dataset.name = t.name;
        opt.dataset.class = t.classification || 'Preventivo';
        mantServiceSelect.appendChild(opt);
      });

      if (currentVal && Array.from(mantServiceSelect.options).some(o => o.value === currentVal)) {
        mantServiceSelect.value = currentVal;
      }
      calcNextMaintenanceDate();
    }

    function calcNextMaintenanceDate() {
      if (!mantServiceSelect || !mantNextDateInput) return;
      const opt = mantServiceSelect.options[mantServiceSelect.selectedIndex];
      if (!opt) return;

      const days = Number(opt.dataset.days || 30);
      const control = opt.dataset.control || 'dias';
      const labor = Number(opt.dataset.labor || 0);

      if (mantManoObra && (!mantManoObra.value || mantManoObra.value == '0') && labor > 0) {
        mantManoObra.value = labor;
      }

      const execDateStr = mantFechaInput?.value || new Date().toISOString().split('T')[0];
      const execDate = new Date(execDateStr + 'T12:00:00');
      execDate.setDate(execDate.getDate() + days);

      const nextIso = execDate.toISOString().split('T')[0];
      mantNextDateInput.value = nextIso;

      if (mantNextInfo) {
        if (control === 'dias') {
          mantNextInfo.textContent = `Ciclo por días: ${days} días. Próximo vencimiento calculado: ${nextIso}`;
        } else {
          mantNextInfo.textContent = `Ciclo por odómetro: cada ${opt.dataset.km || 3000} km (Aprox. ${days} días: ${nextIso})`;
        }
      }
    }

    if (mantFechaInput) {
      if (!mantFechaInput.value) {
        mantFechaInput.value = new Date().toISOString().split('T')[0];
      }
      mantFechaInput.addEventListener('change', calcNextMaintenanceDate);
    }

    if (mantServiceSelect) {
      mantServiceSelect.addEventListener('change', () => {
        const opt = mantServiceSelect.options[mantServiceSelect.selectedIndex];
        if (opt) {
          const classSelect = document.getElementById('mant-clasificacion');
          if (classSelect && opt.dataset.class) {
            classSelect.value = opt.dataset.class;
          }
        }
        calcNextMaintenanceDate();
      });
    }

    populateMantServiceOptions();
    window.addEventListener('motocontrol-data-updated', populateMantServiceOptions);

    const formMantenimiento = document.getElementById('mant-form') || document.getElementById('form-mantenimiento');
    if (formMantenimiento) {
      let isSubmittingMant = false;
      const handleMantSubmit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isSubmittingMant) return;

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const activeVehicles = vehicles.filter(v => v.status !== 'sold');

        if (activeVehicles.length === 0) {
          alert('⚠️ Primero debes registrar al menos un motocarro en la flota para programar mantenimientos.');
          navigateTo('form-motocarro');
          return;
        }

        const placaSelect = document.getElementById('mant-motocarro') || document.getElementById('maint-motocarro');
        let placa = (placaSelect?.value || '').trim().toUpperCase();
        if (!placa && activeVehicles.length > 0) {
          placa = activeVehicles[0].plate;
          if (placaSelect) placaSelect.value = placa;
        }

        if (!placa) {
          alert('⚠️ Por favor selecciona la placa del motocarro.');
          placaSelect?.focus();
          placaSelect?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const fechaInput = mantFechaInput;
        const fecha = (fechaInput?.value || '').trim() || new Date().toISOString().split('T')[0];
        if (fechaInput && !fechaInput.value) fechaInput.value = fecha;

        const opt = mantServiceSelect?.options[mantServiceSelect.selectedIndex];
        const serviceName = opt?.dataset.name || opt?.text || 'Mantenimiento Preventivo';
        const tipo = (document.getElementById('mant-clasificacion') || document.getElementById('tipo-mantenimiento'))?.value || (opt?.dataset.class || 'Preventivo');
        const costoInput = (document.getElementById('mano-obra') || document.getElementById('costo-estimado'));
        const laborCost = Number(costoInput?.value || 0);
        const partsTotal = orderParts.reduce((s, p) => s + (p.qty * p.unitPrice), 0);
        const totalCost = laborCost + partsTotal;
        const descInput = document.getElementById('proximo-preventivo') || document.getElementById('descripcion-trabajo');
        const desc = descInput?.value.trim() || serviceName;
        const cuenta = document.getElementById('cuenta-pago')?.value || '';
        const nextDate = mantNextDateInput?.value || '';
        const km = Number(document.getElementById('mant-km')?.value || 0);
        const partsSummary = orderParts.length > 0
          ? orderParts.map(p => `${p.partName} (x${p.qty})`).join(', ')
          : 'Sin repuestos adicionales';

        isSubmittingMant = true;
        setTimeout(() => { isSubmittingMant = false; }, 1000);

        const v = vehicles.find(veh => veh.plate === placa) || {};

        try {
          orderParts.forEach(p => {
            if (MotoData.addPartUsage) {
              MotoData.addPartUsage({
                plate: placa,
                partCode: p.partCode,
                partName: p.partName,
                service: serviceName,
                qty: p.qty,
                unitPrice: p.unitPrice,
                date: fecha
              });
            }
          });

          MotoData.addMaintenanceOrder({
            plate: placa,
            driver: v.driver || 'Conductor asignado',
            type: tipo,
            serviceName: serviceName,
            partsUsed: partsSummary,
            desc: desc,
            cost: totalCost,
            date: fecha,
            nextDate: nextDate,
            km: km,
            status: 'scheduled'
          });

          if (totalCost > 0 && cuenta) {
            MotoData.addTransaction({
              type: 'expense',
              account: cuenta,
              plate: placa,
              category: 'Mantenimiento',
              concept: `${tipo}: ${serviceName} - ${placa}`,
              amount: totalCost,
              date: fecha
            });
          }

          orderParts = [];
          renderOrderParts();
          alert(`¡Orden de mantenimiento para ${placa} (${serviceName}) guardada exitosamente!`);
          navigateTo('mantenimientos');
          if (typeof renderMaintenanceTable === 'function') renderMaintenanceTable();
        } catch (err) {
          console.error('Error al guardar mantenimiento:', err);
          alert('❌ Error al guardar orden de mantenimiento: ' + (err.message || err));
        }
      };

      formMantenimiento.addEventListener('submit', handleMantSubmit);
      document.getElementById('btn-save-mant')?.addEventListener('click', handleMantSubmit);
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
      let isSubmittingDoc = false;
      const handleDocSubmit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isSubmittingDoc) return;

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const activeVehicles = vehicles.filter(v => v.status !== 'sold');

        if (activeVehicles.length === 0) {
          alert('⚠️ Primero debes registrar al menos un motocarro en la flota para asignarle documentos (SOAT / Tecnomecánica / Impuestos).');
          navigateTo('form-motocarro');
          return;
        }

        const placaSelect = document.getElementById('doc-motocarro');
        let placa = (placaSelect?.value || '').trim().toUpperCase();
        if (!placa && activeVehicles.length > 0) {
          placa = activeVehicles[0].plate;
          if (placaSelect) placaSelect.value = placa;
        }

        if (!placa) {
          alert('⚠️ Por favor selecciona la placa del motocarro.');
          placaSelect?.focus();
          placaSelect?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const tipo = document.getElementById('doc-tipo')?.value || 'SOAT';
        const venceInput = document.getElementById('doc-vencimiento');
        const vence = (venceInput?.value || '').trim();
        if (!vence) {
          alert('⚠️ Por favor ingresa la fecha de vencimiento del documento.');
          venceInput?.focus();
          venceInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const val = Number(document.getElementById('doc-valor')?.value || 0);
        const cuenta = document.getElementById('doc-cuenta')?.value || '';
        const numero = document.getElementById('doc-numero')?.value.trim() || `POL-${Date.now().toString().slice(-6)}`;
        const entidad = document.getElementById('doc-entidad')?.value.trim() || (tipo === 'SOAT' ? 'Aseguradora SOAT' : 'CDA / Tránsito');

        isSubmittingDoc = true;
        setTimeout(() => { isSubmittingDoc = false; }, 1000);

        const v = vehicles.find(veh => veh.plate === placa) || {};

        try {
          let docRes = null;
          if (MotoData.quickUpdateDocumentByPlate) {
            docRes = MotoData.quickUpdateDocumentByPlate(placa, {
              type: tipo,
              expiry: vence,
              number: numero,
              entity: entidad,
              cost: val
            });
          } else {
            docRes = MotoData.addDocument({
              plate: placa,
              driver: v.driver || 'Conductor asignado',
              cedula: v.cedula || '-',
              type: tipo,
              entity: entidad,
              number: numero,
              cost: val,
              expiry: vence
            });
          }
          if (docRes && docRes.success === false) {
            alert('⚠️ ' + docRes.message);
            return;
          }

          if (val > 0 && cuenta) {
            MotoData.addTransaction({
              type: 'expense',
              account: cuenta,
              plate: placa,
              driver: v.driver || 'Conductor asignado',
              category: 'SOAT / Tecnomecánica',
              concept: `Renovación ${tipo} ${placa} (${numero})`,
              amount: val,
              date: MotoData.getTodayLocalISO ? MotoData.getTodayLocalISO() : new Date().toISOString().split('T')[0]
            });
          }

          docForm.reset();
          alert(`¡Documento ${tipo} para el motocarro ${placa} guardado exitosamente con vencimiento ${vence}!`);
          navigateTo('documentacion');
          if (typeof renderDocumentsTable === 'function') renderDocumentsTable();
        } catch (err) {
          console.error('Error al guardar documento:', err);
          alert('❌ Error al guardar el documento: ' + (err.message || err));
        }
      };

      docForm.addEventListener('submit', handleDocSubmit);
      document.getElementById('btn-save-doc')?.addEventListener('click', handleDocSubmit);
    }

    // Formulario Gasto o Movimiento
    setupVehicleAutoFiller({
      driverSelectId: 'mov-filter-driver',
      colorSelectId: 'mov-filter-color',
      plateSelectId: 'mov-motocarro',
      badgeId: 'mov-auto-badge',
      badgeTextId: 'mov-auto-badge-text'
    });

    const cuentaDestinoWrap = document.getElementById('cuenta-destino-wrap');
    const movCategoriaWrap = document.getElementById('mov-categoria-wrap');
    function updateMovTipoUI() {
      const tipoRadio = document.querySelector('input[name="movTipo"]:checked') || document.querySelector('input[name="tipo-movimiento"]:checked');
      const isTransf = tipoRadio ? tipoRadio.value.toLowerCase().includes('transferencia') : false;
      if (cuentaDestinoWrap) {
        cuentaDestinoWrap.classList.toggle('hidden', !isTransf);
        cuentaDestinoWrap.classList.toggle('flex', isTransf);
      }
      if (movCategoriaWrap) {
        movCategoriaWrap.classList.toggle('hidden', isTransf);
        movCategoriaWrap.classList.toggle('flex', !isTransf);
      }
    }
    document.querySelectorAll('input[name="movTipo"], input[name="tipo-movimiento"]').forEach(r => {
      r.addEventListener('change', updateMovTipoUI);
    });
    updateMovTipoUI();

    const formMovimiento = document.getElementById('mov-form') || document.getElementById('form-movimiento');
    if (formMovimiento) {
      let isSubmittingMov = false;
      const handleMovSubmit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isSubmittingMov) return;

        const tipoRadio = document.querySelector('input[name="movTipo"]:checked') || document.querySelector('input[name="tipo-movimiento"]:checked');
        const tipoVal = tipoRadio ? tipoRadio.value.toLowerCase() : 'gasto';
        const esIngreso = tipoVal.includes('ingreso');
        const esTransferencia = tipoVal.includes('transferencia');

        const cuenta = document.getElementById('mov-cuenta')?.value || '';
        const cuentaDestino = document.getElementById('mov-cuenta-destino')?.value || '';
        const categoria = document.getElementById('mov-categoria')?.value || 'Operativo';
        const placa = document.getElementById('mov-motocarro')?.value || (esTransferencia ? 'Entre cuentas' : 'General flota');
        const montoInput = document.getElementById('mov-monto');
        const monto = Number(montoInput?.value || 0);

        if (!cuenta) {
          alert('⚠️ Por favor selecciona o crea una cuenta de dinero primero.');
          return;
        }
        if (esTransferencia && (!cuentaDestino || cuentaDestino === cuenta)) {
          alert('⚠️ Selecciona una cuenta destino distinta a la cuenta origen.');
          return;
        }
        if (isNaN(monto) || monto <= 0) {
          alert('⚠️ Por favor ingresa un monto válido mayor a 0.');
          montoInput?.focus();
          montoInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const concepto = (document.getElementById('mov-descripcion') || document.getElementById('mov-concepto'))?.value.trim() || (esTransferencia ? `Traspaso ${cuenta} → ${cuentaDestino}` : 'Movimiento de caja');
        const fecha = document.getElementById('mov-fecha')?.value || (MotoData.getTodayLocalISO ? MotoData.getTodayLocalISO() : new Date().toISOString().split('T')[0]);

        isSubmittingMov = true;
        setTimeout(() => { isSubmittingMov = false; }, 1000);

        const vehicles = MotoData.getVehicles ? MotoData.getVehicles() : [];
        const v = vehicles.find(veh => veh.plate === placa) || {};

        try {
          if (esTransferencia) {
            const res = MotoData.transferBetweenAccounts({
              fromAccount: cuenta,
              toAccount: cuentaDestino,
              amount: monto,
              plate: placa,
              concept: concepto,
              date: fecha
            });
            if (!res || !res.success) {
              alert('❌ ' + (res?.message || 'No se pudo completar la transferencia.'));
              return;
            }
            alert(`¡Transferencia de $${monto.toLocaleString('es-CO')} de ${cuenta} hacia ${cuentaDestino} registrada sin afectar tus gastos ni ingresos!`);
          } else {
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
            alert(`¡Movimiento de ${esIngreso ? 'ingreso' : 'egreso'} por $${monto.toLocaleString('es-CO')} en ${cuenta} registrado con éxito!`);
          }

          formMovimiento.reset();
          updateMovTipoUI();
          navigateTo('gastos');
          if (typeof renderFinanceContext === 'function') renderFinanceContext();
        } catch (err) {
          console.error('Error al registrar movimiento:', err);
          alert('❌ Error al registrar el movimiento: ' + (err.message || err));
        }
      };

      formMovimiento.addEventListener('submit', handleMovSubmit);
      document.getElementById('btn-save-mov')?.addEventListener('click', handleMovSubmit);
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
    applyRolePermissions();
    window.addEventListener('motocontrol-data-updated', () => setTimeout(applyRolePermissions, 0));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
