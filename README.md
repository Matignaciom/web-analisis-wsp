# 📊 Análisis Inteligente de Conversaciones WhatsApp

Una plataforma web moderna que utiliza inteligencia artificial para analizar conversaciones de WhatsApp desde archivos Excel, proporcionando insights profundos sobre métricas de rendimiento, análisis de clientes y optimización de ventas.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Características Principales

- **📊 Análisis Automático**: Procesamiento inteligente de archivos Excel con conversaciones WhatsApp
- **🤖 IA Integrada**: Análisis de sentimientos, intenciones y generación de insights usando OpenAI
- **📈 Dashboard Dinámico**: Métricas en tiempo real con visualizaciones interactivas
- **🎯 Detección de Oportunidades**: Identificación automática de potencial de ventas
- **📋 Tabla Interactiva**: Vista detallada de conversaciones con filtros avanzados
- **📤 Exportación Completa**: Exportación a PDF y Excel con métricas completas
- **☁️ Almacenamiento en la Nube**: Integración con Supabase para persistencia de datos
- **🔧 Arquitectura Modular**: Clean Architecture con separación de responsabilidades

## 🎯 ¿Cómo Funciona el Proyecto?

### 📋 **Paso 1: Preparación del Archivo Excel**

El sistema acepta archivos Excel con conversaciones de WhatsApp. **No requiere formato específico** - detecta automáticamente las columnas:

#### ✅ **Columnas Detectadas Automáticamente:**
- **Cliente/Nombre**: `cliente`, `customer`, `nombre`, `name`, `contact`
- **Teléfono**: `telefono`, `phone`, `whatsapp`, `celular`, `numero`
- **Mensajes**: `mensaje`, `message`, `last_message`, `content`
- **Estado**: `estado`, `status`, `stage`, `etapa`, `pipeline`
- **Fecha**: `fecha`, `date`, `timestamp`, `created_at`
- **Agente**: `agente`, `agent`, `assigned`, `vendedor`

#### 📄 **Ejemplo de Excel Válido:**
```
| Cliente        | WhatsApp      | Último Mensaje           | Estado    | Agente |
|----------------|---------------|--------------------------|-----------|--------|
| Juan Pérez     | +521234567890 | ¿Cuánto cuesta el plan?  | Pendiente | María  |
| Ana García     | 55-1234-5678  | Perfecto, lo compro      | Cerrado   | Carlos |
| Luis Martínez  | 1234567890    | Necesito más información | Activo    | Ana    |
```

### 📤 **Paso 2: Subida y Procesamiento**

1. **Arrastra o selecciona** tu archivo Excel (.xlsx, .xls, .csv)
2. El sistema **detecta automáticamente** la estructura de columnas
3. **Procesa cada conversación** aplicando análisis inteligente
4. **Genera métricas** en tiempo real mientras procesa

#### 🔄 **Proceso de Análisis:**
```
📁 Archivo Excel → 🔍 Detección de Columnas → 📊 Análisis de Datos → 🤖 IA (opcional) → 📈 Métricas
```

### 📊 **Paso 3: Dashboard de Métricas**

Una vez procesado, aparece el dashboard con **dos tipos de métricas**:

## 📈 **Métricas Principales (Siempre Visibles)**

### 🎯 **Métricas Básicas Extraídas del Excel:**

1. **📊 Total Conversaciones**
   - **Qué mide**: Número total de filas/conversaciones en el Excel
   - **Origen**: Conteo directo del archivo
   - **Confiabilidad**: 100% - Dato exacto

2. **✅ Ventas Completadas**
   - **Qué mide**: Conversaciones con estado "completado", "cerrado", "vendido"
   - **Origen**: Columna de estado del Excel
   - **Cálculo**: Cuenta estados que indican venta exitosa
   - **Porcentaje**: Se muestra el % del total

3. **❌ Conversaciones Abandonadas**
   - **Qué mide**: Conversaciones con estado "abandonado", "perdido", "cancelado"
   - **Origen**: Columna de estado del Excel
   - **Cálculo**: Cuenta estados que indican abandono
   - **Porcentaje**: Se muestra el % del total

