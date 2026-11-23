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
  accounts: [
    { id: 'acc-1', name: 'Caja Efectivo', type: 'Efectivo', balance: 0 },
    { id: 'acc-2', name: 'Nequi Flota', type: 'Digital', balance: 0 },
    { id: 'acc-3', name: 'Bancolombia Ahorros', type: 'Bancaria', balance: 0 }
  ],
  spareParts: [],
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

  init() {
    this.loadFromLocal();
    this.checkSavedFirebaseConfig();
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

          if (hasDemoVehicles || hasDemoTx || hasDemoOrders || hasDemoDocs || hasDemoAccounts) {
            containsLegacyDemo = true;
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
        if (!this.data.accounts || this.data.accounts.length === 0) {
          this.data.accounts = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.accounts));
        }
        if (!this.data.spareParts) this.data.spareParts = [];
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

      // Sincronizar inmediatamente y verificar comunicación real con Firestore
      const syncResult = await this.syncWithFirestore();
      if (syncResult && !syncResult.success) {
        this.isFirebaseActive = false;
        return syncResult;
      }

      this.isFirebaseActive = true;
      this.lastFirebaseError = null;
      this.updateConnectionStatus(true);
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
          await docRef.set(this.data);
        }
      } else {
        await docRef.set(this.data);
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
    this.saveToLocal();
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    if (this.isFirebaseActive && this.db) {
      try {
        await this.db.collection('motocontrol_app').doc('fleet_data').set(this.data);
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
    if (!vehicle.color) vehicle.color = 'Azul';
    if (!vehicle.cedula && vehicle.driver !== 'Sin conductor') vehicle.cedula = 'Sin registrar';
    this.data.vehicles.unshift(vehicle);
    this.persist();
  },

  updateVehicle(plate, updateObj) {
    const idx = this.data.vehicles.findIndex(v => v.plate.toUpperCase() === plate.toUpperCase());
    if (idx !== -1) {
      this.data.vehicles[idx] = { ...this.data.vehicles[idx], ...updateObj };
      this.persist();
    }
  },

  // 2. Compra de Nuevo Motocarro (Alta + Egreso Financiero)
  buyVehicle(buyData) {
    const newVehicle = {
      plate: buyData.plate.toUpperCase().trim(),
      color: buyData.color || 'Azul',
      model: buyData.model || 'Bajaj RE 4S',
      driver: buyData.driver || 'Sin conductor',
      cedula: buyData.cedula || '-',
      phone: buyData.phone || '-',
      license: buyData.license || 'A2',
      venceLicencia: 'Vigente',
      status: (buyData.driver && buyData.driver !== 'Sin conductor') ? 'route' : 'idle',
      statusText: (buyData.driver && buyData.driver !== 'Sin conductor') ? 'En ruta' : 'Sin conductor',
      dailyRate: Number(buyData.dailyRate || 45000),
      soatExpiry: buyData.soatExpiry || 'Vigente',
      tecnoExpiry: buyData.tecnoExpiry || 'Vigente',
      km: Number(buyData.km || 0),
      purchasePrice: Number(buyData.price || 0),
      purchaseDate: buyData.date || new Date().toISOString().split('T')[0],
      supplier: buyData.supplier || 'Concesionario'
    };

    this.data.vehicles.unshift(newVehicle);

    // Registrar egreso contable de la compra
    if (buyData.price && Number(buyData.price) > 0) {
      this.addTransaction({
        type: 'expense',
        account: buyData.account || 'Bancolombia Ahorros',
        plate: newVehicle.plate,
        category: 'Compra de vehículo',
        concept: `Compra motocarro nuevo ${newVehicle.plate} (${newVehicle.color})`,
        amount: Number(buyData.price),
        date: buyData.date || new Date().toISOString().split('T')[0]
      });
    } else {
      this.persist();
    }
  },

  // 3. Venta de Motocarro (Baja de Flota + Ingreso Financiero)
  sellVehicle(saleData) {
    const plate = saleData.plate.toUpperCase().trim();
    const idx = this.data.vehicles.findIndex(v => v.plate.toUpperCase() === plate);
    if (idx !== -1) {
      const v = this.data.vehicles[idx];
      v.status = 'sold';
      v.statusText = 'Vendido';
      v.salePrice = Number(saleData.price || 0);
      v.saleDate = saleData.date || new Date().toISOString().split('T')[0];
      v.buyer = saleData.buyer || 'Comprador particular';
      v.driver = 'Desvinculado (Vendido)';
      v.cedula = '-';

      // Registrar ingreso contable de la venta
      if (saleData.price && Number(saleData.price) > 0) {
        this.addTransaction({
          type: 'income',
          account: saleData.account || 'Bancolombia Ahorros',
          plate: plate,
          category: 'Venta de vehículo',
          concept: `Venta motocarro ${plate} a ${v.buyer}`,
          amount: Number(saleData.price),
          date: saleData.date || new Date().toISOString().split('T')[0]
        });
      } else {
        this.persist();
      }
    }
  },

  // 4. Ingreso de Repuestos a Stock
  addSparePart(partData) {
    if (!this.data.spareParts) this.data.spareParts = [];
    const existing = this.data.spareParts.find(p => p.name.toLowerCase() === partData.name.toLowerCase() || (p.code && p.code.toLowerCase() === (partData.code || '').toLowerCase()));
    
    const qty = Number(partData.qty || 1);
    const unitPrice = Number(partData.unitPrice || 0);
    const totalCost = qty * unitPrice;

    if (existing) {
      existing.stock += qty;
      if (unitPrice > 0) existing.unitPrice = unitPrice;
      if (partData.supplier) existing.supplier = partData.supplier;
    } else {
      this.data.spareParts.unshift({
        code: partData.code || ('REP-' + String(this.data.spareParts.length + 1).padStart(3, '0')),
        name: partData.name.trim(),
        category: partData.category || 'Repuestos generales',
        stock: qty,
        minStock: Number(partData.minStock || 2),
        unitPrice: unitPrice,
        supplier: partData.supplier || 'Proveedor local'
      });
    }

    // Registrar egreso contable de la compra de repuestos
    if (totalCost > 0 && partData.account) {
      this.addTransaction({
        type: 'expense',
        account: partData.account,
        category: 'Repuestos',
        concept: `Ingreso stock: ${qty} und. ${partData.name}`,
        amount: totalCost,
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      this.persist();
    }
  },

  // 5. Agregar y Administrar Tipos de Mantenimiento / Servicio
  addMaintenanceType(typeData) {
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
    this.persist();
  },

  updateMaintenanceType(id, updatedData) {
    if (!this.data.maintenanceTypes) return;
    const idx = this.data.maintenanceTypes.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.maintenanceTypes[idx] = {
        ...this.data.maintenanceTypes[idx],
        ...updatedData
      };
      this.persist();
    }
  },

  quickUpdateDocumentByPlate(plate, docData) {
    if (!this.data.documents) this.data.documents = [];
    const cleanPlate = (plate || '').trim().toUpperCase();
    const docType = docData.type || 'SOAT';

    const existing = this.data.documents.find(d => 
      (d.plate || '').toUpperCase() === cleanPlate && 
      (d.type || '').toLowerCase() === (docType || '').toLowerCase()
    );

    if (existing) {
      existing.expiry = docData.expiry;
      if (docData.number) existing.number = docData.number;
      if (docData.entity) existing.entity = docData.entity;
      if (docData.cost) existing.cost = Number(docData.cost);
      existing.status = docData.status || 'valid';
      existing.statusText = docData.statusText || 'Vigente';
      existing.lastUpdated = new Date().toISOString();
    } else {
      const v = this.data.vehicles ? this.data.vehicles.find(veh => (veh.plate || '').toUpperCase() === cleanPlate) : null;
      this.data.documents.unshift({
        id: 'doc-' + Date.now(),
        plate: cleanPlate,
        driver: v ? v.driver : 'Conductor',
        type: docType,
        number: docData.number || 'Certificado Oficial',
        entity: docData.entity || (docType === 'SOAT' ? 'Seguradora RUNT' : (docType === 'Tecnomecánica' ? 'CDA Certificado' : (docType.includes('Gobernación') ? 'Gobernación' : 'Alcaldía / Tránsito'))),
        expiry: docData.expiry,
        cost: Number(docData.cost || 0),
        status: docData.status || 'valid',
        statusText: docData.statusText || 'Vigente',
        lastUpdated: new Date().toISOString()
      });
    }
    this.persist();
    return true;
  },

  getSettings() {
    if (!this.data.settings) {
      this.data.settings = {
        alertEmails: '',
        emailAlertsEnabled: true,
        notifyDaysBefore: [30, 15, 5, 1],
        notifyMaintDaysBefore: [5, 2]
      };
    }
    return this.data.settings;
  },

  saveSettings(newSettings) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.persist();
  },

  addTransaction(tx) {
    if (!tx.id) tx.id = 'tx-' + Date.now();
    this.data.transactions.unshift(tx);
    
    const acct = this.data.accounts.find(a => a.name.toLowerCase() === (tx.account || '').toLowerCase());
    if (acct) {
      if (tx.type === 'income') acct.balance += Number(tx.amount || 0);
      else if (tx.type === 'expense') acct.balance -= Number(tx.amount || 0);
    }
    this.persist();
  },

  addMaintenanceOrder(order) {
    if (!order.id) order.id = 'm-' + Date.now();
    this.data.maintenanceOrders.unshift(order);
    this.persist();
  },

  addDocument(doc) {
    if (!doc.id) doc.id = 'doc-' + Date.now();
    this.data.documents.unshift(doc);
    this.persist();
  },

  getVehicles() {
    return (this.data && this.data.vehicles) ? this.data.vehicles : [];
  },

  getTransactions() {
    return (this.data && this.data.transactions) ? this.data.transactions : [];
  },

  getMaintenanceOrders() {
    return (this.data && this.data.maintenanceOrders) ? this.data.maintenanceOrders : [];
  },

  getDocuments() {
    return (this.data && this.data.documents) ? this.data.documents : [];
  },

  getSpareParts() {
    return (this.data && this.data.spareParts) ? this.data.spareParts : [];
  },

  getMaintenanceTypes() {
    return (this.data && this.data.maintenanceTypes) ? this.data.maintenanceTypes : [];
  },

  async clearAllData() {
    this.data = {
      vehicles: [],
      transactions: [],
      maintenanceOrders: [],
      documents: [],
      accounts: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.accounts)),
      spareParts: [],
      maintenanceTypes: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.maintenanceTypes)),
      settings: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.settings))
    };
    try {
      localStorage.removeItem('motocontrol_data');
      localStorage.setItem('motocontrol_clean_v5', 'true');
    } catch (e) {}
    this.saveToLocal();
    if (this.isFirebaseActive && this.db) {
      try {
        await this.db.collection('motocontrol_app').doc('fleet_data').set(this.data);
      } catch (e) {
        console.error('Error clearing Firestore:', e);
      }
    }
    window.dispatchEvent(new CustomEvent('motocontrol-data-updated'));
    window.dispatchEvent(new CustomEvent('motocontrol-render-dashboard'));
  },

  getAccounts() {
    if (!this.data || !this.data.accounts) {
      this.data.accounts = [];
    }
    return this.data.accounts;
  },

  addAccount(accountData) {
    if (!this.data.accounts) this.data.accounts = [];
    const name = accountData.name.trim();
    const existing = this.data.accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return { success: false, message: 'Ya existe una cuenta con este nombre.' };
    }
    const balance = Number(accountData.balance || 0);
    const newAccount = {
      id: 'acc-' + Date.now(),
      name: name,
      type: accountData.type || 'Bancaria',
      bank: accountData.bank || accountData.name,
      number: accountData.number || 'Sin número',
      balance: balance,
      description: accountData.description || 'Cuenta para operaciones de la flota'
    };
    this.data.accounts.push(newAccount);

    if (balance > 0) {
      this.addTransaction({
        id: 'tx-init-' + Date.now(),
        type: 'income',
        account: name,
        category: 'Apertura de cuenta',
        concept: `Saldo inicial apertura ${name}`,
        amount: balance,
        date: new Date().toISOString().split('T')[0],
        plate: 'General'
      });
    } else {
      this.persist();
    }
    return { success: true, account: newAccount };
  }
};

