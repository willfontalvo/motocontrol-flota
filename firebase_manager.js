/**
 * MotoControl Firebase & Storage Manager
 * Allows working with LocalStorage by default and seamlessly connects
 * to Firebase Firestore / Realtime DB when user provides their Firebase credentials.
 */

// Default Seed Data with Motocarro Colors (Azul / Salmón), Cédulas, Spare Parts & Maintenance Types
const DEFAULT_INITIAL_DATA = {
  vehicles: [],
  transactions: [],
  maintenanceOrders: [],
  documents: [],
  accounts: [],
  spareParts: [],
  partUsages: [],
  auditLogs: [],
  maintenanceTypes: [
    {
      id: 'mt-aceite',
      name: 'Cambio de Aceite de Motor',
      classification: 'Preventivo',
      controlType: 'dias',
      frequencyDays: 30, // Cada 30 días
      frequencyKm: 3000,
      estLabor: 15000,
      desc: 'Cambio de aceite 4T y limpieza de filtro'
    },
    {
      id: 'mt-frenos',
      name: 'Mantenimiento de Frenos',
      classification: 'Preventivo',
      controlType: 'dias',
      frequencyDays: 60, // Cada 60 días
      frequencyKm: 6000,
      estLabor: 25000,
      desc: 'Revisión y graduación de bandas, zapatas y líquido DOT4'
    },
    {
      id: 'mt-general',
      name: 'Revisión Preventiva General',
      classification: 'Preventivo',
      controlType: 'dias',
      frequencyDays: 90, // Cada 90 días (3 meses)
      frequencyKm: 10000,
      estLabor: 40000,
      desc: 'Ajuste general de chasis, tornillería, bujía y carburación'
    },
    {
      id: 'mt-arrastre',
      name: 'Kit de Arrastre y Transmisión',
      classification: 'Preventivo',
      controlType: 'dias',
      frequencyDays: 180, // Cada 180 días (6 meses)
      frequencyKm: 15000,
      estLabor: 35000,
      desc: 'Tensión y lubricación de cadena, piñones y crucetas'
    },
    {
      id: 'mt-llantas',
      name: 'Cambio de Llantas',
      classification: 'Preventivo',
      controlType: 'dias',
      frequencyDays: 365, // Hasta 365 días (1 año)
      frequencyKm: 25000,
      estLabor: 20000,
      desc: 'Reemplazo de llantas por desgaste, alineación y balanceo'
    }
  ],
  settings: {
    alertEmails: '',
    emailAlertsEnabled: true,
    notifyDaysBefore: [30, 15, 5, 1],
    notifyMaintDaysBefore: [5, 2]
  }
};