4. **⏱️ Tiempo Promedio de Respuesta**
   - **Qué mide**: Tiempo promedio entre mensajes o respuestas
   - **Origen**: Metadatos del Excel o estimación por número de mensajes
   - **Indicador**: "Directo" si hay datos, "Estimado" si se calcula

5. **🎯 Tasa de Conversión**
   - **Qué mide**: Porcentaje de conversaciones que resultaron en venta
   - **Cálculo**: (Ventas Completadas / Total Conversaciones) × 100
   - **Origen**: Calculado matemáticamente de los estados

6. **⭐ Satisfacción Promedio** (Solo si hay datos)
   - **Qué mide**: Puntuación promedio de satisfacción del cliente
   - **Origen**: Columna de satisfacción en el Excel (1-5, 1-10, etc.)
   - **Mostrado**: Solo aparece si hay datos de satisfacción reales

## 🔬 **Análisis Avanzado de Datos**

### 📋 **Panel Informativo**
Antes de las métricas avanzadas, aparece una **guía explicativa** que detalla:

- **📊 Métricas Objetivas**: Basadas en datos directos del Excel
- **🔮 Métricas Inferidas**: Estimaciones basadas en análisis de patrones
- **Diferencias**: Cómo interpretar cada tipo de métrica

### 🎯 **Métricas Objetivas (Datos Directos)**
Estas métricas se calculan **directamente** desde los datos del Excel:

- **Densidad de Comunicación**: Mensajes promedio por día
- **Índice de Complejidad**: Basado en longitud y número de mensajes
- **Calidad de Datos**: Porcentaje de completitud del dataset
- **Distribución por Agente**: Métricas por vendedor/agente

### 🔮 **Métricas Inferidas (Estimaciones)**
Estas métricas son **estimaciones inteligentes** basadas en patrones:

- **Momentum del Negocio**: Tendencia de crecimiento estimada
- **Velocidad de Respuesta**: Análisis de patrones de comunicación
- **Ratio de Engagement**: Nivel de participación del cliente estimado

### 🎨 **Características Visuales de las Métricas:**

#### 🏷️ **Indicadores en Cada Recuadro:**
- **📊 Icono verde**: Métrica objetiva (datos directos)
- **🔮 Icono amarillo**: Métrica inferida (estimación)
- **✓ Círculo verde**: Alta confianza (>90%)
- **~ Círculo amarillo**: Confianza media (70-90%)
- **! Círculo rojo**: Baja confianza (<70%)
- **⚠️ Triángulo**: Advertencias sobre calidad de datos

#### 💡 **Información Detallada (Hover):**
Al pasar el cursor sobre cualquier métrica, aparece un tooltip con:
- 📊 **Nombre y valor** de la métrica
- 🔍 **Tipo**: Objetiva o inferida
- 📋 **Categoría** de análisis
- 📊 **Origen** de los datos
- 🎯 **Nivel de confianza**
- 📍 **Campos del Excel** utilizados
- 🔢 **Método de cálculo**
- ⚠️ **Advertencias** si existen

## 📋 **Tabla Detallada de Conversaciones**

### 🗂️ **Estructura de la Tabla (8 Columnas):**

#### 1. **🧑‍💼 Cliente**
- **Contenido**: Nombre del cliente del Excel
- **Información adicional**: Teléfono y datos de contacto
- **Ancho**: 180px (responsive)

#### 2. **📍 Estado**
- **Contenido**: Estado inteligente de la conversación
- **Estados posibles**:
  - ✅ **Cerrado**: Conversación completada exitosamente
  - 🔄 **En proceso**: Conversación activa en desarrollo
  - ⏳ **Pendiente**: Esperando respuesta o acción
  - 🚨 **Requiere atención**: Conversación abandonada
- **Análisis**: Si no hay estado en Excel, se infiere por actividad
- **Ancho**: 120px

#### 3. **💡 Interés Detectado**
- **Contenido**: Etiquetas estandarizadas de interés del cliente
- **Categorías**:
  - 🛒 **Comercial**: Intención de compra directa
  - 📋 **Información**: Solicitud de detalles
  - 🔧 **Soporte**: Problemas o dudas técnicas
  - 💰 **Precio**: Consultas sobre costos
  - 📦 **Producto**: Preguntas específicas sobre productos
  - 🤖 **Sin analizar**: No hay datos suficientes
