'use client'

import { Zap, Sparkle, ShoppingBasket } from 'lucide-react'
import { easeOut, motion } from 'framer-motion'

const steps = [
  {
    id: 1,
    title: 'Mint NFT',
    description: 'Create and mint your own NFTs with custom metadata and royalty settings',
    icon: Sparkle,
  },
  {
    id: 2,
    title: 'List for Auction or Marketplace',
    description: 'List your NFTs for auction with bidding or sell directly on the marketplace',
    icon: ShoppingBasket,
  },
  {
    id: 3,
    title: 'All Set',
    description: 'Start earning, trading, and unlocking exclusive perks from your collection',
    icon: Zap,
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

export default function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 text-primary-foreground">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 className="text-4xl text-primary sm:text-5xl font-bold mb-4" variants={itemVariants}>
            How It Works
          </motion.h2>
          <motion.p className="text-lg sm:text-xl text-primary/80" variants={itemVariants}>
            Three simple steps to start your Amazing NFT journey
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-primary-foreground/30" />

          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div 
                key={step.id} 
                className="relative"
                variants={itemVariants}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="glass-card border-white/20 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    className="mb-6 p-4 bg-primary/10 rounded-full"
                    whileHover={{ rotate: 10 }}
                  >
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-primary-foreground/80">{step.description}</p>
                </motion.div>

                {/* Step number badge */}
                <motion.div
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold text-lg border-4 border-primary"
                  whileHover={{ scale: 1.2 }}
                >
                  {idx + 1}
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
