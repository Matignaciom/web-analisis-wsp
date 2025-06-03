# 📊 Web Análisis WSP - Plataforma de Análisis Comercial WhatsApp

Una aplicación web moderna y completamente **responsive** para analizar conversaciones de WhatsApp con inteligencia artificial. Construida con **React 19 + TypeScript** siguiendo principios de **Clean Architecture** y **SOLID**.

## 🚀 Características Principales

### ✅ **Funcionalidades Implementadas**
- **🤖 Análisis de Sentimientos con IA**: Detecta emociones en conversaciones (-1 a +1)
- **🎯 Análisis de Intenciones**: Identifica propósitos del cliente (compra, queja, consulta, etc.)
- **📊 Dashboard Dinámico**: Métricas en tiempo real con visualización moderna
- **📁 Procesamiento Inteligente de Excel/CSV**: Extrae datos automáticamente con mapeo flexible
- **☁️ Storage en la Nube**: Integración con Supabase para archivos
- **📈 Análisis por Lotes**: Procesa múltiples conversaciones optimizando costos de API
- **📋 Exportación Avanzada**: Reportes en PDF y Excel con datos completos
- **🔄 Estado Global**: Gestión eficiente con Zustand

### 💫 **UX/UI Moderna y Responsive**
- **📱 Diseño completamente responsive**: Desktop, tablet y móvil
- **✨ Animaciones fluidas**: Loading states y transiciones con Framer Motion
- **🎨 Interfaz moderna**: Glass morphism, gradientes y Tailwind CSS
- **🔔 Sistema de notificaciones**: React Hot Toast para feedback visual
- **⚡ Navegación fluida**: React Router DOM con rutas optimizadas

### 🏗️ **Arquitectura Robusta**
- **🎯 Clean Architecture**: Separación clara de dominio, aplicación y presentación
- **📐 Principios SOLID**: Código mantenible y escalable
- **🔄 State Management**: Zustand para estado global eficiente
- **🛡️ TypeScript**: Tipado fuerte con interfaces y entidades bien definidas
- **📝 Validación**: Zod para validación de esquemas y React Hook Form

## 🛠️ Stack Tecnológico

### **Frontend Core**
- **React 19.1.0** - Framework principal con las últimas características
- **TypeScript 5.8.3** - Tipado estático para mayor seguridad
- **Vite 6.3.5** - Bundler ultra rápido con HMR
- **CSS Modules + Tailwind CSS 4.1.8** - Estilos modulares y utilitarios

### **Estado y Navegación**
- **Zustand 4.5.7** - Estado global liviano y eficiente
- **React Router DOM 6.8.0** - Navegación SPA
- **React Hook Form 7.48.0** - Formularios performantes
- **Zod 3.22.0** - Validación de esquemas

### **UI/UX y Animaciones**
- **Framer Motion 11.18.2** - Animaciones avanzadas
- **Lucide React 0.511.0** - Iconografía moderna
- **React Hot Toast 2.5.2** - Notificaciones elegantes
- **CLSX 2.0.0** - Utilidad para clases CSS condicionales

### **Servicios Externos y APIs**
- **OpenAI 5.1.0** - Análisis de conversaciones con GPT
- **Supabase 2.49.9** - Storage de archivos y backend
- **TanStack React Query 5.0.0** - Gestión de estado del servidor

### **Procesamiento de Datos**
- **XLSX 0.18.5** - Lectura/escritura de archivos Excel
- **PapaParse 5.4.0** - Procesamiento de CSV
- **Date-fns 2.30.0** - Manipulación de fechas

### **Exportación y Reportes**
- **jsPDF 3.0.1** - Generación de PDFs
- **jsPDF AutoTable 5.0.2** - Tablas en PDF
- **HTML2Canvas 1.4.1** - Captura de elementos DOM
- **Recharts 2.8.0** - Gráficos y visualizaciones

### **Desarrollo y Calidad**
- **ESLint 9.27.0** - Linting con configuración moderna
- **Prettier 3.5.3** - Formateo automático de código
- **Vitest 1.0.0** - Framework de testing
- **Testing Library** - Utilidades para testing de componentes

## 📁 Estructura del Proyecto

