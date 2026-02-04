'use client'

import { easeOut, motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const artists = [
  {
    id: 1,
    name: 'DJ NOVA',
    earnings: '1.0M APL VOLUME',
    tracks: '2,534 Tracks',
    image: '/artist-1.png',
  },
  {
    id: 2,
    name: 'DJ NOVA',
    earnings: '1.0M APL VOLUME',
    tracks: '2,534 Tracks',
    image: '/artist-2.png',
  },
  {
    id: 3,
    name: 'DJ NEVA',
    earnings: '1.0M APL VOLUME',
    tracks: '2,534 Tracks',
    image: '/artist-3.png',
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

export default function TrendingArtists() {
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
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <Image
                  src={artist.image || "/placeholder.svg"}
                  alt={artist.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Artist Info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-1">{artist.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{artist.earnings}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-semibold">{artist.tracks}</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => console.log(`Viewing ${artist.name}`)}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-between group/btn hover:bg-primary/90 transition-colors duration-300"
                  whileTap={{ scale: 0.98 }}
                >
                  See His Work
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight size={18} />
                  </motion.div>
                </motion.button>
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
            Browse All Artists
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
