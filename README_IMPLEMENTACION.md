# 📊 Web Análisis WSP - Implementación OpenAI

## 🚀 ¿Qué se ha implementado?

### ✅ Servicios Principales
1. **OpenAI Analysis Service** - Análisis de conversaciones con IA
2. **Excel File Processor** - Procesamiento automático de archivos Excel/CSV
3. **In-Memory Repository** - Almacenamiento temporal de conversaciones
4. **Dashboard Metrics** - Métricas dinámicas en tiempo real

### 🎯 Funcionalidades Nuevas
- **Análisis de Sentimientos**: Detecta emociones en conversaciones (-1 a +1)
- **Análisis de Intenciones**: Identifica propósitos del cliente (compra, queja, consulta, etc.)
- **Procesamiento Inteligente**: Extrae datos automáticamente de Excel con mapeo flexible
- **Dashboard Dinámico**: Métricas en tiempo real con visualización moderna
- **Análisis por Lotes**: Procesa múltiples conversaciones optimizando costos de API

## 🔧 Configuración Requerida

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```bash
# OpenAI Configuration (REQUERIDO - REEMPLAZA con tu API key real)
VITE_OPENAI_API_KEY=sk-TU-CLAVE-DE-OPENAI-AQUI
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=800
VITE_OPENAI_TEMPERATURE=0.3

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

### 2. Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Crea una nueva API key
4. Copia la clave que comienza con `sk-`
5. Pégala en tu archivo `.env`

### 3. Instalar Dependencias

```bash
npm install openai
```

## 💰 Costos y Modelos Recomendados

### 🎯 Opciones por Presupuesto

#### Opción Económica: GPT-3.5 Turbo (Recomendado para empezar)
```bash
VITE_OPENAI_MODEL=gpt-3.5-turbo
```
- **Costo**: ~$0.002 por 1K tokens
- **Ideal para**: Análisis básico, presupuestos limitados
- **Capacidad**: Análisis de sentimientos e intenciones simples

#### Opción Balanceada: GPT-4 Turbo
```bash
VITE_OPENAI_MODEL=gpt-4-turbo-preview
```
- **Costo**: ~$0.01 por 1K tokens de entrada, ~$0.03 por 1K tokens de salida
- **Ideal para**: Análisis profesional, insights detallados
- **Capacidad**: Análisis avanzado con recomendaciones estratégicas

#### Opción Premium: GPT-4
```bash
VITE_OPENAI_MODEL=gpt-4
```
- **Costo**: ~$0.03 por 1K tokens de entrada, ~$0.06 por 1K tokens de salida
- **Ideal para**: Análisis de máxima precisión

### 💡 Estimación de Costos
- **100 conversaciones** con GPT-3.5: ~$0.50-1.00 USD
- **100 conversaciones** con GPT-4 Turbo: ~$2.00-4.00 USD
- **1000 conversaciones** con GPT-4 Turbo: ~$20.00-40.00 USD

## 📋 Formato de Archivo Excel Esperado

### Columnas Reconocidas Automáticamente

El sistema detecta estas columnas usando nombres en **español** e **inglés**:

| Campo | Nombres Reconocidos |
|-------|-------------------|
| **Cliente** | cliente, customer_name, name, nombre, usuario |
| **Teléfono** | telefono, phone, numero, whatsapp, celular |
| **Fecha** | fecha, date, fecha_inicio, start_date, timestamp |
| **Estado** | estado, status, estado_conversacion |
| **Mensajes** | mensajes, messages, total_messages, cantidad_mensajes |
| **Último Mensaje** | ultimo_mensaje, last_message, mensaje_final |
| **Agente** | agente, agent, vendedor, assigned_agent |

### Ejemplo de Archivo Excel

```
| Cliente        | Teléfono     | Fecha      | Estado      | Mensajes | Último Mensaje        | Agente |
|---------------|--------------|------------|-------------|----------|--------------------- |--------|
| Juan Pérez    | +52555123456 | 2024-01-15 | completado  | 12       | Gracias por la compra | Ana    |
| María García  | +52555789012 | 2024-01-16 | pendiente   | 3        | ¿Tienen disponible?   | Luis   |
| Pedro López   | +52555345678 | 2024-01-17 | abandonado  | 7        | Muy caro             |        |
```

### Estados Válidos
- `activo` / `active`
- `completado` / `completed` / `finalizado`
- `abandonado` / `abandoned`
- `pendiente` / `pending`

## 🎛️ Funcionalidades del Sistema

### 1. Análisis de Sentimientos
- **Puntuación**: -1 (muy negativo) a +1 (muy positivo)
- **Etiquetas**: very_negative, negative, neutral, positive, very_positive
- **Palabras clave**: Términos que influyeron en el análisis

### 2. Análisis de Intenciones
- **Consulta de precios** (`price_inquiry`)
- **Verificación de stock** (`stock_check`)
- **Intención de compra** (`purchase_intent`)
- **Queja** (`complaint`)
- **Soporte técnico** (`support`)
- **Información general** (`general_info`)
- **Negociación** (`negotiation`)
- **Seguimiento** (`follow_up`)

### 3. Métricas del Dashboard
- Total de conversaciones
- Ventas completadas
- Chats abandonados
- Tiempo promedio de respuesta
- Tasa de conversión
- Puntuación de satisfacción

## 🚦 Proceso de Uso

### 1. Preparar Archivo
- Organiza tus datos en Excel/CSV
- Asegúrate de tener al menos columnas de Cliente y Teléfono
- Usa los nombres de columna reconocidos

### 2. Subir y Procesar
- Ve a la sección "Subir Datos"
- Selecciona tu archivo
- El sistema validará automáticamente
- Inicia el procesamiento con IA

### 3. Ver Resultados
- **Dashboard**: Métricas generales y KPIs
- **Conversaciones**: Lista detallada con análisis
- **Exportar**: Descarga reportes (próximamente)

## 🛠️ Optimizaciones Implementadas

### 1. Procesamiento por Lotes
- Procesa máximo 3 conversaciones simultáneamente (configuración económica)
- Pausas automáticas para evitar límites de API
- Manejo de errores sin interrumpir el proceso completo

### 2. Análisis de Fallback
- Si OpenAI falla, genera análisis básico automáticamente
- Garantiza que siempre tengas datos procesados
- Indica claramente qué requiere revisión manual

### 3. Mapeo Inteligente de Columnas
- Detecta automáticamente nombres de columnas en español/inglés
- Flexible con diferentes formatos de Excel
- Parseo automático de fechas y números

### 4. Validación Robusta
- Valida archivos antes del procesamiento
- Detecta errores por fila con mensajes específicos
- Resumen detallado de procesamiento

## 🔍 Troubleshooting

### Error: "VITE_OPENAI_API_KEY es requerida"
- Verifica que el archivo `.env` existe
- Asegúrate de que la clave comience con `sk-`
- Reinicia el servidor de desarrollo

### Error: "Formato no soportado"
- Usa archivos .xlsx, .xls o .csv
- Verifica que el archivo no esté corrupto
- Máximo 25MB de tamaño

### Error: "No se pudo parsear la fecha"
- Usa formatos: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
- Verifica que las fechas sean válidas
- Excel debe tener fechas en formato correcto

### Análisis Incompleto
- Revisa créditos de OpenAI en tu cuenta
- Verifica conexión a internet
- Considera usar GPT-3.5 si hay problemas de presupuesto

## 📈 Próximas Funcionalidades

- [ ] Exportación a Excel/PDF con análisis completo
- [ ] Base de datos persistente (PostgreSQL/MongoDB)
- [ ] API REST para integración externa
- [ ] Análisis de tendencias temporales
- [ ] Alertas automáticas por sentimientos negativos
- [ ] Integración directa con WhatsApp Business API
- [ ] Dashboard con gráficos interactivos (Chart.js/D3.js)
- [ ] Sistema de usuarios y permisos

## 💡 Consejos de Uso

1. **Empieza con GPT-3.5** para pruebas iniciales
2. **Procesa en lotes pequeños** (50-100 conversaciones) inicialmente
3. **Revisa los primeros resultados** para ajustar prompts si es necesario
4. **Mantén archivos organizados** con nombres de columna consistentes
5. **Monitorea el consumo de API** en tu dashboard de OpenAI

## 🤝 Soporte

Si tienes problemas:
1. Revisa este README completo
2. Verifica la configuración del archivo `.env`
3. Consulta los logs del navegador (F12 > Console)
4. Verifica tu saldo en OpenAI Platform 