window.MotoData = {
  db: null,
  isFirebaseActive: false,
  data: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA)),

  init() {
    if (window.AuthManager && typeof window.AuthManager.initSecurity === 'function') {
      window.AuthManager.initSecurity();
    }
    const curUser = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
    if (curUser) {
      this.loadFromLocal();
    } else {
      this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
    this.checkSavedFirebaseConfig();
  },

  getCleanData() {
    if (!this.data || typeof this.data !== 'object' || Array.isArray(this.data)) {
      this.loadFromLocal();
    }
    if (!this.data || typeof this.data !== 'object') {
      this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
    if (!Array.isArray(this.data.vehicles)) this.data.vehicles = [];
    if (!Array.isArray(this.data.transactions)) this.data.transactions = [];
    if (!Array.isArray(this.data.maintenanceOrders)) this.data.maintenanceOrders = [];
    if (!Array.isArray(this.data.documents)) this.data.documents = [];
    if (!Array.isArray(this.data.accounts)) this.data.accounts = [];
    if (!Array.isArray(this.data.spareParts)) this.data.spareParts = [];
    if (!Array.isArray(this.data.partUsages)) this.data.partUsages = [];
    if (!Array.isArray(this.data.auditLogs)) this.data.auditLogs = [];
    if (!Array.isArray(this.data.maintenanceTypes) || this.data.maintenanceTypes.length === 0) {
      this.data.maintenanceTypes = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.maintenanceTypes));
    }
    if (!this.data.settings || typeof this.data.settings !== 'object') {
      this.data.settings = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.settings));
    }
    return this.data;
  },

  getActor() {
    const u = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
    if (!u) return { name: 'Sistema', email: '', roleKey: 'owner', role: 'Sistema' };
    return {
      name: u.name || u.username || u.email || 'Usuario',
      email: u.email || '',
      roleKey: u.roleKey || 'operator',
      role: u.role || 'Usuario'
    };
  },

  canDo(perm) {
    if (!window.AuthManager || typeof window.AuthManager.can !== 'function') return { ok: true };
    const allowed = window.AuthManager.can(perm);
    if (allowed) return { ok: true };
    const msgs = {
      delete: 'Permiso denegado: tu usuario es de Solo Ingreso y no puede eliminar registros.',
      edit: 'Permiso denegado: tu usuario es de Solo Ingreso y no puede editar o modificar datos.',
      manage_users: 'Permiso denegado: solo el Administrador Principal puede gestionar usuarios.',
      reset_db: 'Permiso denegado: solo el Administrador Principal puede restablecer la base de datos.',
      firebase_config: 'Permiso denegado: solo el Administrador Principal puede cambiar la configuración de Firebase.'
    };
    return { ok: false, message: msgs[perm] || 'No tienes permiso para realizar esta acción.' };
  },

  getNowLocalTimestamp() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  },

  logAudit(action, moduleName, detail, skipPersist = false) {
    try {
      const data = this.getCleanData();
      if (!Array.isArray(data.auditLogs)) data.auditLogs = [];
      const actor = this.getActor();
      data.auditLogs.unshift({
        id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: this.getNowLocalTimestamp(),
        userName: actor.name,
        userEmail: actor.email,
        userRole: actor.role,
        roleKey: actor.roleKey,
        action: action,
        module: moduleName,
        detail: detail
      });
      if (data.auditLogs.length > 300) data.auditLogs = data.auditLogs.slice(0, 300);
      if (!skipPersist) this.persist();
    } catch (e) {}
  },

  getAuditLogs() {
    const data = this.getCleanData();
    return data.auditLogs || [];
  },

  async onAuthenticatedLogin(user) {
    this.loadFromLocal();
    if (this.db) {
      await this.syncWithFirestore();
    }
    this.logAudit('Inicio de sesión', 'Seguridad', `Ingresó ${user?.name || user?.email || 'usuario'} (${user?.role || ''})`);
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    window.dispatchEvent(new CustomEvent('motocontrol-render-dashboard'));
  },

  onLogout() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
  },

  loadFromLocal() {
    try {
      const CLEAN_FLAG = 'motocontrol_clean_v5';
      const stored = localStorage.getItem('motocontrol_data');
      const isCleaned = localStorage.getItem(CLEAN_FLAG) === 'true';

      let containsLegacyDemo = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const demoPlates = ['MCT-305', 'MCT-218', 'MCT-402', 'MCT-514', 'MCT-109', 'MCT-611'];
          const hasDemoVehicles = parsed.vehicles && parsed.vehicles.some(v => demoPlates.includes(v.plate));
          const hasDemoTx = parsed.transactions && parsed.transactions.some(t => 
            (t.concept && t.concept.includes('Liquidación')) || 
            (t.concept && t.concept.includes('embrague')) ||
            (t.amount === 540000 || t.amount === 560000)
          );
          const hasDemoOrders = parsed.maintenanceOrders && parsed.maintenanceOrders.some(o => demoPlates.includes(o.plate));
          const hasDemoDocs = parsed.documents && parsed.documents.some(d => demoPlates.includes(d.plate));
          const hasDemoAccounts = parsed.accounts && parsed.accounts.some(a => [5120000, 2480000, 1150000].includes(a.balance));
          // Detectar cuentas default antiguas (IDs acc-1, acc-2, acc-3) que ya no queremos
          const hasOldDefaultAccounts = parsed.accounts && parsed.accounts.some(a =>
            ['acc-1', 'acc-2', 'acc-3'].includes(a.id) &&
            ['Caja Efectivo', 'Nequi Flota', 'Bancolombia Ahorros'].includes(a.name)
          );

          if (hasDemoVehicles || hasDemoTx || hasDemoOrders || hasDemoDocs || hasDemoAccounts) {
            containsLegacyDemo = true;
          }
          // Si solo tiene las cuentas default antiguas pero datos reales de vehículos, no borrar todo —
          // solo limpiar las cuentas default
          if (!containsLegacyDemo && hasOldDefaultAccounts) {
            parsed.accounts = parsed.accounts.filter(a =>
              !(['acc-1', 'acc-2', 'acc-3'].includes(a.id) &&
                ['Caja Efectivo', 'Nequi Flota', 'Bancolombia Ahorros'].includes(a.name))
            );
            localStorage.setItem('motocontrol_data', JSON.stringify(parsed));
          }
        } catch (e) {
          containsLegacyDemo = true;
        }
      }

      // Si nunca se ha purgado o si contiene restos de demostración, forzar estado limpio vacío
      if (!isCleaned || containsLegacyDemo || !stored) {
        console.log('[MotoControl] Base de datos limpia iniciada en blanco.');
        this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
        localStorage.setItem('motocontrol_data', JSON.stringify(this.data));
        localStorage.setItem(CLEAN_FLAG, 'true');
      } else {
        this.data = JSON.parse(stored);
        if (!this.data.vehicles) this.data.vehicles = [];
        if (!this.data.transactions) this.data.transactions = [];
        if (!this.data.maintenanceOrders) this.data.maintenanceOrders = [];
        if (!this.data.documents) this.data.documents = [];
        if (!this.data.accounts) this.data.accounts = [];
        if (!this.data.spareParts) this.data.spareParts = [];
        if (!this.data.partUsages) this.data.partUsages = [];
        if (!this.data.auditLogs) this.data.auditLogs = [];
        if (!this.data.maintenanceTypes || this.data.maintenanceTypes.length === 0) {
          this.data.maintenanceTypes = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.maintenanceTypes));
        }
        if (!this.data.settings) {
          this.data.settings = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.settings));
        }
      }
    } catch (e) {
      this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
  },

  saveToLocal() {
    if (window.AuthManager && !window.AuthManager.getCurrentUser()) return;
    try {
      localStorage.setItem('motocontrol_data', JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving local data:', e);
    }
  },

  checkSavedFirebaseConfig() {
    try {
      const defaultConfig = {
        apiKey: "AIzaSyD2JAuU8IlGMwWC-XniKF-7JKBY1Nm6NiY",
        authDomain: "motocontrol-flota.firebaseapp.com",
        projectId: "motocontrol-flota",
        storageBucket: "motocontrol-flota.firebasestorage.app",
        messagingSenderId: "790738974246",
        appId: "1:790738974246:web:113b64310f1f12af70d8e7"
      };

      let config = defaultConfig;
      const fbConfigStr = localStorage.getItem('motocontrol_firebase_config');
      if (fbConfigStr) {
        try {
          config = JSON.parse(fbConfigStr);
          if (config.authDomain && config.authDomain.endsWith('.cor')) {
            config.authDomain = config.authDomain.replace(/\.cor$/i, '.com');
            localStorage.setItem('motocontrol_firebase_config', JSON.stringify(config));
          }
        } catch (e) {}
      } else {
        localStorage.setItem('motocontrol_firebase_config', JSON.stringify(defaultConfig));
      }

      if (config && config.apiKey && config.projectId) {
        this.initFirebase(config);
      }
    } catch (e) {
      console.warn('Firebase config error:', e);
    }
  },

  async initFirebase(config) {
    if (!window.firebase) {
      console.warn('Firebase SDK not loaded.');
      this.updateConnectionStatus(false, 'SDK de Firebase no cargado en la página');
      return { success: false, error: 'El SDK de Firebase no está disponible en la página' };
    }
    try {
      // Si ya existía una app inicializada, la cerramos limpiamente para recargar credenciales
      if (firebase.apps && firebase.apps.length > 0) {
        await Promise.all(firebase.apps.map(app => app.delete().catch(() => {})));
      }
      firebase.initializeApp(config);
      this.db = firebase.firestore();

      // Habilitar long polling automático para sortear restricciones de red o proxies en Windows
      try {
        this.db.settings({ experimentalAutoDetectLongPolling: true });
      } catch (se) {}

      // Sincronizar seguridad (usuarios/roles) primero siempre
      if (window.AuthManager && typeof window.AuthManager.syncSecurityWithCloud === 'function') {
        await window.AuthManager.syncSecurityWithCloud();
      }

      // Cargar fleet_data SOLO si existe sesión autenticada válida
      const isAuthed = Boolean(window.AuthManager && window.AuthManager.getCurrentUser());
      if (isAuthed) {
        const syncResult = await this.syncWithFirestore();
        if (syncResult && !syncResult.success) {
          this.isFirebaseActive = false;
          return syncResult;
        }
      } else {
        // Comprobar sin exponer fleet_data si ya existe información previa en la nube (anti-toma de control inicial)
        try {
          const snap = await this.db.collection('motocontrol_app').doc('fleet_data').get();
          const d = snap.exists ? snap.data() : null;
          if (window.AuthManager) {
            window.AuthManager.cloudHasExistingData = Boolean(d && ((d.vehicles && d.vehicles.length > 0) || (d.accounts && d.accounts.length > 0)));
          }
        } catch (ce) {}
        this.isFirebaseActive = true;
        this.lastFirebaseError = null;
        this.updateConnectionStatus(true);
        window.dispatchEvent(new CustomEvent('motocontrol-security-ready'));
        return { success: true };
      }

      this.isFirebaseActive = true;
      this.lastFirebaseError = null;
      this.updateConnectionStatus(true);
      window.dispatchEvent(new CustomEvent('motocontrol-security-ready'));
      return { success: true };
    } catch (err) {
      console.error('Firebase initialization error:', err);
      this.isFirebaseActive = false;
      this.lastFirebaseError = err.message;
      this.updateConnectionStatus(false, err.message);
      return { success: false, error: err.message };
    }
  },

  async saveFirebaseConfig(config) {
    try {
      if (!config || !config.apiKey || !config.projectId) {
        return { success: false, error: 'Se requiere al menos API Key y Project ID.' };
      }

      // Auto-corregir errores tipográficos comunes en dominios (ej: .cor en lugar de .com)
      if (config.authDomain && config.authDomain.endsWith('.cor')) {
        config.authDomain = config.authDomain.replace(/\.cor$/i, '.com');
      }
      if (config.storageBucket && !config.storageBucket.includes('.')) {
        config.storageBucket = config.storageBucket + '.firebasestorage.app';
      }

      localStorage.setItem('motocontrol_firebase_config', JSON.stringify(config));
      return await this.initFirebase(config);
    } catch (e) {
      console.error('Error saving firebase config:', e);
      return { success: false, error: e.message };
    }
  },

  clearFirebaseConfig() {
    try {
      localStorage.removeItem('motocontrol_firebase_config');
      this.isFirebaseActive = false;
      this.db = null;
      this.updateConnectionStatus(false);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  updateConnectionStatus(connected, errorMsg = '') {
    const badge = document.getElementById('firebase-status-badge');
    const badgeText = document.getElementById('firebase-status-text');
    const badgeDot = document.getElementById('firebase-status-dot');
    if (!badge || !badgeText || !badgeDot) return;

    if (connected) {
      this.lastFirebaseError = null;
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-container text-on-success-container text-xs font-label cursor-pointer shadow-xs';
      badgeText.textContent = 'Firebase Conectado';
      badgeDot.className = 'w-2 h-2 rounded-full bg-success animate-pulse';
      badge.title = 'Conectado exitosamente a Cloud Firestore';
    } else {
      this.lastFirebaseError = errorMsg || null;
      const isPerm = errorMsg === 'Reglas de Firestore bloqueadas' || 
                     errorMsg.includes('permission') || 
                     errorMsg.includes('Missing or insufficient');

      if (isPerm) {
        badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-container text-on-warning-container text-xs font-label cursor-pointer shadow-xs';
        badgeText.textContent = 'Firestore: Activar Reglas';
        badgeDot.className = 'w-2 h-2 rounded-full bg-warning animate-ping';
        badge.title = 'Reglas de seguridad bloqueadas. Clic para ver cómo habilitarlas.';
      } else {
        badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-light-surface-container-high text-light-on-surface-variant text-xs font-label cursor-pointer hover:bg-light-surface-container-highest transition-colors';
        badgeText.textContent = errorMsg ? 'Error Firebase' : 'Modo Local (Listo para Firebase)';
        badgeDot.className = errorMsg ? 'w-2 h-2 rounded-full bg-light-error' : 'w-2 h-2 rounded-full bg-light-outline';
        badge.title = errorMsg ? `Detalle: ${errorMsg}. Haz clic para ver y corregir.` : 'Haz clic para configurar Firebase';
      }
    }
  },

  async syncWithFirestore() {
    if (!this.db) return { success: false, error: 'Instancia de Firestore no lista' };
    try {
      const docRef = this.db.collection('motocontrol_app').doc('fleet_data');
      const docSnap = await docRef.get();
      const currentData = this.getCleanData();

      if (docSnap.exists) {
        const cloudData = docSnap.data();
        const demoPlates = ['MCT-305', 'MCT-218', 'MCT-402', 'MCT-514'];
        const isCloudDemo = cloudData && cloudData.vehicles && cloudData.vehicles.some(v => demoPlates.includes(v.plate));

        if (!isCloudDemo && cloudData && Array.isArray(cloudData.vehicles)) {
          this.data = cloudData;
          this.saveToLocal();
          window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
        } else if (isCloudDemo) {
          // Si Firestore contiene el dataset antiguo de prueba, sobreescribir con base en blanco
          await docRef.set(currentData);
        }
      } else {
        await docRef.set(currentData);
      }
      this.isFirebaseActive = true;
      this.lastFirebaseError = null;
      this.updateConnectionStatus(true);
      return { success: true };
    } catch (e) {
      console.warn('Firestore sync status:', e);
      this.isFirebaseActive = false;
      let errorMsg = e.message || 'Error al comunicar con Firestore';
      const isPerm = e.code === 'permission-denied' || 
                     (e.message && (e.message.includes('permission') || e.message.includes('Missing or insufficient')));
      if (isPerm) {
        errorMsg = 'Reglas de Firestore bloqueadas (requiere habilitar lectura/escritura)';
      }
      this.lastFirebaseError = errorMsg;
      this.lastFirebaseErrorCode = e.code;
      this.updateConnectionStatus(false, errorMsg);
      return { success: false, error: errorMsg, code: e.code };
    }
  },

  async persist() {
    if (window.AuthManager && !window.AuthManager.getCurrentUser()) return;
    const dataToSave = this.getCleanData();
    this.saveToLocal();
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    if (this.isFirebaseActive && this.db && dataToSave && typeof dataToSave === 'object') {
      try {
        // Sanitizar: eliminar undefined antes de enviar a Firestore
        const clean = JSON.parse(JSON.stringify(dataToSave));
        await this.db.collection('motocontrol_app').doc('fleet_data').set(clean);
      } catch (e) {
        console.error('Error persisting to Firestore:', e);
      }
    }
  },

  findVehicle(query) {
    if (!this.data || !this.data.vehicles) return null;
    return this.data.vehicles.find(v => {
      let match = true;
      if (query.plate && v.plate.toUpperCase() !== query.plate.toUpperCase()) match = false;
      if (query.driver && v.driver.toLowerCase() !== query.driver.toLowerCase()) match = false;
      if (query.color && (v.color || '').toLowerCase() !== query.color.toLowerCase()) match = false;
      return match;
    });
  },

  getDrivers() {
    if (!this.data || !this.data.vehicles) return [];
    const drivers = [];
    this.data.vehicles.forEach(v => {
      if (v.driver && v.driver !== 'Sin conductor' && v.status !== 'sold' && !drivers.includes(v.driver)) {
        drivers.push(v.driver);
      }
    });
    return drivers;
  },

  getDriverDetails(driverName) {
    if (!driverName || driverName === 'Sin conductor' || !this.data?.vehicles) return null;
    const v = this.data.vehicles.find(veh => veh.driver && veh.driver.toLowerCase() === driverName.toLowerCase() && veh.cedula && veh.cedula !== '-');
    if (v) {
      return {
        name: v.driver,
        cedula: v.cedula,
        phone: v.phone || '',
        license: v.license || 'A2',
        venceLicencia: v.venceLicencia || ''
      };
    }
    return null;
  },

  getDriverVehicles(driverName) {
    if (!driverName || driverName === 'Sin conductor' || !this.data?.vehicles) return [];
    return this.data.vehicles.filter(veh => veh.driver && veh.driver.toLowerCase() === driverName.toLowerCase() && veh.status !== 'sold');
  },

  getColors() {
    return ['Azul', 'Salmón'];
  },

  // 1. Alta o Modificación de Vehículo
  addVehicle(vehicle) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    if (!vehicle.color) vehicle.color = 'Azul';
    if (!vehicle.driver || vehicle.driver === 'Sin conductor') {
      vehicle.driver = 'Sin conductor';
      vehicle.status = 'idle';
      vehicle.statusText = 'Sin conductor';
    }
    if (!vehicle.cedula && vehicle.driver !== 'Sin conductor') vehicle.cedula = 'Sin registrar';
    if (!vehicle.ownerName) vehicle.ownerName = vehicle.driver !== 'Sin conductor' ? vehicle.driver : 'Propietario Flota';
    if (!vehicle.ownerCedula) vehicle.ownerCedula = vehicle.cedula && vehicle.cedula !== 'Sin registrar' ? vehicle.cedula : '';
    if (!vehicle.chassis) vehicle.chassis = '-';
    vehicle.createdBy = actor.name;
    vehicle.createdByRole = actor.role;
    vehicle.createdAt = this.getNowLocalTimestamp();
    data.vehicles.unshift(vehicle);
    this.logAudit('Creación', 'Flota', `Registró motocarro ${vehicle.plate} (${vehicle.color}) · Conductor: ${vehicle.driver}`, true);
    this.persist();
    return { success: true };
  },

  updateVehicle(plate, updateObj) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const idx = data.vehicles.findIndex(v => v.plate.toUpperCase() === plate.toUpperCase());
    if (idx !== -1) {
      const actor = this.getActor();
      data.vehicles[idx] = {
        ...data.vehicles[idx],
        ...updateObj,
        updatedBy: actor.name,
        updatedAt: this.getNowLocalTimestamp()
      };
      this.logAudit('Edición', 'Flota', `Actualizó ficha del motocarro ${plate.toUpperCase()}`, true);
      this.persist();
      return { success: true };
    }
    return { success: false, message: 'Motocarro no encontrado.' };
  },

  // 2. Compra de Nuevo Motocarro (Alta + Egreso Financiero)
  buyVehicle(buyData) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    const driverName = (buyData.driver || '').trim() || 'Sin conductor';
    const hasDriver = driverName !== 'Sin conductor';
    const cedulaVal = hasDriver ? ((buyData.cedula || '').trim() || '-') : '-';
    const newVehicle = {
      plate: buyData.plate.toUpperCase().trim(),
      color: buyData.color || 'Azul',
      model: buyData.model || 'Bajaj RE 4S',
      chassis: buyData.chassis || '-',
      ownerName: buyData.ownerName || (hasDriver ? driverName : 'Propietario Flota'),
      ownerCedula: buyData.ownerCedula || (cedulaVal !== '-' ? cedulaVal : ''),
      driver: driverName,
      cedula: cedulaVal,
      phone: hasDriver ? ((buyData.phone || '').trim() || '-') : '-',
      license: buyData.license || 'A2',
      venceLicencia: 'Vigente',
      status: hasDriver ? 'route' : 'idle',
      statusText: hasDriver ? 'En ruta' : 'Sin conductor',
      dailyRate: Number(buyData.dailyRate || 45000),
      soatExpiry: buyData.soatExpiry || 'Vigente',
      tecnoExpiry: buyData.tecnoExpiry || 'Vigente',
      km: Number(buyData.km || 0),
      purchasePrice: Number(buyData.price || 0),
      purchaseDate: buyData.date || this.getTodayLocalISO(),
      supplier: buyData.supplier || 'Concesionario',
      createdBy: actor.name,
      createdAt: this.getNowLocalTimestamp()
    };

    data.vehicles.unshift(newVehicle);
    this.logAudit('Creación', 'Flota', `Compró motocarro ${newVehicle.plate} (${newVehicle.color}) por $${Number(buyData.price || 0).toLocaleString('es-CO')}`, true);

    // Registrar egreso contable de la compra solo si se indicó cuenta válida
    if (buyData.price && Number(buyData.price) > 0 && buyData.account) {
      this.addTransaction({
        type: 'expense',
        account: buyData.account,
        plate: newVehicle.plate,
        driver: newVehicle.driver,
        category: 'Compra de vehículo',
        concept: `Compra motocarro nuevo ${newVehicle.plate} (${newVehicle.color})`,
        amount: Number(buyData.price),
        date: buyData.date || this.getTodayLocalISO(),
        skipAudit: true
      });
    } else {
      this.persist();
    }
    return { success: true };
  },

  // 3. Venta de Motocarro (Baja de Flota + Ingreso Financiero)
  sellVehicle(saleData) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const plate = saleData.plate.toUpperCase().trim();
    const idx = data.vehicles.findIndex(v => v.plate.toUpperCase() === plate);
    if (idx !== -1) {
      const v = data.vehicles[idx];
      v.status = 'sold';
      v.statusText = 'Vendido';
      v.salePrice = Number(saleData.price || 0);
      v.saleDate = saleData.date || this.getTodayLocalISO();
      v.buyer = saleData.buyer || 'Comprador particular';
      v.driver = 'Desvinculado (Vendido)';
      v.cedula = '-';
      this.logAudit('Edición', 'Flota', `Vendió motocarro ${plate} a ${v.buyer} por $${v.salePrice.toLocaleString('es-CO')}`, true);

      // Registrar ingreso contable de la venta solo si se indicó cuenta válida
      if (saleData.price && Number(saleData.price) > 0 && saleData.account) {
        this.addTransaction({
          type: 'income',
          account: saleData.account,
          plate: plate,
          category: 'Venta de vehículo',
          concept: `Venta motocarro ${plate} a ${v.buyer}`,
          amount: Number(saleData.price),
          date: saleData.date || this.getTodayLocalISO(),
          skipAudit: true
        });
      } else {
        this.persist();
      }
      return { success: true };
    }
    return { success: false, message: 'Motocarro no encontrado.' };
  },

  // 4. Ingreso de Repuestos a Stock
  addSparePart(partData) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    if (!this.data.spareParts) this.data.spareParts = [];
    const name = (partData.name || '').trim();
    const code = (partData.code || '').trim();
    const existing = this.data.spareParts.find(p => 
      (name && p.name && p.name.toLowerCase() === name.toLowerCase()) || 
      (code && p.code && p.code.toLowerCase() === code.toLowerCase())
    );
    
    const qty = Number(partData.qty !== undefined ? partData.qty : (partData.stock !== undefined ? partData.stock : 1));
    const unitPrice = Number(partData.unitPrice !== undefined ? partData.unitPrice : (partData.price !== undefined ? partData.price : 0));
    const minStock = Number(partData.minStock !== undefined ? partData.minStock : (partData.min !== undefined ? partData.min : 2));
    const totalCost = qty * unitPrice;
    const isInitial = Boolean(partData.isInitial);

    if (existing) {
      const editChk = this.canDo('edit');
      if (!editChk.ok) return { success: false, message: editChk.message };
      existing.stock = (existing.stock || 0) + qty;
      if (unitPrice > 0) existing.unitPrice = unitPrice;
      if (partData.supplier) existing.supplier = partData.supplier;
      if (minStock > 0) existing.minStock = minStock;
    } else {
      const actor = this.getActor();
      this.data.spareParts.unshift({
        code: code || ('REP-' + String(this.data.spareParts.length + 1).padStart(3, '0')),
        name: name,
        category: partData.category || 'Repuestos generales',
        stock: qty,
        minStock: minStock,
        unitPrice: unitPrice,
        supplier: partData.supplier || (isInitial ? 'Inventario Inicial' : 'Proveedor local'),
        isInitial: isInitial,
        createdBy: actor.name,
        createdAt: this.getNowLocalTimestamp()
      });
    }

    this.logAudit('Creación', 'Inventario', `Ingresó repuesto ${name} (+${qty} und.)`, true);

    // Registrar egreso contable solo si NO es inventario inicial y se especificó una cuenta
    if (!isInitial && totalCost > 0 && partData.account && partData.account !== 'none' && partData.account !== '') {
      this.addTransaction({
        type: 'expense',
        account: partData.account,
        category: 'Repuestos',
        concept: `Compra stock: ${qty} und. ${name}`,
        amount: totalCost,
        date: this.getTodayLocalISO(),
        skipAudit: true
      });
    } else {
      this.persist();
    }
    return { success: true };
  },

  deleteSparePart(codeOrName) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const query = String(codeOrName || '').toLowerCase().trim();
    const target = data.spareParts.find(p => (p.code || '').toLowerCase() === query || (p.name || '').toLowerCase() === query);
    const prevLen = data.spareParts.length;
    data.spareParts = data.spareParts.filter(p => 
      (p.code || '').toLowerCase() !== query && 
      (p.name || '').toLowerCase() !== query
    );
    if (data.spareParts.length === prevLen) return { success: false, message: 'Repuesto no encontrado.' };
    this.logAudit('Eliminación', 'Inventario', `Eliminó repuesto ${target ? target.name : codeOrName}`, true);
    this.persist();
    return { success: true };
  },

  // 5. Agregar y Administrar Tipos de Mantenimiento / Servicio
  addMaintenanceType(typeData) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    if (!this.data.maintenanceTypes) this.data.maintenanceTypes = [];
    const newType = {
      id: 'mt-' + Date.now(),
      name: typeData.name.trim(),
      classification: typeData.classification || 'Preventivo',
      controlType: typeData.controlType || 'dias',
      frequencyDays: Number(typeData.frequencyDays || 30),
      frequencyKm: Number(typeData.frequencyKm || 3000),
      estLabor: Number(typeData.estLabor || 0),
      desc: typeData.desc || ''
    };
    this.data.maintenanceTypes.push(newType);
    this.logAudit('Creación', 'Mantenimientos', `Creó tipo de servicio ${newType.name}`, true);
    this.persist();
    return { success: true };
  },

  updateMaintenanceType(id, updatedData) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    if (!this.data.maintenanceTypes) return;
    const idx = this.data.maintenanceTypes.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.maintenanceTypes[idx] = {
        ...this.data.maintenanceTypes[idx],
        ...updatedData
      };
      this.logAudit('Edición', 'Mantenimientos', `Actualizó frecuencia de ${this.data.maintenanceTypes[idx].name}`, true);
      this.persist();
      return { success: true };
    }
    return { success: false };
  },

  computeDocumentStatus(expiryStr) {
    if (!expiryStr || expiryStr === 'Vigente') {
      return { status: 'valid', statusText: 'Vigente' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryStr + 'T00:00:00');
    if (isNaN(exp.getTime())) {
      return { status: 'valid', statusText: 'Vigente' };
    }
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'expired', statusText: `Vencido (${Math.abs(diffDays)}d)` };
    }
    if (diffDays <= 30) {
      return { status: 'expiring', statusText: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays}d` };
    }
    return { status: 'valid', statusText: 'Vigente' };
  },

  syncVehicleDocExpiry(plate, docType, expiry) {
    if (!this.data?.vehicles || !plate || !expiry) return;
    const cleanPlate = plate.trim().toUpperCase();
    const v = this.data.vehicles.find(veh => (veh.plate || '').toUpperCase() === cleanPlate);
    if (!v) return;
    const t = (docType || '').toLowerCase();
    if (t.includes('soat')) {
      v.soatExpiry = expiry;
    } else if (t.includes('tecno')) {
      v.tecnoExpiry = expiry;
    }
  },

  quickUpdateDocumentByPlate(plate, docData) {
    const data = this.getCleanData();
    const cleanPlate = (plate || '').trim().toUpperCase();
    const docType = docData.type || 'SOAT';
    const computed = this.computeDocumentStatus(docData.expiry);
    const v = data.vehicles.find(veh => (veh.plate || '').toUpperCase() === cleanPlate) || null;

    const existing = data.documents.find(d =>
      (d.plate || '').toUpperCase() === cleanPlate &&
      (d.type || '').toLowerCase() === (docType || '').toLowerCase()
    );

    if (existing) {
      const chk = this.canDo('edit');
      if (!chk.ok) return { success: false, message: chk.message };
      const actor = this.getActor();
      existing.expiry = docData.expiry;
      if (docData.number) existing.number = docData.number;
      if (docData.entity) existing.entity = docData.entity;
      if (docData.cost !== undefined && docData.cost !== null && Number(docData.cost) > 0) {
        existing.cost = Number(docData.cost);
      }
      if (v) {
        existing.driver = v.driver || existing.driver;
        existing.cedula = v.cedula || existing.cedula || '-';
      }
      existing.status = computed.status;
      existing.statusText = computed.statusText;
      existing.updatedBy = actor.name;
      existing.lastUpdated = new Date().toISOString();
      this.logAudit('Edición', 'Documentación', `Actualizó ${docType} de ${cleanPlate} hasta ${docData.expiry}`, true);
    } else {
      const chk = this.canDo('create');
      if (!chk.ok) return { success: false, message: chk.message };
      const actor = this.getActor();
      data.documents.unshift({
        id: 'doc-' + Date.now(),
        plate: cleanPlate,
        driver: v ? v.driver : 'Sin conductor',
        cedula: v ? (v.cedula || '-') : '-',
        type: docType,
        number: docData.number || 'Registro Manual',
        entity: docData.entity || (docType === 'SOAT' ? 'Aseguradora SOAT' : (docType.includes('Tecno') ? 'CDA Certificado' : (docType.includes('Gobern') ? 'Gobernación' : 'Alcaldía / Tránsito'))),
        expiry: docData.expiry,
        cost: Number(docData.cost || 0),
        status: computed.status,
        statusText: computed.statusText,
        createdBy: actor.name,
        createdByRole: actor.role,
        createdAt: this.getNowLocalTimestamp(),
        lastUpdated: new Date().toISOString()
      });
      this.logAudit('Creación', 'Documentación', `Registró ${docType} de ${cleanPlate} (vence ${docData.expiry})`, true);
    }
    this.syncVehicleDocExpiry(cleanPlate, docType, docData.expiry);
    this.persist();
    return { success: true };
  },

  getTodayLocalISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  isTransferTx(tx) {
    return Boolean(tx && (tx.type === 'transfer' || (tx.category || '').toLowerCase() === 'transferencia'));
  },

  getSettings() {
    if (!this.data.settings) {
      this.data.settings = {};
    }
    if (!this.data.settings.workPlan) {
      this.data.settings.workPlan = {
        azulDays: 'even',
        salmonDays: 'odd',
        day31Color: 'salmon'
      };
    }
    if (!this.data.settings.workPlan.day31Color) {
      this.data.settings.workPlan.day31Color = 'salmon';
    }
    if (this.data.settings.alertEmails === undefined) this.data.settings.alertEmails = '';
    if (this.data.settings.emailAlertsEnabled === undefined) this.data.settings.emailAlertsEnabled = true;
    if (!this.data.settings.notifyDaysBefore) this.data.settings.notifyDaysBefore = [30, 15, 5, 1];
    if (!this.data.settings.notifyMaintDaysBefore) this.data.settings.notifyMaintDaysBefore = [5, 2];
    return this.data.settings;
  },

  getVehicleWorkStatus(v, dateStr) {
    const targetDate = dateStr || this.getTodayLocalISO();
    if (!v || v.status === 'sold') {
      return { code: 'sold', label: 'Vendido', paidToday: 0, isWorkingDay: false, expectedRate: 0 };
    }

    const txs = this.data?.transactions || [];
    const plateUpper = (v.plate || '').trim().toUpperCase();
    const paidToday = txs
      .filter(t =>
        t.date === targetDate &&
        t.type === 'income' &&
        !this.isTransferTx(t) &&
        t.category !== 'Apertura de cuenta' &&
        t.category !== 'Venta de vehículo' &&
        (t.plate || '').trim().toUpperCase() === plateUpper
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expectedRate = Number(v.dailyRate || 45000);
    if (paidToday > 0) {
      return { code: 'paid', label: 'Pago', paidToday, isWorkingDay: true, expectedRate };
    }
    if (v.status === 'workshop') {
      return { code: 'workshop', label: 'En taller', paidToday: 0, isWorkingDay: false, expectedRate };
    }
    if (v.status === 'resting') {
      return { code: 'resting', label: 'Descansando', paidToday: 0, isWorkingDay: false, expectedRate };
    }

    const settings = this.getSettings();
    const plan = settings.workPlan || { azulDays: 'even', salmonDays: 'odd', day31Color: 'salmon' };
    const dayNum = Number((targetDate.split('-')[2] || new Date().getDate()));
    const isSalmon = (v.color || '').toLowerCase().includes('salm');
    let isWorkingDay = true;
    if (dayNum === 31) {
      const d31 = plan.day31Color || 'salmon';
      if (d31 === 'all') isWorkingDay = true;
      else if (d31 === 'none') isWorkingDay = false;
      else if (d31 === 'azul') isWorkingDay = !isSalmon;
      else isWorkingDay = isSalmon;
    } else {
      const parity = (dayNum % 2 === 0) ? 'even' : 'odd';
      const rule = isSalmon ? (plan.salmonDays || 'odd') : (plan.azulDays || 'even');
      isWorkingDay = (rule === 'all' || rule === parity);
    }

    if (!isWorkingDay) {
      return { code: 'resting', label: 'Descansando', paidToday: 0, isWorkingDay: false, expectedRate };
    }
    if (!v.driver || v.driver === 'Sin conductor' || v.status === 'idle') {
      return { code: 'idle', label: 'Sin conductor', paidToday: 0, isWorkingDay: true, expectedRate };
    }
    return { code: 'pending', label: 'Pendiente', paidToday: 0, isWorkingDay: true, expectedRate };
  },

  saveSettings(newSettings) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    if (!this.data.settings) this.data.settings = {};
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.logAudit('Edición', 'Configuración', 'Actualizó parámetros operativos / plan de trabajo', true);
    this.persist();
    return { success: true };
  },

  addTransaction(tx) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    if (!tx.id) tx.id = 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const { skipBalanceUpdate, skipAudit, ...cleanTx } = tx;
    cleanTx.createdBy = cleanTx.createdBy || actor.name;
    cleanTx.createdByEmail = cleanTx.createdByEmail || actor.email;
    cleanTx.createdByRole = cleanTx.createdByRole || actor.role;
    cleanTx.createdAt = cleanTx.createdAt || this.getNowLocalTimestamp();
    data.transactions.unshift(cleanTx);

    if (!skipBalanceUpdate) {
      const acct = data.accounts.find(a => a.name.toLowerCase() === (cleanTx.account || '').toLowerCase());
      if (acct) {
        if (cleanTx.type === 'income') acct.balance = Number(acct.balance || 0) + Number(cleanTx.amount || 0);
        else if (cleanTx.type === 'expense') acct.balance = Number(acct.balance || 0) - Number(cleanTx.amount || 0);
      }
    }
    if (!skipAudit) {
      const tipoTxt = cleanTx.type === 'income' ? 'Ingreso' : 'Egreso';
      this.logAudit('Creación', cleanTx.type === 'income' ? 'Tarifas / Caja' : 'Gastos y Cuentas', `${tipoTxt}: ${cleanTx.concept || cleanTx.category} ($${Number(cleanTx.amount || 0).toLocaleString('es-CO')}) en ${cleanTx.account || '-'}`, true);
    }
    this.persist();
    return { success: true };
  },

  transferBetweenAccounts({ fromAccount, toAccount, amount, plate, concept, date }) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    const amt = Number(amount || 0);
    if (!fromAccount || !toAccount || fromAccount === toAccount || amt <= 0) {
      return { success: false, message: 'Datos de transferencia inválidos.' };
    }
    const fromAcc = data.accounts.find(a => a.name.toLowerCase() === fromAccount.toLowerCase());
    const toAcc = data.accounts.find(a => a.name.toLowerCase() === toAccount.toLowerCase());
    if (!fromAcc || !toAcc) {
      return { success: false, message: 'No se encontró la cuenta origen o destino.' };
    }

    fromAcc.balance = Number(fromAcc.balance || 0) - amt;
    toAcc.balance = Number(toAcc.balance || 0) + amt;

    const record = {
      id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'transfer',
      category: 'Transferencia',
      account: `${fromAcc.name} → ${toAcc.name}`,
      fromAccount: fromAcc.name,
      toAccount: toAcc.name,
      plate: plate || 'Entre cuentas',
      driver: '',
      concept: concept || `Transferencia ${fromAcc.name} → ${toAcc.name}`,
      amount: amt,
      date: date || this.getTodayLocalISO(),
      createdBy: actor.name,
      createdByEmail: actor.email,
      createdByRole: actor.role,
      createdAt: this.getNowLocalTimestamp()
    };
    data.transactions.unshift(record);
    this.logAudit('Transferencia', 'Gastos y Cuentas', `Traspasó $${amt.toLocaleString('es-CO')} de ${fromAcc.name} a ${toAcc.name}`, true);
    this.persist();
    return { success: true, record };
  },

  deleteTransaction(id) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const idx = data.transactions.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, message: 'Movimiento no encontrado.' };
    const tx = data.transactions[idx];
    const amt = Number(tx.amount || 0);
    if (tx.type === 'transfer' && tx.fromAccount && tx.toAccount) {
      const fromAcc = data.accounts.find(a => a.name.toLowerCase() === tx.fromAccount.toLowerCase());
      const toAcc = data.accounts.find(a => a.name.toLowerCase() === tx.toAccount.toLowerCase());
      if (fromAcc) fromAcc.balance = Number(fromAcc.balance || 0) + amt;
      if (toAcc) toAcc.balance = Number(toAcc.balance || 0) - amt;
    } else if (tx.category !== 'Apertura de cuenta') {
      const acct = data.accounts.find(a => a.name.toLowerCase() === (tx.account || '').toLowerCase());
      if (acct) {
        if (tx.type === 'income') acct.balance = Number(acct.balance || 0) - amt;
        else if (tx.type === 'expense') acct.balance = Number(acct.balance || 0) + amt;
      }
    }
    data.transactions.splice(idx, 1);
    this.logAudit('Eliminación', 'Gastos y Cuentas', `Eliminó movimiento "${tx.concept}" ($${amt.toLocaleString('es-CO')})`, true);
    this.persist();
    return { success: true };
  },

  addMaintenanceOrder(order) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    if (!order.id) order.id = 'm-' + Date.now();
    order.createdBy = actor.name;
    order.createdByRole = actor.role;
    order.createdAt = this.getNowLocalTimestamp();
    data.maintenanceOrders.unshift(order);
    this.logAudit('Creación', 'Mantenimientos', `Registró orden ${order.type || 'Preventivo'} para ${order.plate}: ${order.desc || ''}`, true);
    this.persist();
    return { success: true };
  },

  completeMaintenanceOrder(id) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const order = data.maintenanceOrders.find(o => o.id === id);
    if (!order) return { success: false };
    order.status = order.status === 'done' ? 'scheduled' : 'done';
    this.logAudit('Edición', 'Mantenimientos', `Marcó orden de ${order.plate} como ${order.status === 'done' ? 'Terminada' : 'En taller'}`, true);
    this.persist();
    return { success: true, status: order.status };
  },

  deleteMaintenanceOrder(id) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const order = data.maintenanceOrders.find(o => o.id === id);
    const prevLen = data.maintenanceOrders.length;
    data.maintenanceOrders = data.maintenanceOrders.filter(o => o.id !== id);
    if (data.maintenanceOrders.length === prevLen) return { success: false };
    this.logAudit('Eliminación', 'Mantenimientos', `Eliminó orden de mantenimiento ${order ? order.plate : id}`, true);
    this.persist();
    return { success: true };
  },

  addDocument(doc) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    if (!doc.id) doc.id = 'doc-' + Date.now();
    const computed = this.computeDocumentStatus(doc.expiry);
    doc.status = computed.status;
    doc.statusText = computed.statusText;
    doc.createdBy = actor.name;
    doc.createdByRole = actor.role;
    doc.createdAt = this.getNowLocalTimestamp();
    data.documents.unshift(doc);
    this.syncVehicleDocExpiry(doc.plate, doc.type, doc.expiry);
    this.logAudit('Creación', 'Documentación', `Registró ${doc.type} para ${doc.plate}`, true);
    this.persist();
    return { success: true };
  },

  deleteDocument(id) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const doc = data.documents.find(d => d.id === id);
    const prevLen = data.documents.length;
    data.documents = data.documents.filter(d => d.id !== id);
    if (data.documents.length === prevLen) return { success: false };
    this.logAudit('Eliminación', 'Documentación', `Eliminó documento ${doc ? doc.type + ' ' + doc.plate : id}`, true);
    this.persist();
    return { success: true };
  },

  getPartUsages() {
    const data = this.getCleanData();
    return data.partUsages || [];
  },

  addPartUsage(usageData) {
    const chk = this.canDo('create');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const actor = this.getActor();
    if (!Array.isArray(data.partUsages)) data.partUsages = [];
    const qty = Math.max(1, Number(usageData.qty || 1));
    let unitPrice = Number(usageData.unitPrice || 0);
    let partName = usageData.partName || '';
    let service = usageData.service || 'Mantenimiento';

    // Descontar del inventario real si existe en spareParts
    const part = data.spareParts.find(p =>
      (usageData.partCode && p.code === usageData.partCode) ||
      (partName && (p.name || '').toLowerCase() === partName.toLowerCase())
    );
    if (part) {
      part.stock = Math.max(0, Number(part.stock || 0) - qty);
      if (!unitPrice) unitPrice = Number(part.unitPrice ?? part.price ?? 0);
      partName = part.name;
      if (!usageData.service && part.category) service = part.category;
    }

    const total = qty * unitPrice;
    const record = {
      id: 'use-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      plate: (usageData.plate || '').toUpperCase(),
      partCode: part ? part.code : (usageData.partCode || '-'),
      partName: partName,
      service: service,
      qty: qty,
      unitPrice: unitPrice,
      total: total,
      date: usageData.date || this.getTodayLocalISO(),
      createdBy: actor.name,
      createdAt: this.getNowLocalTimestamp()
    };
    data.partUsages.unshift(record);
    this.logAudit('Creación', 'Inventario', `Descontó ${qty} und. de ${partName} para ${record.plate}`, true);
    this.persist();
    return { success: true, record };
  },

  getVehicles() {
    const data = this.getCleanData();
    return data.vehicles || [];
  },

  getTransactions() {
    const data = this.getCleanData();
    return data.transactions || [];
  },

  getMaintenanceOrders() {
    const data = this.getCleanData();
    return data.maintenanceOrders || [];
  },

  getDocuments() {
    const data = this.getCleanData();
    return data.documents || [];
  },

  getSpareParts() {
    const data = this.getCleanData();
    return data.spareParts || [];
  },

  getMaintenanceTypes() {
    const data = this.getCleanData();
    return data.maintenanceTypes || [];
  },

  async clearAllData() {
    const chk = this.canDo('reset_db');
    if (!chk.ok) return { success: false, message: chk.message };
    this.data = {
      vehicles: [],
      transactions: [],
      maintenanceOrders: [],
      documents: [],
      accounts: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.accounts)),
      spareParts: [],
      partUsages: [],
      auditLogs: [],
      maintenanceTypes: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.maintenanceTypes)),
      settings: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.settings))
    };
    try {
      localStorage.removeItem('motocontrol_data');
      localStorage.setItem('motocontrol_clean_v5', 'true');
    } catch (e) {}
    this.logAudit('Eliminación', 'Seguridad', 'Restableció la base de datos a cero', true);
    this.saveToLocal();
    if (this.isFirebaseActive && this.db) {
      try {
        await this.db.collection('motocontrol_app').doc('fleet_data').set(JSON.parse(JSON.stringify(this.getCleanData())));
      } catch (e) {
        console.error('Error clearing Firestore:', e);
      }
    }
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    window.dispatchEvent(new CustomEvent('motocontrol-render-dashboard'));
    return { success: true };
  },

  getAccounts() {
    if (!this.data || !this.data.accounts) {
      this.data.accounts = [];
    }
    return this.data.accounts;
  },

  addAccount(accountData) {
    const chk = this.canDo('edit');
    if (!chk.ok) return { success: false, message: chk.message };
    if (!this.data.accounts) this.data.accounts = [];
    const name = accountData.name.trim();
    const existing = this.data.accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return { success: false, message: 'Ya existe una cuenta con este nombre.' };
    }
    const actor = this.getActor();
    const balance = Number(accountData.balance || 0);
    const newAccount = {
      id: 'acc-' + Date.now(),
      name: name,
      type: accountData.type || 'Bancaria',
      bank: accountData.bank || accountData.name,
      number: accountData.number || 'Sin número',
      balance: balance,
      description: accountData.description || 'Cuenta para operaciones de la flota',
      createdBy: actor.name,
      createdAt: this.getNowLocalTimestamp()
    };
    this.data.accounts.push(newAccount);
    this.logAudit('Creación', 'Gastos y Cuentas', `Creó cuenta "${name}" con saldo inicial $${balance.toLocaleString('es-CO')}`, true);

    if (balance > 0) {
      // skipBalanceUpdate: true evita sumar el saldo inicial por segunda vez a newAccount.balance
      this.addTransaction({
        id: 'tx-init-' + Date.now(),
        type: 'income',
        account: name,
        category: 'Apertura de cuenta',
        concept: `Saldo inicial apertura ${name}`,
        amount: balance,
        date: this.getTodayLocalISO(),
        plate: 'General',
        skipBalanceUpdate: true,
        skipAudit: true
      });
    } else {
      this.persist();
    }
    return { success: true, account: newAccount };
  },

  deleteAccount(accountName) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const prevLen = data.accounts.length;
    data.accounts = data.accounts.filter(a => a.name.toLowerCase() !== accountName.toLowerCase());
    if (data.accounts.length === prevLen) return { success: false, message: 'Cuenta no encontrada.' };
    this.logAudit('Eliminación', 'Gastos y Cuentas', `Eliminó la cuenta "${accountName}"`, true);
    this.persist();
    return { success: true };
  },

  deleteVehicle(plate) {
    const chk = this.canDo('delete');
    if (!chk.ok) return { success: false, message: chk.message };
    const data = this.getCleanData();
    const prevLen = data.vehicles.length;
    data.vehicles = data.vehicles.filter(v => v.plate.toUpperCase() !== plate.toUpperCase());
    if (data.vehicles.length === prevLen) return { success: false, message: 'Motocarro no encontrado.' };
    this.logAudit('Eliminación', 'Flota', `Eliminó el motocarro ${plate.toUpperCase()}`, true);
    this.persist();
    return { success: true };
  }
};

// --- Utilidad Criptográfica SHA-256 (sin dependencias externas, funciona en HTTPS, localhost y Node) ---
function mcSha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const len = bytes.length;
  const totalLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[len] = 0x80;
  const bitLenHi = Math.floor((len * 8) / 0x100000000);
  const bitLenLo = (len * 8) >>> 0;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, bitLenHi, false);
  view.setUint32(totalLen - 4, bitLenLo, false);

  const w = new Uint32Array(64);
  const rrot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rrot(w[i - 15], 7) ^ rrot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rrot(w[i - 2], 17) ^ rrot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map(x => x.toString(16).padStart(8, '0')).join('');
}

// --- Gestor de Autenticación Segura, Roles por Turno y Cuentas en la Nube ---
window.AuthManager = {
  STORAGE_USERS_KEY: 'motocontrol_security_users',
  STORAGE_SESSION_KEY: 'motocontrol_auth_user',
  STORAGE_LOCK_KEY: 'motocontrol_login_lock',
  LEGACY_USERS_KEY: 'motocontrol_registered_users',
  LEGACY_DEMO_EMAILS: ['admin@motocontrol.com', 'operador@motocontrol.com', 'tesoreria@motocontrol.com'],
  LEGACY_DEMO_USERNAMES: ['admin', 'operador', 'tesoreria'],
  cloudHasExistingData: false,
  ROLE_DEFS: {
    owner: { label: 'Administrador Principal', perms: ['view', 'create', 'edit', 'delete', 'manage_users', 'view_audit', 'reset_db', 'firebase_config'] },
    admin: { label: 'Co-Administrador', perms: ['view', 'create', 'edit', 'delete', 'view_audit'] },
    operator: { label: 'Operador (Solo Ingreso)', perms: ['view', 'create'] }
  },

  generateSalt() {
    const arr = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  },

  hashPassword(plain, salt) {
    return mcSha256Hex(`${salt}:motocontrol:${plain}`);
  },

  verifyPassword(plain, storedHash, salt) {
    if (!plain || !storedHash || !salt) return false;
    const candidate = this.hashPassword(plain, salt);
    if (candidate.length !== storedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < candidate.length; i++) {
      diff |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return diff === 0;
  },

  normalizeRoleKey(roleInput) {
    const r = String(roleInput || '').toLowerCase();
    if (r === 'owner' || r.includes('principal')) return 'owner';
    if (r === 'operator' || r.includes('solo ingreso') || r.includes('operador')) return 'operator';
    return 'admin';
  },

  _isLegacyDemo(u) {
    if (!u) return true;
    const email = (u.email || '').toLowerCase().trim();
    const uname = (u.username || '').toLowerCase().trim();
    return this.LEGACY_DEMO_EMAILS.includes(email) || (this.LEGACY_DEMO_USERNAMES.includes(uname) && (!u.passwordHash && u.password === '123456'));
  },

  getUsers() {
    try {
      const raw = localStorage.getItem(this.STORAGE_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(u => !this._isLegacyDemo(u));
      }
    } catch (e) {}
    return [];
  },

  _saveUsersLocal(users) {
    try {
      localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  },

  async _pushUsersToCloud(users) {
    if (!window.MotoData || !window.MotoData.db) return;
    try {
      const clean = JSON.parse(JSON.stringify({
        users: users,
        setupLocked: users.length > 0,
        updatedAt: new Date().toISOString()
      }));
      await window.MotoData.db.collection('motocontrol_app').doc('security_config').set(clean);
    } catch (e) {
      console.error('Error syncing security_config:', e);
    }
  },

  initSecurity() {
    // 1. Limpiar sesiones demo antiguas inmediatamente
    const sess = this.getCurrentUser();
    if (sess && this._isLegacyDemo(sess)) {
      this._clearSessionStorage();
    }

    // 2. Migrar cuenta real previa (del dueño) guardada sin hash y eliminar cuentas demo
    try {
      const legacyRaw = localStorage.getItem(this.LEGACY_USERS_KEY);
      if (legacyRaw) {
        const legacyList = JSON.parse(legacyRaw);
        if (Array.isArray(legacyList)) {
          const currentSec = this.getUsers();
          const realLegacy = legacyList.filter(u => !this._isLegacyDemo(u) && (u.email || u.username) && u.password);
          let hasOwner = currentSec.some(u => u.roleKey === 'owner');
          realLegacy.forEach((lu, idx) => {
            const email = (lu.email || lu.username || '').toLowerCase().trim();
            if (!email || currentSec.some(cu => cu.email === email || cu.username === email)) return;
            const roleKey = !hasOwner && idx === 0 ? 'owner' : this.normalizeRoleKey(lu.role);
            if (roleKey === 'owner') hasOwner = true;
            const salt = this.generateSalt();
            currentSec.push({
              id: 'usr-' + Date.now() + '-' + idx,
              name: (lu.name || email.split('@')[0]).trim(),
              username: (lu.username || email.split('@')[0]).toLowerCase().trim(),
              email: email,
              roleKey: roleKey,
              role: this.ROLE_DEFS[roleKey].label,
              salt: salt,
              passwordHash: this.hashPassword(String(lu.password), salt),
              active: true,
              createdAt: new Date().toISOString()
            });
          });
          if (currentSec.length > 0) this._saveUsersLocal(currentSec);
        }
        localStorage.removeItem(this.LEGACY_USERS_KEY);
      }
    } catch (e) {}

    // 3. Revalidar sesión actual contra usuarios seguros
    const updatedUsers = this.getUsers();
    const cur = this.getCurrentUser();
    if (cur && updatedUsers.length > 0) {
      const match = updatedUsers.find(u => u.id === cur.id || u.email === (cur.email || '').toLowerCase());
      if (!match || match.active === false) {
        this._clearSessionStorage();
      } else {
        this._persistSessionObject(this._toSafeSession(match), this._isRememberedSession());
      }
    } else if (cur && updatedUsers.length === 0) {
      this._clearSessionStorage();
    }
  },

  async syncSecurityWithCloud() {
    if (!window.MotoData || !window.MotoData.db) return;
    try {
      const docRef = window.MotoData.db.collection('motocontrol_app').doc('security_config');
      const snap = await docRef.get();
      let localUsers = this.getUsers();

      if (snap.exists) {
        const cloud = snap.data() || {};
        const cloudUsers = Array.isArray(cloud.users) ? cloud.users.filter(u => !this._isLegacyDemo(u)) : [];
        if (cloudUsers.length > 0) {
          // Si este navegador tenía una cuenta recién migrada que aún no está en cloud, fusionarla preservando owner de la nube
          const cloudEmails = new Set(cloudUsers.map(u => (u.email || '').toLowerCase()));
          const extraLocal = localUsers.filter(u => !cloudEmails.has((u.email || '').toLowerCase()));
          if (extraLocal.length > 0) {
            const hasCloudOwner = cloudUsers.some(u => u.roleKey === 'owner');
            extraLocal.forEach(eu => {
              if (hasCloudOwner && eu.roleKey === 'owner') {
                eu.roleKey = 'admin';
                eu.role = this.ROLE_DEFS.admin.label;
              }
            });
            const merged = [...cloudUsers, ...extraLocal];
            this._saveUsersLocal(merged);
            await this._pushUsersToCloud(merged);
          } else {
            this._saveUsersLocal(cloudUsers);
          }
        } else if (localUsers.length > 0) {
          await this._pushUsersToCloud(localUsers);
        }
      } else if (localUsers.length > 0) {
        // Primera subida automática del dueño ya migrado
        await this._pushUsersToCloud(localUsers);
      }

      // Revalidar sesión contra lista actualizada
      const finalUsers = this.getUsers();
      const cur = this.getCurrentUser();
      if (cur) {
        const match = finalUsers.find(u => u.id === cur.id || u.email === (cur.email || '').toLowerCase());
        if (!match || match.active === false) {
          this._clearSessionStorage();
        } else {
          this._persistSessionObject(this._toSafeSession(match), this._isRememberedSession());
        }
      }
    } catch (e) {
      console.warn('Error syncing security_config:', e);
    }
  },

  needsInitialSetup() {
    return this.getUsers().length === 0;
  },

  _toSafeSession(u) {
    const rk = this.ROLE_DEFS[u.roleKey] ? u.roleKey : this.normalizeRoleKey(u.role);
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      roleKey: rk,
      role: this.ROLE_DEFS[rk].label,
      active: u.active !== false
    };
  },

  _isRememberedSession() {
    try {
      return Boolean(localStorage.getItem(this.STORAGE_SESSION_KEY));
    } catch (e) {
      return true;
    }
  },

  _persistSessionObject(safeUser, remember = true) {
    try {
      const json = JSON.stringify(safeUser);
      if (remember) {
        localStorage.setItem(this.STORAGE_SESSION_KEY, json);
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.STORAGE_SESSION_KEY);
      } else {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.STORAGE_SESSION_KEY, json);
        localStorage.removeItem(this.STORAGE_SESSION_KEY);
      }
    } catch (e) {}
  },

  _clearSessionStorage() {
    try {
      localStorage.removeItem(this.STORAGE_SESSION_KEY);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.STORAGE_SESSION_KEY);
    } catch (e) {}
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_SESSION_KEY) || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.STORAGE_SESSION_KEY) : null);
      if (!raw) return null;
      const u = JSON.parse(raw);
      if (!u || this._isLegacyDemo(u)) return null;
      return u;
    } catch (e) {
      return null;
    }
  },

  can(perm) {
    const u = this.getCurrentUser();
    if (!u) return false;
    const def = this.ROLE_DEFS[u.roleKey || this.normalizeRoleKey(u.role)] || this.ROLE_DEFS.operator;
    return def.perms.includes(perm);
  },

  _getLockState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_LOCK_KEY);
      return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
    } catch (e) {
      return { attempts: 0, lockedUntil: 0 };
    }
  },

  _setLockState(state) {
    try {
      localStorage.setItem(this.STORAGE_LOCK_KEY, JSON.stringify(state));
    } catch (e) {}
  },

  async login(identifier, password, remember = true) {
    const lock = this._getLockState();
    const now = Date.now();
    if (lock.lockedUntil && now < lock.lockedUntil) {
      const secs = Math.ceil((lock.lockedUntil - now) / 1000);
      return { success: false, message: `Demasiados intentos fallidos. Espera ${secs}s antes de intentar de nuevo.` };
    }

    if (window.MotoData && window.MotoData.db) {
      await this.syncSecurityWithCloud();
    }

    const users = this.getUsers();
    if (users.length === 0) {
      return { success: false, message: 'No hay un Administrador Principal configurado aún. Configura la primera cuenta.' };
    }

    const id = (identifier || '').trim().toLowerCase();
    const pass = (password || '').trim();
    const user = users.find(u => (u.email || '').toLowerCase() === id || (u.username || '').toLowerCase() === id);

    if (!user || !this.verifyPassword(pass, user.passwordHash, user.salt)) {
      const attempts = (lock.attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? (now + 30000) : 0;
      this._setLockState({ attempts: lockedUntil ? 0 : attempts, lockedUntil });
      if (lockedUntil) {
        return { success: false, message: 'Cuenta temporalmente bloqueada 30 segundos por seguridad (5 intentos fallidos).' };
      }
      return { success: false, message: `Correo/usuario o contraseña incorrectos (${attempts}/5).` };
    }

    if (user.active === false) {
      return { success: false, message: 'Este usuario está desactivado. Contacta al Administrador Principal.' };
    }

    this._setLockState({ attempts: 0, lockedUntil: 0 });
    const safeUser = this._toSafeSession(user);
    this._persistSessionObject(safeUser, remember);
    if (window.MotoData && typeof window.MotoData.onAuthenticatedLogin === 'function') {
      await window.MotoData.onAuthenticatedLogin(safeUser);
    }
    return { success: true, user: safeUser };
  },

  async registerInitialOwner({ name, email, password, projectVerify }) {
    if (window.MotoData && window.MotoData.db) {
      await this.syncSecurityWithCloud();
    }
    if (!this.needsInitialSetup()) {
      return { success: false, message: 'Ya existe un Administrador Principal registrado. Por seguridad el registro público está cerrado.' };
    }

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, message: 'Completa nombre completo, correo electrónico y contraseña.' };
    }
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (this.cloudHasExistingData) {
      const expectedPid = (() => {
        try { return JSON.parse(localStorage.getItem('motocontrol_firebase_config') || '{}').projectId || 'motocontrol-flota'; } catch (e) { return 'motocontrol-flota'; }
      })();
      if ((projectVerify || '').trim() !== expectedPid) {
        return { success: false, message: 'Código de verificación de proyecto Firebase incorrecto. No se puede reclamar la base existente sin verificarlo.' };
      }
    }

    const salt = this.generateSalt();
    const ownerUser = {
      id: 'usr-' + Date.now(),
      name: cleanName,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      roleKey: 'owner',
      role: this.ROLE_DEFS.owner.label,
      salt: salt,
      passwordHash: this.hashPassword(cleanPass, salt),
      active: true,
      createdAt: new Date().toISOString()
    };

    const list = [ownerUser];
    this._saveUsersLocal(list);
    await this._pushUsersToCloud(list);
    const safeUser = this._toSafeSession(ownerUser);
    this._persistSessionObject(safeUser, true);
    if (window.MotoData && typeof window.MotoData.onAuthenticatedLogin === 'function') {
      await window.MotoData.onAuthenticatedLogin(safeUser);
    }
    return { success: true, user: safeUser };
  },

  async adminCreateUser({ name, email, roleKey, password }) {
    if (!this.can('manage_users')) {
      return { success: false, message: 'Solo el Administrador Principal puede crear cuentas.' };
    }
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, message: 'Completa nombre, correo y contraseña.' };
    }
    if (!cleanEmail.includes('@')) {
      return { success: false, message: 'Ingresa un correo electrónico válido para el usuario.' };
    }
    if (cleanPass.length < 6) {
      return { success: false, message: 'La contraseña debe tener mínimo 6 caracteres.' };
    }

    const users = this.getUsers();
    if (users.some(u => (u.email || '').toLowerCase() === cleanEmail || (u.username || '').toLowerCase() === cleanEmail.split('@')[0])) {
      return { success: false, message: 'Ya existe un usuario registrado con ese correo.' };
    }

    const rk = roleKey === 'admin' ? 'admin' : 'operator';
    const salt = this.generateSalt();
    const newUser = {
      id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      name: cleanName,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      roleKey: rk,
      role: this.ROLE_DEFS[rk].label,
      salt: salt,
      passwordHash: this.hashPassword(cleanPass, salt),
      active: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this._saveUsersLocal(users);
    await this._pushUsersToCloud(users);
    if (window.MotoData && window.MotoData.logAudit) {
      window.MotoData.logAudit('Creación', 'Seguridad', `Creó usuario ${cleanName} (${newUser.role})`);
    }
    return { success: true, user: this._toSafeSession(newUser) };
  },

  async adminUpdateUser(userId, updates) {
    if (!this.can('manage_users')) {
      return { success: false, message: 'Solo el Administrador Principal puede modificar usuarios.' };
    }
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, message: 'Usuario no encontrado.' };
    if (users[idx].roleKey === 'owner' && (updates.active === false || (updates.roleKey && updates.roleKey !== 'owner'))) {
      return { success: false, message: 'No puedes desactivar ni degradar al Administrador Principal.' };
    }

    if (updates.roleKey && this.ROLE_DEFS[updates.roleKey] && users[idx].roleKey !== 'owner') {
      users[idx].roleKey = updates.roleKey;
      users[idx].role = this.ROLE_DEFS[updates.roleKey].label;
    }
    if (typeof updates.active === 'boolean' && users[idx].roleKey !== 'owner') {
      users[idx].active = updates.active;
    }
    if (updates.newPassword) {
      const np = String(updates.newPassword).trim();
      if (np.length < 6) return { success: false, message: 'La nueva contraseña debe tener mínimo 6 caracteres.' };
      const salt = this.generateSalt();
      users[idx].salt = salt;
      users[idx].passwordHash = this.hashPassword(np, salt);
    }

    this._saveUsersLocal(users);
    await this._pushUsersToCloud(users);
    if (window.MotoData && window.MotoData.logAudit) {
      window.MotoData.logAudit('Edición', 'Seguridad', `Actualizó permisos/estado de ${users[idx].name}`);
    }
    return { success: true };
  },

  async adminDeleteUser(userId) {
    if (!this.can('manage_users')) {
      return { success: false, message: 'Solo el Administrador Principal puede eliminar usuarios.' };
    }
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'Usuario no encontrado.' };
    if (target.roleKey === 'owner') {
      return { success: false, message: 'No se puede eliminar al Administrador Principal.' };
    }
    const filtered = users.filter(u => u.id !== userId);
    this._saveUsersLocal(filtered);
    await this._pushUsersToCloud(filtered);
    if (window.MotoData && window.MotoData.logAudit) {
      window.MotoData.logAudit('Eliminación', 'Seguridad', `Eliminó usuario ${target.name} (${target.email})`);
    }
    return { success: true };
  },

  async changeOwnPassword(currentPassword, newPassword) {
    const cur = this.getCurrentUser();
    if (!cur) return { success: false, message: 'Sesión no iniciada.' };
    const np = String(newPassword || '').trim();
    if (np.length < 6) return { success: false, message: 'La nueva contraseña debe tener mínimo 6 caracteres.' };
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === cur.id || u.email === cur.email);
    if (idx === -1) return { success: false, message: 'Usuario no encontrado.' };
    if (!this.verifyPassword(String(currentPassword || '').trim(), users[idx].passwordHash, users[idx].salt)) {
      return { success: false, message: 'La contraseña actual ingresada es incorrecta.' };
    }
    const salt = this.generateSalt();
    users[idx].salt = salt;
    users[idx].passwordHash = this.hashPassword(np, salt);
    this._saveUsersLocal(users);
    await this._pushUsersToCloud(users);
    if (window.MotoData && window.MotoData.logAudit) {
      window.MotoData.logAudit('Edición', 'Seguridad', `Cambió su contraseña (${cur.name})`);
    }
    return { success: true };
  },

  logout() {
    const cur = this.getCurrentUser();
    if (cur && window.MotoData && typeof window.MotoData.logAudit === 'function') {
      window.MotoData.logAudit('Cierre de sesión', 'Seguridad', `Cerró sesión ${cur.name}`);
    }
    this._clearSessionStorage();
    if (window.MotoData && typeof window.MotoData.onLogout === 'function') {
      window.MotoData.onLogout();
    }
  }
};

// Auto-inicializar MotoData inmediatamente al cargar el script para garantizar que this.data siempre exista
try {
  if (window.MotoData && typeof window.MotoData.init === 'function') {
    window.MotoData.init();
  }
} catch (e) {}
