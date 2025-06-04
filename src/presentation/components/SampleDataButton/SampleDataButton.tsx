import React from 'react'
import { useAppStore } from '@/presentation/store/useAppStore'
import type { Conversation } from '@/domain/entities/Conversation'

const SampleDataButton: React.FC = () => {
  const { setConversations } = useAppStore()

  const generateSampleData = (): Conversation[] => {
    const sampleConversations: Omit<Conversation, 'id'>[] = [
      {
        customerName: 'Nacho Rimini',
        customerPhone: '5493413796554',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
        status: 'pending',
        totalMessages: 3,
        lastMessage: 'Hola! Vi que estuviste interesado en nuestros productos. ¿Te gustaría que te cuente más sobre las opciones disponibles?',
        assignedAgent: undefined,
        tags: [],
        metadata: {
          source: 'whatsapp',
          responseTime: 0,
          satisfaction: undefined,
          totalPurchaseValue: undefined,
          conversionRate: undefined
        },
        aiSummary: undefined,
        aiSuggestion: 'Iniciar conversación proactiva con oferta personalizada',
        interest: 'Productos disponibles',
        salesPotential: 'medium'
      },
      {
        customerName: 'Ana García',
        customerPhone: '3462080939',
        startDate: new Date('2024-01-14'),
        endDate: new Date('2024-01-14'),
        status: 'pending',
        totalMessages: 2,
        lastMessage: 'Buenos días, quisiera información sobre precios y stock disponible',
        assignedAgent: undefined,
        tags: [],
        metadata: {
          source: 'whatsapp',
          responseTime: 0,
          satisfaction: undefined,
          totalPurchaseValue: undefined,
          conversionRate: undefined
        },
        aiSummary: undefined,
        aiSuggestion: 'Enviar lista de precios actualizada y verificar stock',
        interest: 'Consulta de precios',
        salesPotential: 'high'
      },
      {
        customerName: 'Carlos Mendez',
        customerPhone: '5491134567890',
        startDate: new Date('2024-01-13'),
        endDate: new Date('2024-01-14'),
        status: 'active',
        totalMessages: 8,
        lastMessage: 'Perfecto, me interesa. ¿Podemos agendar una llamada para cerrar la compra?',
        assignedAgent: 'María López',
        tags: ['urgente', 'compra'],
        metadata: {
          source: 'whatsapp',
          responseTime: 15,
          satisfaction: 5,
          totalPurchaseValue: 2500,
          conversionRate: undefined
        },
        aiSummary: 'Cliente muy interesado en realizar compra inmediata, solicita llamada para cerrar',
        aiSuggestion: 'Agendar llamada urgente para cerrar venta antes de fin de semana',
        interest: 'Intención de compra',
        salesPotential: 'high'
      },
      {
        customerName: 'Laura Fernández',
        customerPhone: '5491167890123',
        startDate: new Date('2024-01-12'),
        endDate: new Date('2024-01-13'),
        status: 'completed',
        totalMessages: 12,
        lastMessage: 'Excelente servicio, muchas gracias! Ya realicé la transferencia.',
        assignedAgent: 'Juan Pérez',
        tags: ['venta', 'satisfecho'],
        metadata: {
          source: 'whatsapp',
          responseTime: 8,
          satisfaction: 5,
          totalPurchaseValue: 1800,
          conversionRate: 1
        },
        aiSummary: 'Venta completada exitosamente, cliente muy satisfecho con el servicio',
        aiSuggestion: 'Solicitar reseña y ofrecer productos complementarios para futuras compras',
        interest: 'Compra realizada',
        salesPotential: 'high'
      },
      {
        customerName: 'Roberto Silva',
        customerPhone: '5491145678901',
        startDate: new Date('2024-01-11'),
        endDate: undefined,
        status: 'abandoned',
        totalMessages: 4,
        lastMessage: 'Gracias por la info, voy a pensarlo y te aviso',
        assignedAgent: 'Ana Torres',
        tags: ['seguimiento'],
        metadata: {
          source: 'whatsapp',
          responseTime: 45,
          satisfaction: 3,
          totalPurchaseValue: undefined,
          conversionRate: undefined
        },
        aiSummary: 'Cliente mostró interés inicial pero no respondió, posible pérdida por precio',
        aiSuggestion: 'Contactar con descuento especial u oferta limitada en el tiempo',
        interest: 'Evaluando opciones',
        salesPotential: 'low'
      },
      {
        customerName: 'Patricia Gómez',
        customerPhone: '5491123456789',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-11'),
        status: 'active',
        totalMessages: 6,
        lastMessage: 'Necesito ayuda con el producto que compré, no funciona correctamente',
        assignedAgent: 'Carlos Ruiz',
        tags: ['soporte', 'problema'],
        metadata: {
          source: 'whatsapp',
          responseTime: 20,
          satisfaction: 2,
          totalPurchaseValue: 950,
          conversionRate: undefined
        },
        aiSummary: 'Cliente requiere soporte técnico urgente, producto con fallas',
        aiSuggestion: 'Brindar soporte inmediato y ofrecer reemplazo o reembolso si es necesario',
        interest: 'Soporte técnico',
        salesPotential: 'medium'
      },
      {
        customerName: 'Miguel Rodríguez',
        customerPhone: '5491198765432',
        startDate: new Date('2024-01-09'),
        endDate: new Date('2024-01-10'),
        status: 'completed',
        totalMessages: 9,
        lastMessage: 'Todo perfecto, el producto llegó en tiempo y forma. ¡Recomendaré!',
        assignedAgent: 'Sofía Martínez',
        tags: ['venta', 'satisfecho', 'referido'],
        metadata: {
          source: 'whatsapp',
          responseTime: 12,
          satisfaction: 5,
          totalPurchaseValue: 3200,
          conversionRate: 1
        },
        aiSummary: 'Venta exitosa, cliente muy satisfecho, potencial para generar referidos',
        aiSuggestion: 'Solicitar testimonial y implementar programa de referidos',
        interest: 'Compra completada',
        salesPotential: 'high'
      },
      {
        customerName: 'Luciana Castro',
        customerPhone: '5491187654321',
        startDate: new Date('2024-01-08'),
        endDate: undefined,
        status: 'pending',
        totalMessages: 1,
        lastMessage: 'No se ha iniciado conversación',
        assignedAgent: undefined,
        tags: [],
        metadata: {
          source: 'whatsapp',
          responseTime: 0,
          satisfaction: undefined,
          totalPurchaseValue: undefined,
          conversionRate: undefined
        },
        aiSummary: undefined,
        aiSuggestion: 'Iniciar conversación con mensaje de bienvenida personalizado',
        interest: 'No identificado',
        salesPotential: 'medium'
      }
    ]

    // Generar IDs únicos
    return sampleConversations.map((conv, index) => ({
      ...conv,
      id: `sample_${Date.now()}_${index}`
    }))
  }

  const handleLoadSampleData = () => {
    const sampleData = generateSampleData()
    setConversations(sampleData)
    console.log('📊 Datos de muestra cargados:', sampleData.length, 'conversaciones')
  }

  return (
    <button
      onClick={handleLoadSampleData}
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        margin: '16px auto'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
      }}
      title="Cargar datos de ejemplo para probar la funcionalidad"
    >
      🎯 Cargar Datos de Muestra
    </button>
  )
}

export default SampleDataButton 