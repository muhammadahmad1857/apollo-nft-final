'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Moon, Sun, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import MobileSidebar from './sidebar/mobile-sidebar'
import Logo from './Logo'

export default function Header() {
  const { resolvedTheme:theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    { label: 'Marketplace', href: '#' },
    { label: 'Artists', href: '#' },
    { label: 'Docs', href: '#' },
    { label: 'Royalties', href: '#' },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <Logo/>
            {/* <motion.h1 
              className="text-xl font-bold tracking-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              Apollo NFT
            </motion.h1> */}
          </motion.div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item, idx) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="text-sm text-primary transition-all hover:text-primary-foreground! hover:bg-primary/80 p-2 rounded-lg"
                // initial={{ opacity: 0, y: -10 }}
                // animate={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6, delay: idx * 0.1 }}
                // whileHover={{ scale: 1.1, color: 'var(--primary)/30' }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={sidebarOpen ? { rotate: 90 } : { rotate: 0 }}
            >
              <Menu size={20} />
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.1, rotate: 20 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </div>
      </header>

      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        navItems={navItems}
      />
    </>
  )
}
