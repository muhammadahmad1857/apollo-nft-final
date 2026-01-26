"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FADE_DOWN_ANIMATION_VARIANTS } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { FileData } from "@/types";

export default function FilesPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // Dummy data for development
      const dummyFiles: FileData[] = [
        {
          id: "1",
          created_at: new Date().toISOString(),
          wallet_id: address,
          ipfsUrl: "ipfs://dummy1",
          type: ".mp3",
          isMinted: false,
          filename: "track1.mp3",
        },
        {
          id: "2",
          created_at: new Date().toISOString(),
          wallet_id: address,
          ipfsUrl: "ipfs://dummy2",
          type: ".png",
          isMinted: true,
          filename: "cover1.png",
        },
      ];
      setFiles(dummyFiles);
      setLoading(false);
    };

    if (isConnected) {
      fetchFiles();
    }
  }, [address, isConnected]);

  const truncate = (str: string, n: number) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        
       <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center px-6"
    >
      <h1 className="text-3xl font-semibold relative inline-block">
        My Files
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-cyan-400 to-blue-500"
        />
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Browse and manage your audio files
      </p>
    </motion.div>
        {!isConnected ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                Please connect your wallet to see your files.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center h-96 flex flex-col items-center justify-center">
            <p className="text-xl">You haven&apos;t uploaded any files yet.</p>
          </div>
        ) : (
          <motion.div
            variants={FADE_DOWN_ANIMATION_VARIANTS}
            initial="hidden"
            animate="show"
            transition={{
              delay: 0.1,
              duration: 0.5,
              ease: "easeInOut",
            }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IPFS URL</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      {file.filename || truncate(file.id, 20)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${file.ipfsUrl.replace(
                          "ipfs://",
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-500 hover:underline"
                      >
                        {truncate(file.ipfsUrl, 40)}
                      </a>
                    </TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {file.isMinted ? (
                        <Badge>Minted</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/files/${file.id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </div>
  );
}