/**
 * Server-only background upload utilities.
 *
 * Runs inside Next.js Node.js runtime (not Edge). Called via `after()` from
 * the chunk upload route so execution continues even after the browser tab closes.
 */
import fs from "fs/promises";
import path from "path";
import os from "os";
import { db } from "./prisma";
import { NftReadinessStatus, FileUploadStatus, FileRole } from "@/generated/prisma/enums";

const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export function getTempRoot() {
  return path.join(process.env.UPLOAD_TEMP_DIR || os.tmpdir(), "nft-chunks");
}

export function getChunkDir(fileId: string) {
  return path.join(getTempRoot(), fileId);
}

export interface UploadManifest {
  totalChunks: number;
  filename: string;
  mimeType: string;
  walletAddress: string;
  role: FileRole;
  fileSize: number;
  receivedChunks: number[];
}

export async function readManifest(fileId: string): Promise<UploadManifest> {
  const manifestPath = path.join(getChunkDir(fileId), "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(raw) as UploadManifest;
}

export async function writeManifest(fileId: string, manifest: UploadManifest) {
  const dir = getChunkDir(fileId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest),
    "utf-8"
  );
}

/** Combine all chunk files into a contiguous Buffer. */
async function assembleChunks(fileId: string, totalChunks: number): Promise<Buffer> {
  const dir = getChunkDir(fileId);
  const buffers: Buffer[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunkFile = path.join(dir, `chunk-${String(i).padStart(6, "0")}`);
    buffers.push(await fs.readFile(chunkFile));
  }
  return Buffer.concat(buffers);
}

/** Update the media/image/trailer columns on the NFT row for a given role. */
async function patchNFTMediaField(
  nftId: number,
  role: FileRole,
  ipfsUrl: string
) {
  if (role === FileRole.MAIN) {
    await db.nFT.update({ where: { id: nftId }, data: { mediaUrl: ipfsUrl } });
  } else if (role === FileRole.COVER) {
    await db.nFT.update({ where: { id: nftId }, data: { imageUrl: ipfsUrl } });
  } else if (role === FileRole.TRAILER) {
    await db.nFT.update({ where: { id: nftId }, data: { trailer: ipfsUrl } });
  }
}

/** Check whether all required uploads for an NFT are done and flip readiness. */
async function tryFlipNFTReady(nftId: number) {
  const incomplete = await db.file.findMany({
    where: {
      nftId,
      role: FileRole.MAIN, // cover + trailer are optional
      uploadStatus: { not: FileUploadStatus.COMPLETED },
    },
    select: { id: true },
  });

  if (incomplete.length === 0) {
    await db.nFT.update({
      where: { id: nftId },
      data: { readinessStatus: NftReadinessStatus.READY },
    });
  }
}

/**
 * Core function executed in the background via `after()`.
 * Reads assembled chunks → uploads to Pinata → updates DB.
 */
export async function runBackgroundUpload(fileId: string): Promise<void> {
  const chunkDir = getChunkDir(fileId);

  try {
    // Mark as uploading
    await db.file.update({
      where: { id: fileId },
      data: { uploadStatus: FileUploadStatus.UPLOADING, uploadProgress: 5 },
    });

    const manifest = await readManifest(fileId);

    // Assemble file in memory
    await db.file.update({
      where: { id: fileId },
      data: { uploadProgress: 20 },
    });

    const fileBuffer = await assembleChunks(fileId, manifest.totalChunks);

    await db.file.update({
      where: { id: fileId },
      data: { uploadProgress: 40 },
    });

    // Upload to Pinata
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: manifest.mimeType || "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", blob, manifest.filename);
    formData.append("network", "public");

    const pinataRes = await fetch(PINATA_PIN_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!pinataRes.ok) {
      throw new Error(`Pinata upload failed (${pinataRes.status}): ${await pinataRes.text()}`);
    }

    const pinataJson = (await pinataRes.json()) as { IpfsHash?: string };
    const ipfsHash = pinataJson.IpfsHash;

    if (!ipfsHash) {
      throw new Error("Pinata returned no IPFS hash");
    }

    const ipfsUrl = `ipfs://${ipfsHash}`;

    // Update File record
    await db.file.update({
      where: { id: fileId },
      data: {
        ipfsUrl,
        isMinted: false,
        uploadStatus: FileUploadStatus.COMPLETED,
        uploadProgress: 100,
        failureReason: null,
      },
    });

    // Patch NFT media fields and check readiness
    const file = await db.file.findUnique({
      where: { id: fileId },
      select: { nftId: true, role: true },
    });

    if (file?.nftId) {
      await patchNFTMediaField(file.nftId, file.role as FileRole, ipfsUrl);
      await tryFlipNFTReady(file.nftId);
    }

    // Clean up temp chunks
    await fs.rm(chunkDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`[backgroundUpload] Failed for fileId=${fileId}:`, error);
    await db.file
      .update({
        where: { id: fileId },
        data: {
          uploadStatus: FileUploadStatus.FAILED,
          failureReason:
            error instanceof Error ? error.message : "Unknown error",
        },
      })
      .catch(() => undefined);
  }
}
