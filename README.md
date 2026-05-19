# Frontend — Simulador de Máquinas de Turing

Interfaz web en **React 18 + Vite** que permite elegir una máquina, ingresar una cadena, simular paso a paso (o en automático) y ver la cinta, la tabla δ y el historial con notación matemática (KaTeX).

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | 18 o superior (recomendado 20 LTS) |
| npm | Viene con Node.js |

Descarga Node desde https://nodejs.org/ (versión **LTS**).

Comprueba la instalación:

```powershell
node -v
npm -v
```

## Instalar dependencias

### Opción A — Windows (recomendada)

Desde la carpeta `frontend`:

```powershell
.\start-frontend.bat
```

La primera vez ejecuta `npm install` automáticamente si no existe `node_modules/`.

### Opción B — Manual

```powershell
cd frontend
npm install
```

### Qué instala `package.json`

**Dependencias de producción**

| Paquete | Para qué sirve |
|---------|----------------|
| **react** / **react-dom** | Interfaz y componentes |
| **katex** / **react-katex** | Fórmulas δ, Σ, q₀ en pantalla |

**Dependencias de desarrollo**

| Paquete | Para qué sirve |
|---------|----------------|
| **vite** | Servidor de desarrollo y build |
| **@vitejs/plugin-react** | Soporte JSX y hot reload |

## Ejecutar en desarrollo

```powershell
npm run dev
```

O con el script:

```powershell
.\start-frontend.bat
```

- **App:** http://localhost:5173  
- El proxy de Vite redirige `/api` → `http://localhost:8000` (el backend debe estar corriendo).

## Build para producción

```powershell
npm run build
npm run preview
```

En Render u otro hosting, define antes del build:

```
VITE_API_URL=https://tu-api.onrender.com/api/v1
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `VITE_API_URL` | URL base de la API (incluye `/api/v1`) | `/api/v1` (proxy local) |

Archivo opcional `.env.local`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Estructura del código

```
frontend/src/
├── main.jsx                 # Monta React en #root
├── App.jsx                  # Renderiza SimulationPage
├── pages/
│   └── SimulationPage.jsx   # Pantalla principal (estado + lógica)
├── components/
│   ├── MachineSelector.jsx  # Select de máquina preset
│   ├── InputString.jsx      # Cadena de entrada + alfabeto Σ
│   ├── TapeView.jsx         # Dibuja la cinta y la cabeza ▼
│   ├── StatusPanel.jsx      # Estado, paso, última δ, mensaje final
│   ├── ControlPanel.jsx     # Iniciar / Paso / Ejecutar / Pausar
│   ├── TransitionTable.jsx  # Matriz δ + definición M=(Q,Σ,Γ,...)
│   ├── StepHistory.jsx      # Lista de pasos ejecutados
│   ├── TapeSymbol.jsx       # Símbolos ⊔, 0, 1, a, b, marcas
│   └── RichText.jsx         # Texto + KaTeX inline
├── services/
│   └── api.js               # Cliente fetch hacia el backend
├── utils/
│   └── formalNotation.js    # q₀, δ, conjuntos en LaTeX
└── styles/
    └── index.css            # Estilos globales
```

## Cómo funciona el código

### 1. Punto de entrada (`main.jsx` → `App.jsx`)

- `main.jsx` monta la app en el DOM.
- `App.jsx` solo muestra `SimulationPage` (una sola pantalla, sin router).

### 2. Carga inicial (`SimulationPage.jsx`)

Al montar la página:

1. `api.listMachines()` → llena el selector (oculta `infinite_loop`).
2. Al cambiar la máquina, `api.getMachine(id)` → carga estados, transiciones y descripción.

Estado principal guardado en React:

| Estado | Uso |
|--------|-----|
| `machineId` / `machineDetail` | Máquina elegida y su JSON |
| `input` | Cadena que escribe el usuario |
| `simulationId` | ID de sesión en el backend |
| `snapshot` | Cinta, cabeza, estado, paso, status |
| `history` | Snapshots de pasos anteriores |
| `speed` / `isRunning` / `isPaused` | Animación automática |

### 3. Crear y simular

| Acción | Función | Qué hace |
|--------|---------|----------|
| Crear simulación | `handleStart` | `POST /simulations` → guarda `simulationId` y primer snapshot |
| Un paso | `handleStep` | `POST .../step` → actualiza cinta y estado |
| Ejecutar | `handleRun` → `runLoop` | Repite `step` cada `speed` ms hasta aceptar/rechazar/pausar |
| Pausar | `handlePause` | Cancela el `setTimeout` del bucle |
| Reiniciar | `handleReset` | `POST .../reset` → cinta y contador al inicio |

`applySnapshot` actualiza la UI y, si corresponde, añade el paso al historial (máx. 500 entradas).

### 4. Cliente API (`services/api.js`)

- Todas las llamadas van a `VITE_API_URL` o `/api/v1` en local.
- `request()` hace `fetch`, parsea JSON y lanza error si el status no es OK (mensaje para el banner rojo).

### 5. Visualización de la cinta (`TapeView.jsx`)

- Recibe `tape` (lista de celdas `{ index, symbol }`) y `headIndex`.
- Recorre las celdas y marca con borde naranja y ▼ la posición de la cabeza.
- Cada símbolo pasa por `TapeSymbol` (estilos distintos para blanco, bits, letras, marcas).

### 6. Tabla de transiciones (`TransitionTable.jsx`)

Estilo “cuaderno del profe”:

1. **MachineDefinition** — muestra \(M = (Q, \Sigma, \Gamma, \delta, q_0, B, F)\).
2. **Matriz** — filas = estados, columnas = símbolos de Γ; celda vacía = \(\emptyset\); con transición = \((q', s, D)\).
3. **Lista desplegable** — todas las δ en formato \(\delta(q,a) \rightarrow (q',b,R)\).
4. Resalta la fila del **estado actual** durante la simulación.

La matriz se arma en `formalNotation.js` → `buildTransitionMatrix()`.

### 7. Notación matemática (`RichText.jsx` + `formalNotation.js`)

- `RichText` divide el texto en trozos normales y fórmulas entre `$...$`, y las renderiza con KaTeX.
- `formalNotation.js` convierte nombres internos (`q0`, `q_accept`) a LaTeX (`q_0`, `q_{\text{accept}}`).

### 8. Proxy en desarrollo (`vite.config.js`)

```js
proxy: { '/api': { target: 'http://localhost:8000' } }
```

Así el frontend puede llamar `/api/v1/...` sin configurar CORS en local.

## Flujo resumido (usuario → pantalla)

```
Usuario elige máquina + cadena
        ↓
handleStart → API crea TuringEngine
        ↓
snapshot (cinta, q₀, RUNNING)
        ↓
Paso / Ejecutar → API aplica δ
        ↓
TapeView + StatusPanel + TransitionTable se actualizan
        ↓
ACCEPTED / REJECTED → mensaje pedagógico en StatusPanel
```

## Despliegue en Render

1. https://dashboard.render.com → **New** → **Static Site** → repo **Maquina-Turing-Front**
2. Build: `npm install && npm run build` · Publish: `dist`
3. Variable **`VITE_API_URL`** = `https://TU-API.onrender.com/api/v1` (despliega la API antes)

Ver `render.yaml` en este repo.
