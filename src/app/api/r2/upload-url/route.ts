import { NextRequest, NextResponse } from "next/server";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildR2ObjectPath,
  getR2AccessKeyId,
  getR2AccountId,
  getR2BucketName,
  getR2PublicUrl,
  getR2SecretAccessKey,
  R2_MULTIPART_CHUNK_BYTES,
  R2_MAX_UPLOAD_BYTES,
} from "@/lib/r2/config";

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${getR2AccountId()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getR2AccessKeyId(),
      secretAccessKey: getR2SecretAccessKey(),
    },
    forcePathStyle: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "initiate" | "sign-part" | "complete" | "abort";
      filename?: string;
      kind?: "video" | "trailer";
      contentType?: string;
      fileSize?: number;
      uploadId?: string;
      key?: string;
      partNumber?: number;
      parts?: Array<{ etag: string; partNumber: number }>;
    };

    const bucket = getR2BucketName();

    if (body.action === "abort") {
      if (!body.uploadId || !body.key) {
        return NextResponse.json({ error: "uploadId and key are required" }, { status: 400 });
      }

      await createR2Client().send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: body.key,
          UploadId: body.uploadId,
        })
      );

      return NextResponse.json({ ok: true });
    }

    if (body.action === "complete") {
      if (!body.uploadId || !body.key || !Array.isArray(body.parts) || body.parts.length === 0) {
        return NextResponse.json(
          { error: "uploadId, key, and parts are required" },
          { status: 400 }
        );
      }

      const completion = await createR2Client().send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: body.key,
          UploadId: body.uploadId,
          MultipartUpload: {
            Parts: body.parts
              .map((part) => ({ ETag: part.etag, PartNumber: part.partNumber }))
              .sort((left, right) => (left.PartNumber ?? 0) - (right.PartNumber ?? 0)),
          },
        })
      );

      return NextResponse.json({
        ok: true,
        publicUrl: getR2PublicUrl(body.key),
        etag: completion.ETag,
      });
    }

    if (body.action === "sign-part") {
      if (!body.key || !body.uploadId || typeof body.partNumber !== "number") {
        return NextResponse.json(
          { error: "key, uploadId, and partNumber are required" },
          { status: 400 }
        );
      }

      const uploadUrl = await getSignedUrl(
        createR2Client(),
        new UploadPartCommand({
          Bucket: bucket,
          Key: body.key,
          UploadId: body.uploadId,
          PartNumber: body.partNumber,
        }),
        { expiresIn: 60 * 10 }
      );

      return NextResponse.json({ uploadUrl });
    }

    if (body.action !== "initiate" && body.action !== undefined) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    if (!body.filename || !body.kind) {
      return NextResponse.json({ error: "filename and kind are required" }, { status: 400 });
    }

    if (typeof body.fileSize === "number" && body.fileSize > R2_MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Cloudflare R2 uploads are limited to 15GB" },
        { status: 400 }
      );
    }

    const key = buildR2ObjectPath(body.kind, body.filename);
    const contentType = body.contentType || "application/octet-stream";

    const multipart = await createR2Client().send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      })
    );

    if (!multipart.UploadId) {
      return NextResponse.json({ error: "Failed to initiate multipart upload" }, { status: 502 });
    }

    return NextResponse.json({
      bucket,
      key,
      uploadId: multipart.UploadId,
      partSize: R2_MULTIPART_CHUNK_BYTES,
      publicUrl: getR2PublicUrl(key),
    });
  } catch (error) {
    console.error("[r2 upload-url]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}