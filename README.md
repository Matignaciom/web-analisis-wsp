# 📊 Análisis Inteligente de Conversaciones WhatsApp

Una plataforma web moderna que utiliza inteligencia artificial para analizar conversaciones de WhatsApp desde archivos Excel, proporcionando insights profundos sobre métricas de rendimiento, análisis de clientes y optimización de ventas.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

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

## 🔧 **Instalación y Configuración**

### 📋 **Requisitos Previos:**
- **Node.js**: Versión 18 o superior
- **NPM**: Incluido con Node.js
- **Navegador moderno**: Chrome, Firefox, Safari, Edge

### 🚀 **Instalación Paso a Paso:**

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/web-analisis-wsp.git

# 2. Navegar al directorio
cd web-analisis-wsp

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env con tu API key de OpenAI si quieres usar IA

# 5. Ejecutar en desarrollo
npm run dev

# 6. Abrir en navegador
# http://localhost:5173
```

### ⚙️ **Configuración Opcional de IA:**

```env
# .env (opcional - para funciones de IA avanzadas)
VITE_OPENAI_API_KEY=tu-api-key-aqui
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_USE_LOCAL_ANALYSIS=true
```

**Nota**: El sistema funciona completamente **sin configuración de IA**, usando análisis local inteligente.

## 🎯 **Flujo de Trabajo Completo**

### 📋 **Proceso Típico de Uso:**

1. **📁 Preparar Excel** con conversaciones de WhatsApp
2. **📤 Subir archivo** a la plataforma
3. **⏳ Esperar procesamiento** (automático, 10-30 segundos)
4. **📊 Revisar métricas** principales en el dashboard
5. **🔬 Analizar métricas avanzadas** con información detallada
6. **📋 Explorar tabla** de conversaciones individuales
7. **🔍 Aplicar filtros** según necesidades (potencial, estado, etc.)
8. **🎯 Revisar sugerencias** de IA para cada conversación
9. **📤 Exportar resultados** en formato deseado
10. **🔄 Repetir** con nuevos datos o análisis diferentes

### ⏱️ **Tiempos Estimados:**
- **Subida**: 5-15 segundos (según tamaño)
- **Procesamiento**: 10-30 segundos (según complejidad)
- **Análisis**: Instantáneo (métricas en tiempo real)
- **Exportación**: 5-10 segundos (según formato)

## 🎯 **Casos de Uso Principales**

### 🏢 **Para Equipos de Ventas:**
- **Priorizar leads** por potencial de conversión
- **Identificar oportunidades** perdidas o abandonadas
- **Optimizar seguimiento** con sugerencias específicas
- **Medir rendimiento** de agentes individuales

### 📊 **Para Gerentes y Directores:**
- **Métricas de conversión** en tiempo real
- **Análisis de tendencias** de negocio
- **Reportes ejecutivos** automatizados
- **Identificación de problemas** en el funnel de ventas

### 🎯 **Para Equipos de Marketing:**
- **Análisis de efectividad** de campañas
- **Identificación de intereses** más comunes
- **Optimización de mensajes** basada en respuestas
- **Segmentación de audiencias** por comportamiento

### 🛠️ **Para Equipos de Soporte:**
- **Identificación de problemas** recurrentes
- **Priorización de casos** por urgencia
- **Análisis de satisfacción** del cliente
- **Optimización de procesos** de atención

---

<div align="center">

**📊 Análisis Inteligente de Conversaciones WhatsApp**

*Transforma tus datos de WhatsApp en insights accionables con IA*

[![Análisis Inteligente](https://img.shields.io/badge/Análisis-Inteligente-blue?style=for-the-badge&logo=brain)]()
[![Excel Flexible](https://img.shields.io/badge/Excel-Cualquier%20Formato-green?style=for-the-badge&logo=microsoft-excel)]()
[![Sin Configuración](https://img.shields.io/badge/Setup-Sin%20Configuración-orange?style=for-the-badge&logo=rocket)]()

**🚀 Sube tu Excel → 📊 Obtén Métricas → 🎯 Optimiza Ventas**

</div> 