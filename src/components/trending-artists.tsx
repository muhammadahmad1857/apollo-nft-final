'use client'

import { easeOut, motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getTrendingSellers } from '@/actions/users'

interface ArtistData {
  id: number
  name: string
  earnings: string
  tracks: string
  image: string
}

// Skeleton Loader Component
function ArtistSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300">
      {/* Cover Image Skeleton */}
      <div className="relative h-48 overflow-hidden bg-muted animate-pulse" />

      {/* Artist Info Skeleton */}
      <div className="p-6">
        <div className="h-7 bg-muted rounded animate-pulse mb-2 w-2/3" />
        <div className="h-4 bg-muted rounded animate-pulse mb-4 w-1/2" />

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
        </div>

        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

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
  const [artists, setArtists] = useState<ArtistData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const sellers = await getTrendingSellers(2)
        
        const mappedArtists: ArtistData[] = sellers.map((seller) => ({
          id: seller.id,
          name: seller.name || 'Unknown Artist',
          earnings: `${seller.totalLikes || 0} Likes`,
          tracks: `${seller.nftCount || 0} NFTs`,
          image: seller.image || '/placeholder.svg',
        }))
        
        setArtists(mappedArtists)
      } catch (error) {
        console.error('Error fetching trending sellers:', error)
        setArtists([])
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [])

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 ">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          Trending Sellers
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {loading ? (
            <>
              <ArtistSkeleton />
              <ArtistSkeleton />
            </>
          ) : (
            artists.map((artist) => (
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
            ))
          )}
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
            Browse All
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
