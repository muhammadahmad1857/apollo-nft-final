// src/app/api/convert-and-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import sharp from "sharp";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// Global reusable FFmpeg instance
const ffmpeg = new FFmpeg();

export async function POST(req: NextRequest) {
  try {
    // Load FFmpeg WASM only once
    if (!ffmpeg.loaded) {
      console.log("[FFmpeg] Loading WASM...");
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
        // log: true,  // uncomment for more debug output
      });
      console.log("[FFmpeg] Loaded successfully");
    }

    const formData = await req.formData();
    const uploadedFile = formData.get("file") as File | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = uploadedFile.name;
    const mimeType = uploadedFile.type;
    const ext = path.extname(originalName).toLowerCase();

    // Buffer → Uint8Array for ffmpeg.writeFile
    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const inputData = new Uint8Array(buffer);

    // Temp disk setup
    const tmpDir = os.tmpdir();
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpPath = path.join(tmpDir, `upload-${uniqueSuffix}${ext}`);

    await fs.writeFile(tmpPath, buffer);

    let finalPath = tmpPath;
    let fileType = mimeType || (ext ? `file/${ext.slice(1)}` : "application/octet-stream");

    // ────────────────────────────────────────────────
    // Conversion logic
    // ────────────────────────────────────────────────
    if (mimeType.startsWith("video/")) {
      finalPath = tmpPath + ".mp4";

      const inputName = `input${ext}`;
      const outputName = "output.mp4";

      await ffmpeg.writeFile(inputName, inputData);

      const exitCode = await ffmpeg.exec(["-i", inputName, "-c", "copy", outputName]);

      if (exitCode !== 0) {
        throw new Error(`FFmpeg video exec failed (code ${exitCode})`);
      }

      const outputUint8 = await ffmpeg.readFile(outputName);
      await fs.writeFile(finalPath, Buffer.from(outputUint8));

      fileType = "video/mp4";

      // Cleanup virtual FS – use deleteFile
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    } 
    else if (mimeType.startsWith("audio/")) {
      finalPath = tmpPath + ".mp3";

      const inputName = `input${ext}`;
      const outputName = "output.mp3";

      await ffmpeg.writeFile(inputName, inputData);

      const exitCode = await ffmpeg.exec([
        "-i", inputName,
        "-c:a", "libmp3lame",
        "-b:a", "128k",
        outputName
      ]);

      if (exitCode !== 0) {
        throw new Error(`FFmpeg audio exec failed (code ${exitCode})`);
      }

      const outputUint8 = await ffmpeg.readFile(outputName);
      await fs.writeFile(finalPath, Buffer.from(outputUint8));

      fileType = "audio/mp3";

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    } 
    else if (mimeType.startsWith("image/")) {
      finalPath = tmpPath + ".jpg";
      await sharp(tmpPath)
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(finalPath);
      fileType = "image/jpeg";
    }

    // ────────────────────────────────────────────────
    // Pinata upload
    // ────────────────────────────────────────────────
    const pinataForm = new FormData();
    const fileContent = await fs.readFile(finalPath);
    pinataForm.append("file", new Blob([fileContent]), path.basename(finalPath));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pinata upload failed: ${res.status} – ${errText}`);
    }

    const json = await res.json();
    const ipfsHash = json.IpfsHash;

    // Disk cleanup
    await fs.unlink(tmpPath).catch(() => {});
    if (finalPath !== tmpPath) {
      await fs.unlink(finalPath).catch(() => {});
    }

    return NextResponse.json({ ipfsHash, fileType });
  } catch (err) {
    console.error("[Upload Error]", err);
    const message = err instanceof Error ? err.message : "Conversion or upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

