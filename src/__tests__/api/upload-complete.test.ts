import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── vi.hoisted ensures these exist before vi.mock hoists ──────────────────────
const { mockFileUpdate, mockNFTUpdate } = vi.hoisted(() => ({
  mockFileUpdate: vi.fn(),
  mockNFTUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    file: { update: mockFileUpdate },
    nFT: { update: mockNFTUpdate },
  },
}));

import { POST } from "@/app/api/upload/complete/route";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/complete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when fileId is missing", async () => {
    const res = await POST(makeReq({ ipfsUrl: "ipfs://abc" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/fileId/);
  });

  it("returns 400 when ipfsUrl is missing", async () => {
    const res = await POST(makeReq({ fileId: "file-1" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/ipfsUrl/);
  });

  it("returns 400 when both are missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("marks file COMPLETED and patches MAIN media + readiness", async () => {
    mockFileUpdate.mockResolvedValue({ nftId: "nft-1", role: "MAIN" });
    mockNFTUpdate.mockResolvedValue({});

    const res = await POST(makeReq({ fileId: "file-1", ipfsUrl: "ipfs://cid1" }));

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);

    expect(mockFileUpdate).toHaveBeenCalledWith({
      where: { id: "file-1" },
      data: {
        ipfsUrl: "ipfs://cid1",
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
        failureReason: null,
      },
      select: { nftId: true, role: true },
    });

    expect(mockNFTUpdate).toHaveBeenCalledWith({
      where: { id: "nft-1" },
      data: { mediaUrl: "ipfs://cid1", readinessStatus: "READY" },
    });
  });

  it("patches imageUrl for COVER role", async () => {
    mockFileUpdate.mockResolvedValue({ nftId: "nft-2", role: "COVER" });
    mockNFTUpdate.mockResolvedValue({});

    await POST(makeReq({ fileId: "file-2", ipfsUrl: "ipfs://cover" }));

    expect(mockNFTUpdate).toHaveBeenCalledWith({
      where: { id: "nft-2" },
      data: { imageUrl: "ipfs://cover" },
    });
  });

  it("patches trailer for TRAILER role", async () => {
    mockFileUpdate.mockResolvedValue({ nftId: "nft-3", role: "TRAILER" });
    mockNFTUpdate.mockResolvedValue({});

    await POST(makeReq({ fileId: "file-3", ipfsUrl: "ipfs://trailer" }));

    expect(mockNFTUpdate).toHaveBeenCalledWith({
      where: { id: "nft-3" },
      data: { trailer: "ipfs://trailer" },
    });
  });

  it("does not touch nFT table when file has no nftId", async () => {
    mockFileUpdate.mockResolvedValue({ nftId: null, role: "MAIN" });

    await POST(makeReq({ fileId: "file-4", ipfsUrl: "ipfs://xyz" }));

    expect(mockNFTUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected DB error", async () => {
    mockFileUpdate.mockRejectedValue(new Error("DB timeout"));

    const res = await POST(makeReq({ fileId: "file-5", ipfsUrl: "ipfs://abc" }));
    expect(res.status).toBe(500);
  });
});
