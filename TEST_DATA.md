# 📊 Datos de Prueba para WhatsApp Analytics

## 📋 Archivo de Prueba Excel

Para probar la aplicación, crea un archivo Excel con las siguientes columnas:

### 🔧 Estructura Recomendada

| Cliente | Teléfono | Fecha | Estado | Mensajes | Último Mensaje | Agente |
|---------|----------|-------|--------|----------|----------------|--------|
| Juan Pérez | +525512345678 | 2024-01-15 | completado | 15 | Gracias por la compra | Maria |
| Ana García | +525587654321 | 2024-01-16 | activo | 8 | ¿Tienen descuentos? | Luis |
| Carlos López | +525555555555 | 2024-01-17 | abandonado | 3 | No responde | Ana |
| Sofia Martínez | +525544556677 | 2024-01-18 | pendiente | 5 | Hola, ¿están abiertos? | - |
| Roberto Sánchez | +525599887766 | 2024-01-19 | completado | 22 | Perfecto, ya recibí el pedido | Maria |

### 📁 Formatos Aceptados
- ✅ Excel (.xlsx, .xls)
- ✅ CSV (.csv)

### 🎯 Columnas Reconocidas Automáticamente

El sistema detecta automáticamente estas variaciones:

**Cliente:**
- Cliente, Customer, Name, Nombre, Usuario

**Teléfono:**
- Teléfono, Phone, Numero, WhatsApp, Celular

**Fecha:**
- Fecha, Date, Fecha_inicio, Start_date, Timestamp

**Estado:**
- Estado, Status, Estado_conversacion
- Valores válidos: `activo`, `completado`, `abandonado`, `pendiente`

**Mensajes:**
- Mensajes, Messages, Total_messages

**Último Mensaje:**
- Último_mensaje, Last_message

**Agente:**
- Agente, Agent, Vendedor

## 🚀 Cómo Crear el Archivo de Prueba

1. **Abre Excel o Google Sheets**
2. **Crea las columnas** con los nombres exactos de la tabla
3. **Agrega los datos de ejemplo** o crea tus propios datos
4. **Guarda como .xlsx**
5. **Sube el archivo** en la aplicación

## ⚡ Datos de Ejemplo Extendidos

Si quieres probar con más datos, aquí tienes más ejemplos:

```
Cliente: María Fernández
Teléfono: +525566778899
Fecha: 2024-01-20
Estado: activo
Mensajes: 12
Último Mensaje: ¿Cuándo llega mi pedido?
Agente: Carlos

Cliente: Diego Ramírez
Teléfono: +525533445566
Fecha: 2024-01-21
Estado: completado
Mensajes: 18
Último Mensaje: Excelente servicio, gracias
Agente: Luis

Cliente: Carmen Vázquez
Teléfono: +525522334455
Fecha: 2024-01-22
Estado: abandonado
Mensajes: 2
Último Mensaje: Muy caro
Agente: Ana
```

## 🔍 Validaciones

La aplicación validará:
- ✅ Campos obligatorios: Cliente y Teléfono
- ✅ Formato de fecha válido
- ✅ Estados permitidos
- ✅ Números de teléfono (formato automático a +52)

## 💡 Tips

- **Usa fechas** en formato DD/MM/YYYY o YYYY-MM-DD
- **Los números de teléfono** se formatean automáticamente
- **Estados en español** funcionan perfectamente
- **Agente puede estar vacío** para algunos registros 