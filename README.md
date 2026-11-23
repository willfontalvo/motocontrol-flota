# 🛺 MotoControl — Sistema de Gestión de Flota de Motocarros

Sistema web profesional para la gestión operativa, documental y financiera de flotas de motocarros (Toritos / Bajaj RE 4S / TVS King). Diseñado respetando el sistema de diseño visual de Stitch con paleta Teal `#005C55`, soporte para modo local (LocalStorage) y sincronización en la nube con **Google Firebase Firestore**.

---

## 🌟 Características Principales

* 📊 **Dashboard Ejecutivo:**
  * Indicadores en tiempo real: Ingresos del periodo, Gastos operativos y Balance neto.
  * Filtros dinámicos por **Cuenta Bancaria** (Bancolombia, Nequi, Caja) y por **Conductor**.
  * Alertas de vencimiento documental y agenda de mantenimiento.
* 🛵 **Gestión de Flota y Conductores:**
  * Registro de motocarros por placa y color distintivo (**Azul** o **Salmón**).
  * Control de conductores con Cédula de Ciudadanía, Teléfono / WhatsApp y Licencia de Conducción.
  * **Soporte para esquema intercalado:** Permite asociar un mismo conductor a dos motocarros (1 día sí y 1 día no).
  * Opciones de **Compra** (alta de unidad e inversión) y **Venta** (baja de unidad e ingreso).
* 💰 **Tarifas y Liquidaciones:**
  * Cálculo de proyección semanal y mensual ajustado al turno intercalado (promedio 3.5 días/semana · 15 turnos/mes).
  * Asignación por unidad o masiva.
* 🔧 **Mantenimientos y Taller:**
  * Control independiente de Preventivos, Correctivos, Cambio de Aceite y Frenos.
  * Búsqueda por placa y trabajo con filtros rápidos por píldoras.
  * Inventario de repuestos en stock con alertas de stock mínimo y costeo unitario.
  * Configuración de nuevos tipos de mantenimiento preventivo y correctivo.
* 📄 **Documentación Legal:**
  * Monitoreo de vigencia de SOAT y Revisión Tecnomecánica CDA.
  * Alertas visuales: Vigente, Próximo a vencer y Vencido.
* 💳 **Control de Gastos y Cuentas:**
  * Administración de cuentas activas (Bancolombia, Nequi, Efectivo y creación de nuevas cuentas/billeteras).
  * Libro diario de ingresos y egresos con filtros por cuenta, categoría y fechas.
* 🔐 **Seguridad y Firebase:**
  * Autenticación de usuarios por usuario o correo y contraseña.
  * Sincronización en tiempo real con **Firebase Cloud Firestore**.

---

## 🚀 Cómo Ejecutar Localmente

No requiere instalar servidores ni bases de datos complejas; solo necesitas un navegador web moderno:

1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/motocontrol-flota.git
   ```
2. Abre el archivo `index.html` en tu navegador favorito (Chrome, Edge, Firefox, Safari).

---

## ☁️ Conexión con Firebase Firestore

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Cloud Firestore** en modo de prueba.
3. Registra una aplicación web (`</>`) y copia las credenciales (`apiKey`, `projectId`, `appId`, etc.).
4. En MotoControl, haz clic en el botón superior **"● Modo Local (Listo para Firebase)"** e ingresa los datos. ¡Tus datos se sincronizarán al instante!

---

Desarrollado con arquitectura moderna Vanilla JavaScript, Tailwind CSS y Google Firebase SDK v9.
