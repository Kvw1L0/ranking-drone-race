# 🛸 Ranking Drone Race (Drone Racing League & Telemetría en Vivo)

Sistema web en tiempo real para eventos de carreras de drones con persistencia atómica en base de datos, sincronización por WebSockets (Socket.io) y en la nube con Google Firebase Realtime Database. Cuenta con estaciones táctiles para monitores de pista y pantalla gigante de clasificación en vivo.

---

## 🏁 Módulos del Sistema

| Módulo | Ruta | Dispositivo Recomendado | Propósito |
|---|---|---|---|
| **Portal Central** | `/` | PC / Celular | Selector principal de interfaces del evento |
| **Estación del Monitor** | `/monitor` | Tablets / Celulares de Pista | Ingreso de tiempos por pista, cronómetro digital táctil, 1 intento con desbloqueo |
| **Pantalla Gigante** | `/leaderboard` | Proyector / TV 4K | Ranking global por puntos (Opción B), rankings por pista, auto-rotación (15s) |
| **Dirección de Carrera** | `/admin/drones` | Laptop Admin | Gestión de pilotos, auditoría de tiempos, desbloqueos, exportar CSV |

---

## ⏱️ Reglas Oficiales de Clasificación (Opción B)

1. **Ranking por Pista:**
   - Cada piloto realiza su vuelo en la pista activa (1 intento oficial por defecto).
   - Menor tiempo = 1er lugar.
   - Puntos estilo FIA/F1 asignados por posición: **1°: 25 pts, 2°: 18, 3°: 15, 4°: 12, 5°: 10, 6°: 8, 7°: 6, 8°: 4, 9°: 2, 10°: 1 pt**.
   - Los pilotos que aún no hayan corrido en esa pista se marcan explícitamente como **`⏳ PENDIENTE`**.
2. **Ranking Global:**
   - Suma acumulada de puntos de todas las pistas. En caso de empate a puntos, desempate por menor tiempo total.
   - Si un piloto tiene pistas sin correr, su estado general es **`⏳ EN CURSO`** y se detalla con precisión cuáles pistas tiene pendientes (ej: *"Falta: Pista 2"*).
   - Al completar todas las pruebas, su estado pasa a **`✅ COMPLETADO`**.
3. **Regla de Intentos & Desbloqueo:**
   - Por defecto: **1 solo intento oficial** por pista.
   - En caso de choque, fallo técnico FPV, interferencia o corte de señal, el monitor o el director de carrera puede presionar **"🔓 Desbloquear Reintento"** para registrar un nuevo intento oficial.
4. **Cronometraje Integrado:**
   - La pantalla del monitor cuenta con un **cronómetro digital táctil** (Iniciar / Parar / Resetear / Copiar tiempo al vuelo) y campo manual de segundos y centésimas (ej: `83.45`).

---

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm run install:all

# 2. Iniciar ambos servicios en local
npm run dev:all

# O iniciar por separado:
# Servidor WebSocket & REST (Puerto 4000)
npm run server

# Frontend Next.js (Puerto 3000)
npm run client
```