- **Detección**: Muestra en qué mensaje se detectó el interés
- **Ancho**: 200px (min 180px)

#### 4. **📈 Potencial de Venta**
- **Contenido**: Nivel de potencial calculado con fórmula avanzada
- **Niveles**:
  - 🟩 **Alto**: >70 puntos - Alta probabilidad de conversión
  - 🟨 **Medio**: 40-70 puntos - Probabilidad moderada
  - 🟥 **Bajo**: <40 puntos - Baja probabilidad
- **Fórmula**: Engagement (30pts) + Interés (40pts) + Estado (30pts)
- **Indicadores**: Iconos de color y puntuación numérica
- **Ancho**: 140px

#### 5. **🔍 Justificación**
- **Contenido**: Explicación detallada del potencial de venta
- **Información**:
  - Factores que influyen en la puntuación
  - Nivel de engagement detectado
  - Tipo de interés identificado
  - Estado actual de la conversación
- **Formato**: Lista de factores separados por "•"
- **Ancho**: 200px (se oculta en móviles)

#### 6. **📝 Resumen IA**
- **Contenido**: Resumen estructurado y uniforme de la conversación
- **Estructura**:
  - **Cliente**: Información básica
  - **Situación**: Contexto actual
  - **Necesidad**: Qué busca el cliente
  - **Estado**: Punto actual del proceso
- **Origen**: Generado por IA o estructura uniforme basada en datos
- **Ancho**: 350px

#### 7. **🎯 Sugerencia IA**
- **Contenido**: Recomendaciones de acción parametrizadas
- **Tipos de sugerencias**:
  - 🚀 **Urgente**: Requiere acción inmediata
  - 📞 **Seguimiento**: Contactar en plazo específico
  - 💰 **Negociación**: Oportunidad de cierre
  - 📋 **Información**: Enviar detalles adicionales
- **Prioridades**: Código de colores (rojo=urgente, amarillo=medio, verde=bajo)
- **Variaciones**: Sistema parametrizado con múltiples opciones
- **Ancho**: 350px

#### 8. **⚙️ Acciones**
- **Contenido**: Botones de acción específicos
- **Acciones disponibles**:
  - 👁️ **Ver Detalles**: Abre modal con información completa
  - 📞 **Llamar**: Inicia llamada (si hay teléfono)
  - 💬 **WhatsApp**: Abre chat de WhatsApp
  - 📧 **Email**: Compone email (si hay datos)
- **Descripciones**: Cada botón explica qué acción realizará
- **Ancho**: 150px

### 🔍 **Sistema de Filtros Inteligentes**

#### 📊 **Filtros Principales (Orden Específico):**

1. **📊 Todas**
   - **Función**: Muestra todas las conversaciones
   - **Información**: Total de conversaciones y tasa de conversión general
   - **Siempre visible**: Filtro por defecto

2. **⏳ Pendientes**
   - **Función**: Solo conversaciones que requieren atención
   - **Criterio**: Estado = "pendiente" o sin respuesta reciente
   - **Prioridad**: Aparece primero si hay conversaciones pendientes

3. **📊 Bajo Potencial**
   - **Función**: Conversaciones con <40 puntos de potencial
   - **Información**: Cantidad y porcentaje del total
   - **Color**: Rojo para indicar baja prioridad

4. **📈 Medio Potencial**
   - **Función**: Conversaciones con 40-70 puntos de potencial
   - **Información**: Cantidad y porcentaje del total
   - **Color**: Amarillo para indicar prioridad media

5. **🎯 Alto Potencial**
   - **Función**: Conversaciones con >70 puntos de potencial
   - **Información**: Cantidad y porcentaje del total
   - **Color**: Verde para indicar alta prioridad

#### 🎯 **Filtros Adicionales Dinámicos:**
El sistema genera automáticamente filtros adicionales basados en los datos:

