"use client";

import { motion } from "framer-motion";

const PageHeading = ({title,description}:{
  title?:string | undefined
  description?:string | undefined
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center px-6"
    >
      <h1 className="text-3xl font-semibold relative inline-block">
        {title || "All Public NFTs"}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"
        />
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        {description || "Discover the latest NFTs minted and added to Marketplace."}
      </p>
    </motion.div>
  );
};

export default PageHeading;