```
src/
├── domain/                    # 🎯 Lógica de negocio pura
│   ├── entities/             # Modelos de datos y tipos
│   │   ├── Conversation.ts   # Entidad conversación con filtros
│   │   ├── AnalysisResult.ts # Resultados de análisis IA
│   │   ├── DashboardMetrics.ts # Métricas del dashboard
│   │   ├── WhatsAppMessage.ts # Mensajes individuales
│   │   └── index.ts         # Exportaciones centralizadas
│   └── interfaces/          # Contratos de servicios
│       ├── IConversationRepository.ts
│       ├── IFileProcessor.ts
│       └── IAnalysisService.ts
├── application/             # 🔧 Casos de uso (lógica de aplicación)
│   └── usecases/
│       ├── ProcessFileUseCase.ts       # Procesamiento de archivos
│       └── GetDashboardMetricsUseCase.ts # Métricas dashboard
├── infrastructure/          # 🔌 Servicios externos e implementaciones
│   └── services/
│       ├── OpenAIAnalysisService.ts    # Integración OpenAI
│       ├── ExcelFileProcessor.ts       # Procesamiento Excel/CSV
│       ├── SupabaseStorageService.ts   # Storage en la nube
│       └── InMemoryConversationRepository.ts
├── presentation/            # 🎨 Capa de presentación
│   ├── components/          # Componentes React
│   │   ├── Layout/          # Layout principal con navegación
│   │   ├── Dashboard/       # Dashboard con métricas y gráficos
│   │   ├── FileUploader/    # Componente drag & drop avanzado
│   │   └── ExportPage/      # Página de exportación
│   └── store/              # Estado global
│       └── useAppStore.ts  # Store Zustand centralizado
├── App.tsx                 # Componente principal con rutas
├── App.css                # Estilos globales y responsive
└── main.tsx               # Punto de entrada de la aplicación
```

## 🔧 Configuración e Instalación

### **1. Prerrequisitos**
- Node.js 18+ (recomendado: 20.x)
- NPM o Yarn
- Cuenta de OpenAI con API key
- Proyecto de Supabase configurado

### **2. Instalación**

```bash
# Clonar repositorio
git clone [tu-repositorio]
cd web-analisis-wsp

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### **3. Configuración de Variables de Entorno**

Edita el archivo `.env` con tus credenciales:

```bash
# OpenAI Configuration (REQUERIDO)
VITE_OPENAI_API_KEY=sk-TU-CLAVE-DE-OPENAI-AQUI
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=800
VITE_OPENAI_TEMPERATURE=0.3

# Supabase Configuration (REQUERIDO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-aqui

# Application Configuration
VITE_APP_NAME=Web Análisis WSP
VITE_APP_VERSION=1.0.0

# File Processing Configuration
VITE_MAX_FILE_SIZE_MB=25
VITE_BATCH_SIZE=3

# Analysis Configuration
VITE_ENABLE_BATCH_PROCESSING=true
VITE_RATE_LIMIT_DELAY=1500
VITE_ENABLE_FALLBACK_ANALYSIS=true
```

### **4. Configuración de OpenAI**

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Crea una nueva API key
4. Copia la clave que comienza con `sk-`
5. Pégala en tu archivo `.env`

#### **💰 Modelos Recomendados por Presupuesto**

| Modelo | Costo por 1K tokens | Ideal para |
|--------|-------------------|------------|
| `gpt-3.5-turbo` | ~$0.002 | Análisis básico, presupuestos limitados |
| `gpt-4-turbo-preview` | ~$0.01-0.03 | Análisis profesional, insights detallados |
| `gpt-4` | ~$0.03-0.06 | Análisis de máxima precisión |

### **5. Configuración de Supabase**

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Ve a Settings > API para obtener las credenciales
3. Configura el Storage Bucket (ver sección específica abajo)

### **6. Iniciar la aplicación**

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

La aplicación estará disponible en `http://localhost:5173`

## 🗄️ Configuración de Supabase Storage

### **1. Crear Bucket para Archivos Excel**

En tu panel de Supabase:

1. Ve a **Storage** > **Buckets**
2. Crear nuevo bucket:
   - **Name**: `excel-files`
   - **Public**: No (privado)
   - **File size limit**: 25MB
   - **Allowed MIME types**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv`

### **2. Configurar Políticas de Seguridad (RLS)**

Ejecuta estos comandos SQL en el editor de Supabase:

```sql
-- Política para permitir subida de archivos
CREATE POLICY "Allow file uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'excel-files');

-- Política para permitir lectura de archivos
CREATE POLICY "Allow file downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'excel-files');

-- Política para permitir eliminación de archivos (opcional)
CREATE POLICY "Allow file deletion" ON storage.objects
FOR DELETE USING (bucket_id = 'excel-files');
```

## 📋 Formato de Archivo Excel/CSV Esperado

### **Columnas Reconocidas Automáticamente**

| Campo | Nombres Reconocidos |
|-------|-------------------|
| **Cliente** | cliente, customer_name, name, nombre, usuario |
| **Teléfono** | telefono, phone, numero, whatsapp, celular |
| **Fecha** | fecha, date, fecha_inicio, start_date, timestamp |
| **Estado** | estado, status, estado_conversacion |
| **Mensajes** | mensajes, messages, total_messages, cantidad_mensajes |
| **Último Mensaje** | ultimo_mensaje, last_message, mensaje_final |
| **Agente** | agente, agent, vendedor, assigned_agent |

### **Ejemplo de Archivo Excel**

```
| Cliente        | Teléfono     | Fecha      | Estado      | Mensajes | Último Mensaje        | Agente |
|---------------|--------------|------------|-------------|----------|--------------------- |--------|
| Juan Pérez    | +52555123456 | 2024-01-15 | completado  | 12       | Gracias por la compra | Ana    |
| María García  | +52555789012 | 2024-01-16 | pendiente   | 3        | ¿Tienen disponible?   | Luis   |
| Pedro López   | +52555345678 | 2024-01-17 | abandonado  | 7        | Muy caro             |        |
```

## 🎯 Funcionalidades del Sistema

### **1. Análisis de Sentimientos**
- **Puntuación**: -1 (muy negativo) a +1 (muy positivo)
- **Etiquetas**: very_negative, negative, neutral, positive, very_positive
- **Palabras clave**: Términos que influyeron en el análisis
- **Nivel de confianza**: Precisión del análisis

### **2. Análisis de Intenciones**
- 🛒 Consulta de precios (`price_inquiry`)
- 📦 Verificación de stock (`stock_check`)
- 💳 Intención de compra (`purchase_intent`)
- ❌ Queja (`complaint`)
- 🛠️ Soporte técnico (`support`)
- ℹ️ Información general (`general_info`)
- 💰 Negociación (`negotiation`)
- 📞 Seguimiento (`follow_up`)

### **3. Dashboard con Métricas Avanzadas**
- 📊 Total de conversaciones procesadas
- ✅ Ventas completadas y tasa de conversión
- ❌ Chats abandonados y razones
- ⏱️ Tiempo promedio de respuesta
- 😊 Puntuación de satisfacción del cliente
- 📈 Análisis de tendencias temporales
- 🕐 Análisis de actividad por horas pico

### **4. Exportación Completa**
- 📄 **PDF**: Reportes detallados con gráficos
- 📊 **Excel**: Datos completos con análisis
- 🎯 **Filtros personalizables**: Por fecha, estado, agente
- 📋 **Resúmenes ejecutivos**: KPIs principales

## 🚦 Flujo de Uso

### **1. Preparar Archivo**
```
✅ Organiza datos en Excel/CSV
✅ Incluye columnas obligatorias: Cliente, Teléfono
✅ Usa nombres de columna reconocidos
✅ Máximo 25MB de tamaño
```

### **2. Subir y Procesar**
```
📁 Selecciona archivo → Validación automática
☁️ Subida a Supabase → Almacenamiento seguro
🤖 Procesamiento con IA → Análisis en lotes
📊 Resultados → Dashboard actualizado
```

### **3. Analizar Resultados**
```
🎯 Dashboard → Métricas generales y KPIs
💬 Conversaciones → Lista detallada con análisis IA
📊 Exportar → Reportes en PDF/Excel
```

## 🛠️ Scripts de Desarrollo

```bash
# Desarrollo
npm run dev          # Servidor con hot reload
npm run build        # Build optimizado para producción
npm run preview      # Preview del build