- **✅ Ventas Completadas**: Si hay ventas cerradas
- **❌ Abandonadas**: Si hay conversaciones abandonadas
- **🎯 Alto Potencial Conversión**: Para conversiones por encima del promedio
- **Filtros por Estado**: Según los estados únicos encontrados en el Excel

#### 🔍 **Barra de Búsqueda Avanzada:**
- **Campos de búsqueda**:
  - Nombre del cliente
  - Número de teléfono
  - Contenido de mensajes
  - Resúmenes de IA
  - Sugerencias
  - Estados calculados
  - Intereses detectados
- **Búsqueda en tiempo real**: Filtra mientras escribes
- **Búsqueda inteligente**: Busca en campos calculados y originales

### 📊 **Contador de Resultados Inteligente**
Muestra información contextual sobre los filtros aplicados:
- **Total mostrado** vs total disponible
- **Indicador de filtros IA** activos
- **Indicador de búsqueda** activa
- **Porcentaje del total** cuando hay filtros aplicados

## 🎨 **Características de Diseño Responsivo**

### 📱 **Adaptación por Pantalla:**

#### 🖥️ **Desktop (>1024px)**
- **Tabla completa**: Todas las 8 columnas visibles
- **Métricas**: Grid de 3-4 columnas
- **Filtros**: Todos visibles en línea horizontal

#### 📱 **Tablet (768-1024px)**
- **Tabla**: 7 columnas (se oculta Justificación)
- **Métricas**: Grid de 2-3 columnas
- **Filtros**: Se mantienen todos visibles

#### 📱 **Móvil (640-768px)**
- **Tabla**: 6 columnas (se oculta Estado y Justificación)
- **Métricas**: Grid de 2 columnas
- **Filtros**: Scroll horizontal

#### 📱 **Móvil Pequeño (<640px)**
- **Tabla**: 5 columnas principales
- **Métricas**: 1 columna
- **Filtros**: Stack vertical

## 📤 **Sistema de Exportación**

### 📋 **Formatos Disponibles:**

#### 📊 **Excel Completo**
- **Contenido**: Todas las conversaciones con análisis
- **Columnas adicionales**: Potencial calculado, sugerencias IA, análisis
- **Métricas**: Hoja separada con todas las métricas del dashboard
- **Formato**: .xlsx con formato profesional

#### 📄 **PDF Profesional**
- **Contenido**: Reporte ejecutivo con gráficos
- **Secciones**: Resumen, métricas principales, tabla filtrada, insights
- **Diseño**: Formato corporativo con branding
- **Optimizado**: Para presentaciones y reportes

#### 📊 **CSV Simple**
- **Contenido**: Datos tabulares para análisis externo
- **Formato**: Compatible con cualquier herramienta de análisis
- **Codificación**: UTF-8 para caracteres especiales

### 🎯 **Datos Incluidos en Exportación:**
- **Conversaciones filtradas**: Solo las que están siendo mostradas
- **Métricas del dashboard**: Principales y avanzadas
- **Análisis de IA**: Resúmenes y sugerencias generadas
- **Metadatos**: Información sobre calidad y origen de datos

## 🛠️ Instalación y Configuración

### 📋 **Prerrequisitos**

- Node.js 18 o superior
- npm o yarn
- Cuenta de OpenAI (opcional, para análisis IA)
- Cuenta de Supabase (opcional, para almacenamiento)

### 🚀 **Instalación**

1. **Clona el repositorio**
```bash
git clone https://github.com/tuusuario/web-analisis-wsp.git
cd web-analisis-wsp
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
# OpenAI Configuration (opcional)
VITE_OPENAI_API_KEY=tu_clave_openai_aqui

# Supabase Configuration (opcional)
VITE_SUPABASE_URL=tu_url_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_supabase_aqui

# Environment
VITE_ENVIRONMENT=development
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

5. **Abre tu navegador**
```
http://localhost:5173
```

### 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Preview de la build de producción

# Testing y Calidad
npm run test         # Ejecuta los tests
npm run lint         # Ejecuta ESLint
npm run lint:fix     # Ejecuta ESLint y corrige automáticamente
npm run format       # Formatea el código con Prettier

# Análisis
npm run analyze      # Analiza el bundle de producción
```

