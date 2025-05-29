import React from 'react'
import { motion } from 'framer-motion'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'white'
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'primary',
  text,
  className = ''
}) => {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1
      }
    },
    end: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const circleVariants = {
    start: {
      y: '0%'
    },
    end: {
      y: '100%'
    }
  }

  const circleTransition = {
    duration: 0.4,
    ease: 'easeInOut',
    repeat: Infinity,
    repeatType: 'reverse' as const
  }

  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      <motion.div
        className={`${styles.spinner} ${styles[variant]}`}
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={styles.circle}
            variants={circleVariants}
            transition={circleTransition}
          />
        ))}
      </motion.div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )
}

export default LoadingSpinner 