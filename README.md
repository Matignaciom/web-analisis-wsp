# 📊 Web Análisis WSP - Plataforma de Análisis Comercial WhatsApp

Una aplicación web moderna y completamente **responsive** para analizar conversaciones de WhatsApp con inteligencia artificial. Construida con **React + TypeScript** siguiendo principios de **Clean Architecture** y **SOLID**.

## 🚀 Características Principales

### ✅ **Funcionalidades Implementadas**
- **Análisis de Sentimientos con IA**: Detecta emociones en conversaciones (-1 a +1)
- **Análisis de Intenciones**: Identifica propósitos del cliente (compra, queja, consulta, etc.)
- **Procesamiento Inteligente de Excel**: Extrae datos automáticamente con mapeo flexible
- **Dashboard Dinámico**: Métricas en tiempo real con visualización moderna
- **Análisis por Lotes**: Procesa múltiples conversaciones optimizando costos de API
- **Storage en la Nube**: Integración con Supabase para archivos Excel

### 💫 **UX/UI Moderna y Responsive**
- **Diseño completamente responsive**: Se adapta a desktop, tablet y móvil
- **Animaciones fluidas**: Loading states y transiciones suaves
- **Interfaz moderna**: Glass morphism y gradientes
- **Sistema de notificaciones**: Feedback visual en tiempo real

### 🏗️ **Arquitectura Robusta**
- **Clean Architecture**: Separación clara de responsabilidades
- **Principios SOLID**: Código mantenible y escalable
- **State Management**: Zustand para estado global eficiente
- **TypeScript**: Tipado fuerte para mayor seguridad

## 🛠️ Tecnologías

### **Frontend Core**
- **React 19** + **TypeScript**
- **Vite** (bundler optimizado)
- **CSS Modules** + **Tailwind CSS**

### **Servicios Externos**
- **OpenAI GPT**: Análisis de conversaciones con IA
- **Supabase**: Storage de archivos y base de datos
- **XLSX/Papa Parse**: Procesamiento de archivos Excel/CSV

### **Estado y Datos**
- **Zustand** (estado global)
- **React Hook Form** (formularios)
- **Framer Motion** (animaciones)

## 📁 Estructura del Proyecto

```
src/
├── domain/                 # 🎯 Lógica de negocio pura
│   ├── entities/          # Modelos de datos
│   │   ├── Conversation.ts
│   │   ├── AnalysisResult.ts
│   │   └── DashboardMetrics.ts
│   └── interfaces/        # Contratos de servicios
│       ├── IConversationRepository.ts
│       ├── IFileProcessor.ts
│       └── IAnalysisService.ts
├── application/           # 🔧 Casos de uso
│   └── usecases/
│       ├── ProcessFileUseCase.ts
│       └── GetDashboardMetricsUseCase.ts
├── infrastructure/        # 🔌 Servicios externos
│   └── services/
│       ├── OpenAIAnalysisService.ts
│       ├── ExcelFileProcessor.ts
│       ├── SupabaseStorageService.ts
│       └── InMemoryConversationRepository.ts
├── presentation/          # 🎨 UI y componentes
│   ├── components/
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── FileUploader/
│   │   └── ExportPage/
│   └── store/
│       └── useAppStore.ts
└── styles/               # Estilos globales
```

## 🔧 Configuración e Instalación

### **1. Prerrequisitos**
- Node.js 18+
- Cuenta de OpenAI
- Proyecto de Supabase

### **2. Instalación**

```bash
# Clonar repositorio
git clone <tu-repositorio>
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
npm run dev
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
-- Política para permitir subida de archivos (usuarios autenticados o anónimos)
CREATE POLICY "Allow file uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'excel-files');

-- Política para permitir lectura de archivos
CREATE POLICY "Allow file downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'excel-files');

-- Política para permitir eliminación de archivos (opcional)
CREATE POLICY "Allow file deletion" ON storage.objects
FOR DELETE USING (bucket_id = 'excel-files');
```

### **3. Configurar CORS (si es necesario)**

Si tienes problemas de CORS, agrega tu dominio en:
**Settings** > **API** > **CORS Origins**

## 📋 Formato de Archivo Excel Esperado

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

### **2. Análisis de Intenciones**
- Consulta de precios (`price_inquiry`)
- Verificación de stock (`stock_check`)
- Intención de compra (`purchase_intent`)
- Queja (`complaint`)
- Soporte técnico (`support`)
- Información general (`general_info`)
- Negociación (`negotiation`)
- Seguimiento (`follow_up`)

### **3. Métricas del Dashboard**
- Total de conversaciones
- Ventas completadas
- Chats abandonados
- Tiempo promedio de respuesta
- Tasa de conversión
- Puntuación de satisfacción

## 🚦 Proceso de Uso

### **1. Preparar Archivo**
- Organiza tus datos en Excel/CSV
- Asegúrate de tener al menos columnas de Cliente y Teléfono
- Usa los nombres de columna reconocidos

### **2. Subir y Procesar**
- Ve a la página "Subir Datos"
- Selecciona tu archivo (se subirá automáticamente a Supabase)
- El sistema validará automáticamente
- Inicia el procesamiento con IA

### **3. Ver Resultados**
- **Dashboard**: Métricas generales y KPIs
- **Conversaciones**: Lista detallada con análisis
- **Exportar**: Descarga reportes en PDF/Excel

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # ESLint
npm run lint:fix     # Corregir ESLint
npm run format       # Prettier
```

## 🔍 Troubleshooting

### **Error: "VITE_OPENAI_API_KEY es requerida"**
- Verifica que el archivo `.env` existe
- Asegúrate de que la clave comience con `sk-`
- Reinicia el servidor de desarrollo

### **Error: "Supabase connection failed"**
- Verifica las credenciales de Supabase en `.env`
- Asegúrate de que el bucket `excel-files` existe
- Revisa las políticas RLS configuradas

### **Error: "Formato no soportado"**
- Usa archivos .xlsx, .xls o .csv
- Verifica que el archivo no esté corrupto
- Máximo 25MB de tamaño

### **Análisis Incompleto**
- Revisa créditos de OpenAI en tu cuenta
- Verifica conexión a internet
- Considera usar GPT-3.5 si hay problemas de presupuesto

## 📈 Próximas Funcionalidades

- [ ] Base de datos persistente con Supabase Database
- [ ] Sistema de autenticación de usuarios
- [ ] API REST para integración externa
- [ ] Análisis de tendencias temporales
- [ ] Alertas automáticas por sentimientos negativos
- [ ] Integración directa con WhatsApp Business API
- [ ] Dashboard con gráficos interactivos avanzados

## 💡 Consejos de Uso

1. **Empieza con GPT-3.5** para pruebas iniciales
2. **Procesa en lotes pequeños** (50-100 conversaciones) inicialmente
3. **Revisa los primeros resultados** para ajustar prompts si es necesario
4. **Mantén archivos organizados** con nombres consistentes
5. **Monitorea el consumo de API** en tu dashboard de OpenAI
6. **Aprovecha Supabase Storage** para mantener historial de archivos

## 🤝 Soporte

Si tienes problemas:
1. Revisa este README completo
2. Verifica la configuración del archivo `.env`
3. Consulta los logs del navegador (F12 > Console)
4. Verifica tu saldo en OpenAI Platform
5. Revisa la configuración de Supabase

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