# Calidad de código
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores automáticamente
npm run format       # Formatear con Prettier

# Testing y análisis
npm run test         # Ejecutar tests con Vitest
npm run analyze      # Análisis del bundle con vite-bundle-analyzer
```

## 🎨 Componentes Principales

### **Dashboard**
- Métricas en tiempo real con animaciones
- Tarjetas de KPIs con tendencias
- Grid responsivo con CSS Modules
- Loading states elegantes

### **FileUploader**
- Drag & drop con feedback visual
- Validación de tipos y tamaño
- Progress bar para subidas
- Integración con Supabase Storage

### **ExportPage**
- Configuración flexible de exportación
- Preview de datos antes de exportar
- Múltiples formatos (PDF, Excel)
- Filtros por fecha y categorías

### **Layout**
- Navegación responsive
- Header con branding
- Footer informativo
- Rutas optimizadas con React Router

## 🔍 Troubleshooting

### **❌ Error: "VITE_OPENAI_API_KEY es requerida"**
```bash
✅ Verifica que el archivo .env existe
✅ Asegúrate de que la clave comience con sk-
✅ Reinicia el servidor (npm run dev)
```

### **❌ Error: "Supabase connection failed"**
```bash
✅ Verifica credenciales en .env
✅ Confirma que el bucket excel-files existe
✅ Revisa políticas RLS configuradas
```

### **❌ Error: "Formato no soportado"**
```bash
✅ Usa archivos .xlsx, .xls o .csv
✅ Verifica que no esté corrupto
✅ Máximo 25MB de tamaño
```

### **⚠️ Análisis Incompleto**
```bash
✅ Revisa créditos de OpenAI
✅ Verifica conexión a internet
✅ Considera usar GPT-3.5 para ahorrar costos
```

## 📈 Próximas Funcionalidades

- [ ] 🗄️ Base de datos persistente con Supabase Database
- [ ] 🔐 Sistema de autenticación de usuarios
- [ ] 🔌 API REST para integración externa
- [ ] 📊 Dashboard con gráficos interactivos (Chart.js/D3)
- [ ] 🚨 Alertas automáticas por sentimientos negativos
- [ ] 📱 Integración directa con WhatsApp Business API
- [ ] 🔄 Sincronización en tiempo real
- [ ] 🌐 Soporte multi-idioma (i18n)
- [ ] 🧪 Testing automatizado con CI/CD
- [ ] 📱 PWA (Progressive Web App)

## 🚀 Optimizaciones Implementadas

### **Performance**
- ⚡ Vite con HMR ultra rápido
- 🎯 Code splitting automático
- 📦 Bundle optimizado para producción
- 🔄 React Query para cache inteligente

### **UX/UX**
- 📱 Diseño mobile-first responsive
- ✨ Animaciones fluidas con Framer Motion
- 🎨 CSS Modules para estilos modulares
- 🔔 Notificaciones toast elegantes

### **Desarrollo**
- 🛡️ TypeScript para type safety
- 📐 Clean Architecture para mantenibilidad
- 🔧 ESLint + Prettier para calidad de código
- 🧪 Testing setup con Vitest

## 💡 Mejores Prácticas Implementadas

1. **🎯 Arquitectura Limpia**: Separación clara de responsabilidades
2. **📊 Estado Inmutable**: Zustand con patrones inmutables
3. **🔒 Tipado Fuerte**: Interfaces bien definidas en TypeScript
4. **🧪 Código Testeable**: Componentes y funciones puras
5. **📱 Mobile First**: Diseño responsive desde el inicio
6. **⚡ Performance**: Lazy loading y optimizaciones
7. **🔧 DX**: Herramientas de desarrollo optimizadas

## 🤝 Contribución

Para contribuir al proyecto:

1. 🍴 Fork el repositorio
2. 🌿 Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. 💻 Realiza cambios y commits descriptivos
4. 🧪 Ejecuta tests: `npm run test`
5. 🔍 Verifica linting: `npm run lint`
6. 📤 Push: `git push origin feature/nueva-funcionalidad`
7. 🔀 Crea Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**🚀 ¡Desarrollado con React 19, TypeScript y las mejores prácticas de desarrollo moderno!**
