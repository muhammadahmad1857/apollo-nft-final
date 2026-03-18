import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/pinata/signed-upload-url/route";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/pinata/signed-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PINATA_SIGNED_URL = "https://uploads.pinata.cloud/v3/files?X-Algorithm=HMAC256&signed=abc";

function mockPinataOk() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: PINATA_SIGNED_URL }),
  });
}

describe("POST /api/pinata/signed-upload-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PINATA_JWT = "test-jwt";
  });

  it("returns 400 when filename is missing", async () => {
    const res = await POST(makeReq({ fileSize: 1024, mimeType: "audio/mpeg" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/filename/i);
  });

  it("returns 400 when filename is empty string", async () => {
    const res = await POST(makeReq({ filename: "", fileSize: 1024 }));
    expect(res.status).toBe(400);
  });

  it("returns 413 when file exceeds 10 GB", async () => {
    const elevenGB = 11 * 1024 * 1024 * 1024;
    const res = await POST(makeReq({ filename: "big.mp4", fileSize: elevenGB }));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.maxBytes).toBeDefined();
  });

  it("returns 400 for invalid (zero) file size", async () => {
    const res = await POST(makeReq({ filename: "track.mp3", fileSize: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 415 for unsupported mime type", async () => {
    const res = await POST(
      makeReq({ filename: "malware.exe", mimeType: "application/x-msdownload", fileSize: 1024 })
    );
    expect(res.status).toBe(415);
  });

  it("allows audio/* mime types", async () => {
    mockPinataOk();
    const res = await POST(
      makeReq({ filename: "track.flac", mimeType: "audio/flac", fileSize: 50 * 1024 * 1024 })
    );
    expect(res.status).toBe(200);
  });

  it("allows video/* mime types", async () => {
    mockPinataOk();
    const res = await POST(
      makeReq({ filename: "movie.mp4", mimeType: "video/mp4", fileSize: 1 * 1024 * 1024 * 1024 })
    );
    expect(res.status).toBe(200);
  });

  it("allows image/* mime types", async () => {
    mockPinataOk();
    const res = await POST(
      makeReq({ filename: "cover.jpg", mimeType: "image/jpeg", fileSize: 2 * 1024 * 1024 })
    );
    expect(res.status).toBe(200);
  });

  it("returns signed URL from Pinata on success", async () => {
    mockPinataOk();
    const res = await POST(
      makeReq({ filename: "track.mp3", mimeType: "audio/mpeg", fileSize: 10 * 1024 * 1024 })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(PINATA_SIGNED_URL);
    expect(body.expiresAt).toBeTypeOf("number");
  });

  it("calls Pinata with Authorization header", async () => {
    mockPinataOk();
    await POST(makeReq({ filename: "track.mp3", fileSize: 1024 }));
    expect(mockFetch).toHaveBeenCalledWith(
      "https://uploads.pinata.cloud/v3/files/sign",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
        }),
      })
    );
  });

  it("returns 500 when Pinata rejects the request", async () => {
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve("Unauthorized") });
    const res = await POST(makeReq({ filename: "track.mp3", fileSize: 1024 }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/signed URL/i);
  });

  it("returns 500 when Pinata response has no url field", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });
    const res = await POST(makeReq({ filename: "track.mp3", fileSize: 1024 }));
    expect(res.status).toBe(500);
  });

  it("uses fileSize for max_file_size in Pinata payload", async () => {
    mockPinataOk();
    const fileSize = 5 * 1024 * 1024 * 1024; // 5 GB
    await POST(makeReq({ filename: "big-video.mp4", mimeType: "video/mp4", fileSize }));
    const call = mockFetch.mock.calls[0];
    const payload = JSON.parse(call[1].body);
    expect(payload.max_file_size).toBe(fileSize);
  });
});
