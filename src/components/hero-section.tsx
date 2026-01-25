'use client'

import { Button } from '@/components/ui/button'
import { Music, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {easeOut,easeInOut} from "framer-motion"
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

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8, x: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 1,
      ease: easeOut,
    },
  },
}

const floatingVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: easeInOut,
    },
  },
}

export default function HeroSection() {
  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Left Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <motion.div 
              className="inline-block px-4 py-2 bg-muted rounded-full text-sm font-medium"
              variants={itemVariants}
            >
              🎵 Music NFT Platform
            </motion.div>

            <motion.h1 
              className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight"
              variants={itemVariants}
            >
              Where Music Lives <span className="text-accent">On-Chain</span>
            </motion.h1>

            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground"
              variants={itemVariants}
            >
              Discover, collect, and trade music NFTs using Apollo currency. Own a piece of your favorite artists&a legacy.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                  <Music className="mr-2" size={20} />
                  Explore Music
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-muted bg-transparent transition-all">
                  <Play className="mr-2" size={20} />
                  Upload Track
                </Button>
              </motion.div>
            </motion.div>

            <motion.div 
              className="pt-8 border-t border-border"
              variants={itemVariants}
            >
              <div className="grid grid-cols-2 gap-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="text-sm text-muted-foreground">Music NFTs Listed</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-2xl font-bold">$2.5M</p>
                  <p className="text-sm text-muted-foreground">Total Volume Traded</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image */}
          <motion.div 
            className="relative h-96 sm:h-[500px] flex items-center justify-center"
            variants={imageVariants}
          >
            <motion.div
              animate="animate"
              variants={floatingVariants}
              className="relative w-full h-full max-w-md"
            >
              <Image
                src="/hero-vinyl.png"
                alt="Music NFT Vinyl Records"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