## 🏗️ Arquitectura del Proyecto

### 📁 **Estructura de Carpetas**

```
src/
├── 🎯 application/          # Casos de uso y lógica de negocio
│   └── usecases/
├── 🏛️ domain/              # Entidades y interfaces del dominio
│   ├── entities/
│   └── repositories/
├── 🔧 infrastructure/      # Implementaciones concretas
│   └── services/
├── 🎨 presentation/        # Componentes React y UI
│   ├── components/
│   ├── hooks/
│   └── store/
└── ⚙️ config/             # Configuración de la aplicación
```

### 🏛️ **Clean Architecture**

El proyecto sigue los principios de Clean Architecture:

- **🎯 Application Layer**: Casos de uso y reglas de negocio
- **🏛️ Domain Layer**: Entidades del dominio y contratos
- **🔧 Infrastructure Layer**: Implementaciones concretas (APIs, base de datos)
- **🎨 Presentation Layer**: Interfaz de usuario y componentes React

### 🧩 **Componentes Principales**

#### 📊 **Dashboard**
- Visualización de métricas principales
- Métricas dinámicas generadas por IA
- Gráficos interactivos y responsive

#### 📋 **DetailedAnalysisTable**
- Tabla completa de conversaciones
- Filtros avanzados por estado, agente, fecha
- Análisis de potencial de ventas
- Sugerencias IA personalizadas

#### 📤 **FileUploader**
- Carga de archivos Excel/CSV
- Validación automática de formato
- Progress bar y feedback visual
- Integración con Supabase Storage

#### 📊 **ExportPage**
- Exportación a PDF y Excel
- Configuración de opciones de exportación
- Previsualización de datos

## 🤖 Servicios de IA

### 🧠 **AnalysisServiceFactory**

Sistema de análisis inteligente con múltiples niveles:

#### 🎯 **OpenAIAnalysisService**
- Análisis completo con GPT-4
- Análisis de sentimientos
- Detección de intenciones
- Generación de resúmenes y sugerencias

#### ⚡ **OptimizedAnalysisService**
- Análisis híbrido (local + IA)
- Cache inteligente para reducir costos
- Reglas locales para casos comunes
- Fallback a OpenAI para casos complejos

#### 📊 **DynamicMetricsService**
- Generación de métricas dinámicas
- Análisis de patrones de datos
- Identificación de oportunidades de negocio
- Insights automáticos basados en datos

## 🔐 Configuración de Variables de Entorno

### 🔑 **Variables Requeridas**

```env
# OpenAI (Opcional - para análisis IA)
VITE_OPENAI_API_KEY=sk-...

# Supabase (Opcional - para almacenamiento)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Configuración general
VITE_ENVIRONMENT=production|development
```

### ⚙️ **Configuración Avanzada**

```env
# Límites de archivos
VITE_MAX_FILE_SIZE_MB=25
VITE_SUPPORTED_FORMATS=.xlsx,.xls,.csv

# Configuración de IA
VITE_AI_MODEL=gpt-4-turbo-preview
VITE_ENABLE_LOCAL_ANALYSIS=true
VITE_CACHE_DURATION_HOURS=24
```

## 📊 Métricas y Analytics

### 📈 **Métricas Principales**
- Total de conversaciones procesadas
- Tasa de conversión real
- Tiempo promedio de respuesta
- Satisfacción del cliente
- Análisis por agente/vendedor

### 🔍 **Métricas Avanzadas**
- Potencial de ventas por conversación
- Análisis de sentimientos
- Detección de intenciones
- Oportunidades perdidas
- Patrones de comportamiento

### 📊 **Visualizaciones**
- Gráficos de tendencias temporales
- Distribución por estados
- Heatmaps de actividad
- Análisis comparativo por períodos

## 🌐 Despliegue

### 🚀 **Netlify (Recomendado)**

1. **Build para producción**
```bash
npm run build
```

2. **Despliegue automático**
- Conecta tu repositorio a Netlify
- Configura las variables de entorno
- Deploy automático en cada push

### 🐳 **Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### ☁️ **Vercel**

