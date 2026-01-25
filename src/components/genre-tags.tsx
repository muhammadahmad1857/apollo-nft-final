'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const genres = [
  { id: 1, name: 'Electronic', icon: '🎛️' },
  { id: 2, name: 'Hip-Hop', icon: '🎤' },
  { id: 3, name: 'Ambient', icon: '🌌' },
  { id: 4, name: 'Experimental', icon: '⚡' },
  { id: 5, name: 'Classical', icon: '🎻' },
  { id: 6, name: 'House', icon: '🏠' },
]

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

export default function GenreTags() {
  const [active, setActive] = useState(1)

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Trending Categories</h2>
            <p className="text-muted-foreground mt-2">12.4 APLs available</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex flex-wrap gap-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {genres.map((genre) => (
            <motion.button
              key={genre.id}
              variants={itemVariants}
              onClick={() => setActive(genre.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                active === genre.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <motion.span
                animate={active === genre.id ? { rotate: 360, scale: 1.2 } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                {genre.icon}
              </motion.span>
              {genre.name}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
