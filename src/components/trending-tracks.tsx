'use client'

import { ArrowRight, Play, X } from 'lucide-react'
import { easeOut, motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllNFTs } from '@/actions/nft'
import UniversalMediaViewer from '@/components/ui/UniversalMediaViewer'
import Portal from '@/components/ui/Portal'
import { UniversalMediaIcon } from './ui/UniversalMediaIcon'

interface TrackData {
  id: number
  title: string
  artist: string
  price: number
  image: string
  media: string
  tokenId:number
  fileType:string
}

// Skeleton Loader Component
function TrackSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border transition-all duration-300">
      {/* Cover Image Skeleton */}
      <div className="relative h-48 overflow-hidden bg-muted animate-pulse" />

      {/* Track Info Skeleton */}
      <div className="p-6 bg-background border-t border-border">
        <div className="h-6 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse mb-4 w-2/3" />
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-3 bg-muted rounded animate-pulse mb-2 w-1/2" />
            <div className="h-6 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-20 bg-muted rounded animate-pulse" />
        </div>
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

export default function TrendingTracks({isRecent}:{isRecent:boolean}) {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<TrackData | null>(null)
  const [tracks, setTracks] = useState<TrackData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const nfts = await getAllNFTs(false)
        // Get the 2 most recent listed NFTs
        const recentNFTs = nfts.slice(0, 2)
        console.log("recentNFTs",recentNFTs)

        const mappedTracks: TrackData[] = recentNFTs.map((nft) => ({
          id: nft.id,
          title: nft.title || nft.name || 'Untitled',
          artist: nft.owner?.name || 'Unknown Artist',
          price: nft.mintPrice,
          image: nft.imageUrl || '',
          media:nft.mediaUrl || '',
          tokenId:nft.tokenId,
          fileType:nft.fileType,
        }))
        
        setTracks(mappedTracks)
      } catch (error) {
        console.error('Error fetching tracks:', error)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [])

  const handlePlay = (track: TrackData) => {
    setSelectedTrack(track)
    setPlayingId(track.id)
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20">
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
          // variants={containerVariants}
          // initial="hidden"
          // whileInView="visible"
                  initial={{ opacity: 0, y: 20 }}  // move variants inline
        animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: easeOut }}

          // viewport={{ once: true, amount: 0.3 }}
        >
          {loading ? (
            <>
              <TrackSkeleton />
              <TrackSkeleton />
            </>
          ) : (
            tracks.map((track) => (
              <motion.div
                key={track.id}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border border-border transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                 { track.image?<Image
                    src={track.image.replace("ipfs://",`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs`)}
                    alt={track.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />:<UniversalMediaIcon fileType={track.fileType} uri={track.media}/>}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlay(track)}
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
                      <p className="text-lg font-semibold">{track.price} APOLLO</p>
                    </div>
                    <motion.button
                      onClick={() => handlePlay(track)}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium transition-all duration-300"
                      whileTap={{ scale: 0.95 }}
                    >
                      Play
                    </motion.button>
                  </div>
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

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedTrack && (
          <Portal>
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedTrack(null)
                setPlayingId(null)
              }}
            >
              <div 
                className="relative w-full max-w-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedTrack(null)
                    setPlayingId(null)
                  }}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-50"
                >
                  <X size={28} />
                </button>

                {/* Media Viewer */}
                <div className="bg-background rounded-2xl overflow-hidden border border-border">
                  <UniversalMediaViewer
                    uri={selectedTrack.media}
                    fileType={selectedTrack.fileType}

                    className="w-full"
                  />
                  
                  {/* Track Info Display */}
                  <div className="p-6 border-t border-border">
                    <h3 className="text-2xl font-bold mb-2">{selectedTrack.title}</h3>
                    <p className="text-muted-foreground text-lg mb-4">{selectedTrack.artist}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="text-xl font-semibold">{selectedTrack.price}</p>
                      </div>
                            <Link href={`/marketplace/${selectedTrack.tokenId}`}>
                        <motion.button
                          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                          View Details
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </section>
  )
}