```json
{
  "builds": [
    {
      "src": "dist/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🧪 Testing

### 🔬 **Tests Unitarios**
```bash
npm run test          # Ejecuta todos los tests
npm run test:watch    # Modo watch para desarrollo
npm run test:coverage # Genera reporte de cobertura
```

### 🎯 **Tests E2E**
```bash
npm run test:e2e      # Tests end-to-end
```

### 📊 **Cobertura de Tests**
- Casos de uso: 85%+
- Servicios: 80%+
- Componentes: 75%+
- Utilidades: 90%+

## 🤝 Contribución

### 📋 **Proceso de Contribución**

1. **Fork del repositorio**
2. **Crea una rama feature**
```bash
git checkout -b feature/nueva-funcionalidad
```

3. **Realiza tus cambios**
4. **Ejecuta los tests**
```bash
npm run test
npm run lint
```

5. **Commit con formato convencional**
```bash
git commit -m "feat: añade nueva funcionalidad de análisis"
```

6. **Push y Pull Request**

### 🎨 **Estilo de Código**

- **ESLint**: Configuración estricta con reglas de React
- **Prettier**: Formateo automático del código
- **TypeScript**: Tipado estricto en todo el proyecto
- **Conventional Commits**: Formato estándar para commits

### 🧩 **Arquitectura de Contribución**

- **Domain Layer**: Añadir nuevas entidades o reglas de negocio
- **Application Layer**: Implementar nuevos casos de uso
- **Infrastructure Layer**: Integrar nuevos servicios externos
- **Presentation Layer**: Crear nuevos componentes UI

## 🐛 Solución de Problemas

### ❓ **Problemas Comunes**

#### 🔥 **El archivo no se procesa**
- Verifica que el archivo sea .xlsx, .xls o .csv
- Asegúrate de que tenga al menos las columnas básicas
- Revisa que el tamaño no exceda 25MB

#### 🤖 **Error de API de OpenAI**
- Verifica tu `VITE_OPENAI_API_KEY`
- Confirma que tienes créditos disponibles
- El sistema funciona sin IA (métricas básicas)

#### ☁️ **Error de Supabase**
- Verifica las credenciales de Supabase
- Confirma que el bucket existe
- El sistema funciona sin almacenamiento cloud

#### 📱 **Problemas de rendimiento**
- Reduce el tamaño del archivo Excel
- Desactiva el análisis IA para archivos grandes
- Usa el modo optimizado para mejor performance

### 🔍 **Logs y Debug**

```bash
# Modo debug
VITE_DEBUG=true npm run dev

# Logs de desarrollo
console.log disponibles en el navegador
```

## 📝 Changelog

### 🚀 **v2.0.0 - Latest**
- ✅ Arquitectura Clean Architecture completa
- ✅ Integración con Supabase Storage
- ✅ Sistema de análisis IA optimizado
- ✅ Dashboard dinámico con métricas inteligentes
- ✅ Exportación avanzada a PDF/Excel
- ✅ Tabla interactiva con filtros avanzados
- ✅ Sistema de cache para reducir costos IA
- ✅ Responsive design completo
- ✅ Testing coverage >80%

### 📊 **v1.0.0**
- ✅ Procesamiento básico de Excel
- ✅ Métricas fundamentales
- ✅ Integración básica con OpenAI
- ✅ Dashboard inicial

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: [Tu Nombre]
- **Arquitectura**: Clean Architecture + TypeScript
- **Frontend**: React 19 + Vite + TailwindCSS
- **IA**: OpenAI GPT-4 + Análisis local optimizado
- **Backend**: Supabase + Zustand

## 🙏 Agradecimientos

- **OpenAI** por la API de análisis inteligente
- **Supabase** por el backend as a service
- **React Team** por React 19 y las nuevas funcionalidades
- **Vite** por la experiencia de desarrollo increíble
- **Comunidad Open Source** por las librerías utilizadas

---

<div align="center">

**🌟 Si este proyecto te ha sido útil, por favor considera darle una estrella ⭐**

[📊 Demo Live](https://tu-demo-url.netlify.app) | [📧 Soporte](mailto:tu-email@example.com) | [🐛 Issues](https://github.com/tuusuario/web-analisis-wsp/issues)

</div> 