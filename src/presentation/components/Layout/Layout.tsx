import React from 'react'
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
            <a href="#dashboard" className={styles.navLink}>Dashboard</a>
            <a href="#upload" className={styles.navLink}>Cargar Datos</a>
            <a href="#conversations" className={styles.navLink}>Conversaciones</a>
            <a href="#export" className={styles.navLink}>Exportar</a>
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