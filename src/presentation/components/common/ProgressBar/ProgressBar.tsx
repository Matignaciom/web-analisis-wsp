import React from 'react'
import { motion } from 'framer-motion'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  progress: number // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  showPercentage?: boolean
  label?: string
  animated?: boolean
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'medium',
  showPercentage = true,
  label,
  animated = true,
  className = ''
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`${styles.container} ${className}`}>
      {(label || showPercentage) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showPercentage && (
            <span className={styles.percentage}>{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      
      <div className={`${styles.track} ${styles[size]}`}>
        <motion.div
          className={`${styles.fill} ${styles[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
        />
        
        {animated && (
          <motion.div
            className={styles.shimmer}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ProgressBar 