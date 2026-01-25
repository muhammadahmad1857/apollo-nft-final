'use client'

import { Button } from '@/components/ui/button'
import { Heart, Music } from 'lucide-react'
import { easeOut, motion } from 'framer-motion'

const artists = [
  {
    id: 1,
    name: 'DJ NOVA',
    earnings: '1.0M APL VOLUME',
    followers: '2,534',
  },
  {
    id: 2,
    name: 'DJ NOVA',
    earnings: '1.0M APL VOLUME',
    followers: '2,534',
  },
  {
    id: 3,
    name: 'DJ NEVA',
    earnings: '1.0M APL',
    followers: '2,534',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: easeOut,
    },
  },
}

export default function TrendingArtists() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          Trending Artists
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {artists.map((artist) => (
            <motion.div
              key={artist.id}
              variants={itemVariants}
              whileHover={{ y: -12 }}
              className="rounded-xl bg-primary text-primary-foreground p-8 group hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div 
                  className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Music className="w-10 h-10 opacity-50" />
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  {artist.name}
                </motion.h3>
                <p className="text-primary-foreground/75 text-sm mt-2">{artist.earnings}</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary-foreground/20">
                <motion.div 
                  className="flex items-center justify-between text-sm"
                  whileHover={{ x: 5 }}
                >
                  <span className="opacity-75">Followers</span>
                  <span className="font-bold">{artist.followers}</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-all">
                    <Heart className="mr-2" size={18} />
                    Follow
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
