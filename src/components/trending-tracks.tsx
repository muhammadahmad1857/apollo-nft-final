'use client'

import { ArrowRight, Play } from 'lucide-react'
import { easeOut, motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'

const tracks = [
  {
    id: 1,
    title: 'Chill Vibes',
    artist: 'Luna Sky',
    price: '5.4K APL',
    image: '/track-1.png',
  },
  {
    id: 2,
    title: 'Cosmic Jazz',
    artist: 'Marco Synthesizer',
    price: '5.8K APL',
    image: '/track-2.png',
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

export default function TrendingTracks({isRecent}:{isRecent:boolean}) {
  const [playingId, setPlayingId] = useState<number | null>(null)

  const handlePlay = (id: number) => {
    setPlayingId(id)
    setTimeout(() => setPlayingId(null), 2000)
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          {isRecent ? "Recent" : "Trending"} NFTs
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl border border-border transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <Image
                  src={track.image || "/placeholder.svg"}
                  alt={track.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />

                {/* Play Button Overlay */}
                <button
                  onClick={() => handlePlay(track.id)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="p-4 rounded-full bg-primary/90 backdrop-blur-sm"
                    animate={playingId === track.id ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Play className="fill-primary-foreground text-primary-foreground" size={32} />
                  </motion.div>
                </button>

                {/* Music Icon Animation on Click */}
                {playingId === track.id && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 0.8 }}
                  >
                    <div className="text-4xl">♪</div>
                  </motion.div>
                )}
              </div>

              {/* Track Info */}
              <div className="p-6 bg-background border-t border-border">
                <h3 className="text-xl font-bold mb-1">{track.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{track.artist}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-semibold">{track.price}</p>
                  </div>
                  <motion.button
                    onClick={() => handlePlay(track.id)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium transition-all duration-300"
                    whileTap={{ scale: 0.95 }}
                  >
                    Play
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
         <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
                    <Link href="/marketplace">
          
          <motion.button
            onClick={() => console.log('Browse all tracks')}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors duration-300"
            whileHover={{ gap: 12 }}
            whileTap={{ scale: 0.95 }}
          >
            Browse All NFTs
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight size={20} />
            </motion.div>
          </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
