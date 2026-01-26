'use client'

import { Music, Github, Twitter, Instagram, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

export default function Footer() {
  return (
    <footer className="px-4 sm:px-6 border-t border-border lg:px-8 py-12 bg-background text-primary">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          {/* Brand */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Music className="w-6 h-6" />
            <span className="font-bold text-lg">Apollo NFT</span>
          </motion.div>

          {/* Copyright */}
          <motion.div 
            className="text-sm opacity-75 text-center sm:text-right"
            variants={itemVariants}
          >
            © {new Date().getFullYear()} Apollo NFT. Built on Apollo Chain.
          </motion.div>

          {/* Social Links */}
          <motion.div 
            className="flex gap-3"
            variants={itemVariants}
          >
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  aria-label={social.label}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon size={18} />
                </motion.a>
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