// --- Gestor de Autenticación de Usuario (Login / Registro / Sesión) ---
window.AuthManager = {
  defaultUsers: [
    { username: 'admin', email: 'admin@motocontrol.com', password: '123456', name: 'Andrés Rojas', role: 'Administrador de Flota' },
    { username: 'operador', email: 'operador@motocontrol.com', password: '123456', name: 'Laura Gómez', role: 'Supervisora de Operaciones' },
    { username: 'tesoreria', email: 'tesoreria@motocontrol.com', password: '123456', name: 'Camilo Serna', role: 'Contador / Tesorería' }
  ],

  getUsers() {
    try {
      const stored = localStorage.getItem('motocontrol_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return this.defaultUsers;
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('motocontrol_auth_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  login(identifier, password) {
    const users = this.getUsers();
    const id = (identifier || '').trim().toLowerCase();
    const pass = (password || '').trim();
    const user = users.find(u =>
      (u.username.toLowerCase() === id || u.email.toLowerCase() === id) &&
      u.password === pass
    );

    if (user) {
      localStorage.setItem('motocontrol_auth_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Credenciales inválidas. Usa correo o usuario y contraseña (ej. admin / 123456).' };
  },

  register(name, identifier, role, password) {
    const users = [...this.getUsers()];
    const id = (identifier || '').trim().toLowerCase();
    const pass = (password || '').trim();
    if (!name || !id || !pass) {
      return { success: false, message: 'Por favor completa todos los campos requeridos.' };
    }
    const isEmail = id.includes('@');
    const existing = users.find(u => u.username.toLowerCase() === id || u.email.toLowerCase() === id);
    if (existing) {
      return { success: false, message: 'Este usuario o correo ya está registrado.' };
    }
    const newUser = {
      name: name.trim(),
      username: isEmail ? id.split('@')[0] : id,
      email: isEmail ? id : `${id}@motocontrol.com`,
      role: role || 'Administrador de Flota',
      password: pass
    };
    users.push(newUser);
    try {
      localStorage.setItem('motocontrol_registered_users', JSON.stringify(users));
      localStorage.setItem('motocontrol_auth_user', JSON.stringify(newUser));
      if (window.MotoData && window.MotoData.clearAllData) {
        window.MotoData.clearAllData();
      }
    } catch (e) {}
    return { success: true, user: newUser };
  },

  logout() {
    try {
      localStorage.removeItem('motocontrol_auth_user');
    } catch (e) {}
  }
};
