'use client'

import { Play } from 'lucide-react'
import { easeOut, motion } from 'framer-motion'

const tracks = [
  {
    id: 1,
    title: 'Chill Vibes',
    artist: 'Luna Sky',
    plays: '5.4K APL',
    color: 'from-blue-500/30 to-cyan-500/30',
  },
  {
    id: 2,
    title: 'Cosmic Jazz',
    artist: 'Marco Synthesizer',
    plays: '5.8K APL',
    color: 'from-purple-500/30 to-pink-500/30',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOut,
    },
  },
}

export default function TrendingTracks() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          Trending Tracks
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${track.color} border border-border p-8 hover:border-accent transition-all duration-300 cursor-pointer`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <motion.h3 
                      className="text-2xl font-bold"
                      whileHover={{ x: 5 }}
                    >
                      {track.title}
                    </motion.h3>
                    <p className="text-muted-foreground">{track.artist}</p>
                  </div>
                  <motion.button 
                    className="p-3 rounded-full bg-accent text-accent-foreground hover:shadow-lg"
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play className="fill-current" size={24} />
                  </motion.button>
                </div>

                <motion.div 
                  className="pt-6 border-t border-border/50"
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">{track.plays}</p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
