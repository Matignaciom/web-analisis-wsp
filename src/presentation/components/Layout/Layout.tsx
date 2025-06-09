import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'FB - IA' }) => {
  const location = useLocation()
  
  // Determinar si el Dashboard debe estar activo (en "/" o "/dashboard")
  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard'
  
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandContainer}>
            <h1 className={styles.title}>{title}</h1>
            <img 
              src="/images/Logo_FB_AI.png" 
              alt="FB - IA Logo" 
              className={styles.logo}
            />
          </div>
          <nav className={styles.nav}>
            <NavLink 
              to="/dashboard" 
              className={`${styles.navLink} ${isDashboardActive ? styles.navLinkActive : ''}`}
            >
              Inicio
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
        <p>&copy; {new Date().getFullYear()} Análisis comercial FB</p>
      </footer>
    </div>
  )
}

export default Layout 