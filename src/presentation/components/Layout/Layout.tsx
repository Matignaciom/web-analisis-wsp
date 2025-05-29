import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'Análisis WhatsApp' }) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{title}</h1>
          <nav className={styles.nav}>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/upload" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Cargar Datos
            </NavLink>
            <NavLink 
              to="/conversations" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Conversaciones
            </NavLink>
            <NavLink 
              to="/export" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Exportar
            </NavLink>
          </nav>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; 2025 Análisis Comercial WhatsApp</p>
      </footer>
    </div>
  )
}

export default Layout 