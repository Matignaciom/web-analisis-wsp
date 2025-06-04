import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getEstimatedCost, getModelComparison, AnalysisServiceFactory } from '@/infrastructure/services/AnalysisServiceFactory'
import { config } from '@/config/environment'
import styles from './CostOptimization.module.css'

interface CostOptimizationProps {
  conversationCount: number
  className?: string
}

const CostOptimization: React.FC<CostOptimizationProps> = ({
  conversationCount,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const serviceInfo = AnalysisServiceFactory.getServiceInfo()
  const costInfo = getEstimatedCost(conversationCount)
  const modelComparison = getModelComparison(conversationCount)

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'GRATIS'
    if (amount < 0.01) return `$${(amount * 100).toFixed(3)}¢`
    return `$${amount.toFixed(4)} USD`
  }

  const getOptimizationTips = () => {
    const tips = []
    
    if (!config.analysis.costOptimization.useLocalAnalysis) {
      tips.push('💡 Habilita VITE_USE_LOCAL_ANALYSIS=true para 70% menos costos')
    }
    
    if (!config.openai.localAnalysis.cacheResults) {
      tips.push('💡 Habilita VITE_CACHE_ANALYSIS=true para evitar re-análisis')
    }
    
    if (!config.openai.batchAnalysis.enabled) {
      tips.push('💡 Habilita VITE_ENABLE_BATCH_ANALYSIS=true para análisis eficiente')
    }
    
    if (config.openai.model !== 'gpt-4o-mini') {
      tips.push(`💡 Cambia a gpt-4o-mini para 90% menos costos (actual: ${config.openai.model})`)
    }
    
    return tips
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header compacto siempre visible */}
      <div 
        className={styles.compactHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerLeft}>
          <h3 className={styles.compactTitle}>💰 Optimización de Costos IA</h3>
          <div className={styles.compactInfo}>
            <span className={styles.badge}>
              {serviceInfo.type === 'local-only' && '🏠 Solo Local'}
              {serviceInfo.type === 'optimized' && '⚡ Híbrido Optimizado'}
              {serviceInfo.type === 'standard' && '🤖 IA Estándar'}
            </span>
            <span className={styles.costSummary}>
              Costo: <strong className={styles.cost}>{formatCurrency(costInfo.cost)}</strong>
            </span>
            <span className={styles.savingsSummary}>
              Ahorro: <strong className={styles.savings}>{serviceInfo.estimatedCostReduction}</strong>
            </span>
          </div>
        </div>
        <div className={styles.expandButton}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.currentConfig}>
            <div className={styles.configCard}>
              <h4>📊 Configuración Actual</h4>
              <div className={styles.configDetails}>
                <div className={styles.configItem}>
                  <span>Modelo:</span>
                  <strong>{serviceInfo.model}</strong>
                </div>
                <div className={styles.configItem}>
                  <span>Costo para {conversationCount} conversaciones:</span>
                  <strong className={styles.cost}>{formatCurrency(costInfo.cost)}</strong>
                </div>
                <div className={styles.configItem}>
                  <span>Ahorro estimado:</span>
                  <strong className={styles.savings}>{serviceInfo.estimatedCostReduction}</strong>
                </div>
              </div>
            </div>

            {serviceInfo.type === 'optimized' && costInfo.breakdown && (
              <div className={styles.breakdownCard}>
                <h4>🔧 Optimizaciones Activas</h4>
                <ul className={styles.optimizationList}>
                  {Object.entries(costInfo.breakdown).map(([key, value]) => (
                    <li key={key}>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.comparison}>
            <h4>📈 Comparación de Modelos</h4>
            <div className={styles.comparisonGrid}>
              {modelComparison.map((model) => (
                <div
                  key={model.name}
                  className={`${styles.modelCard} ${model.recommended ? styles.recommended : ''}`}
                >
                  <div className={styles.modelHeader}>
                    <span className={styles.modelName}>{model.description}</span>
                    {model.recommended && <span className={styles.recommendedBadge}>✨ Recomendado</span>}
                  </div>
                  <div className={styles.modelCost}>
                    {formatCurrency(model.totalCost)}
                  </div>
                  <div className={styles.modelSavings}>
                    {model.savingsVsGPT4} ahorro vs GPT-4
                  </div>
                </div>
              ))}
            </div>
          </div>

          {getOptimizationTips().length > 0 && (
            <div className={styles.tips}>
              <h4>💡 Consejos de Optimización</h4>
              <ul className={styles.tipsList}>
                {getOptimizationTips().map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.features}>
            <h4>🚀 Características Activas</h4>
            <div className={styles.featureGrid}>
              {serviceInfo.features.map((feature, index) => (
                <div key={index} className={styles.feature}>
                  ✅ {feature}
                </div>
              ))}
            </div>
          </div>

          {conversationCount > 5000 && (
            <div className={styles.enterpriseNote}>
              <h4>🏢 Para Grandes Volúmenes</h4>
              <p>
                Con {conversationCount.toLocaleString()} conversaciones, considera:
              </p>
              <ul>
                <li>🔄 Procesamiento en background para mejor UX</li>
                <li>📊 Cache persistente para resultados críticos</li>
                <li>⚡ Análisis incremental para nuevos datos</li>
                <li>🎯 Reglas locales personalizadas para tu negocio</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CostOptimization 