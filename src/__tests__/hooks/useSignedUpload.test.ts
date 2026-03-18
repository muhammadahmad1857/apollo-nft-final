// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSignedUpload } from "@/hooks/useSignedUpload";

// ── configurable FakeXHR ──────────────────────────────────────────────────────
type XhrBehavior = "success" | "http-error" | "network-error";
let xhrBehavior: XhrBehavior = "success";

class FakeXHR {
  upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 200;
  statusText = "OK";
  responseText = JSON.stringify({ data: { cid: "QmTestCID" } });

  open = vi.fn();
  abort = vi.fn().mockImplementation(function (this: FakeXHR) {
    Promise.resolve().then(() => this.onabort?.());
  });

  send = vi.fn().mockImplementation(function (this: FakeXHR) {
    Promise.resolve()
      .then(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
      })
      .then(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 } as ProgressEvent);
      })
      .then(() => {
        if (xhrBehavior === "network-error") {
          this.onerror?.();
        } else if (xhrBehavior === "http-error") {
          this.status = 500;
          this.statusText = "Internal Server Error";
          this.onload?.();
        } else {
          this.onload?.();
        }
      });
  });
}

vi.stubGlobal("XMLHttpRequest", FakeXHR);

// ── mock fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── helpers ───────────────────────────────────────────────────────────────────
function mockSuccessFetch() {
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ fileId: "file-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ url: "https://pinata.signed/upload" }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });
}

function makeFile(name = "track.mp3", type = "audio/mpeg") {
  return new File(["hello"], name, { type });
}

describe("useSignedUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    xhrBehavior = "success";
  });

  // ── initial state ─────────────────────────────────────────────────────────
  it("starts in idle state", () => {
    const { result } = renderHook(() => useSignedUpload());
    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.ipfsUrl).toBeNull();
    expect(result.current.fileId).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  // ── happy path ────────────────────────────────────────────────────────────
  it("transitions idle → uploading → completed", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc");
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.progress).toBe(100);
    expect(result.current.ipfsUrl).toBe("ipfs://QmTestCID");
    expect(result.current.fileId).toBe("file-abc");
    expect(result.current.isUploading).toBe(false);
  });

  it("returns the fileId from startUpload", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.startUpload(makeFile(), "MAIN", "0xabc");
    });

    expect(returned).toBe("file-abc");
  });

  // ── endpoint ordering ─────────────────────────────────────────────────────
  it("calls the three API endpoints in the correct order", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile("video.mp4", "video/mp4"), "MAIN", "0xabc");
    });

    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/upload/start", expect.any(Object));
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/pinata/signed-upload-url", expect.any(Object));
    expect(mockFetch).toHaveBeenNthCalledWith(3, "/api/upload/complete", expect.any(Object));
  });

  it("sends correct body to /api/upload/start", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());
    const file = makeFile("clip.mp4", "video/mp4");

    await act(async () => {
      await result.current.startUpload(file, "COVER", "0xDEAD");
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.filename).toBe("clip.mp4");
    expect(body.mimeType).toBe("video/mp4");
    expect(body.role).toBe("COVER");
    expect(body.walletAddress).toBe("0xDEAD");
    expect(body.fileSize).toBe(file.size);
  });

  it("sends fileId and ipfsUrl to /api/upload/complete", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "TRAILER", "0xabc");
    });

    const body = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(body.fileId).toBe("file-abc");
    expect(body.ipfsUrl).toBe("ipfs://QmTestCID");
  });

  // ── progress ──────────────────────────────────────────────────────────────
  it("progress reaches 100 on completed upload", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc");
    });

    expect(result.current.progress).toBe(100);
  });

  it("shows intermediate progress during XHR upload", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    // start without awaiting so we can read intermediate state
    act(() => {
      result.current.startUpload(makeFile(), "MAIN", "0xabc").catch(() => {});
    });

    await waitFor(() => expect(result.current.progress).toBeGreaterThan(0));
  });

  // ── reset ─────────────────────────────────────────────────────────────────
  it("resets all state back to idle", async () => {
    mockSuccessFetch();
    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc");
    });

    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.ipfsUrl).toBeNull();
    expect(result.current.fileId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── error paths ───────────────────────────────────────────────────────────
  it("sets status=failed when /api/upload/start returns non-ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve("Internal Error") });

    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc").catch(() => {});
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBeTruthy();
  });

  it("sets status=failed when /api/pinata/signed-upload-url returns non-ok", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ fileId: "f1" }) })
      .mockResolvedValueOnce({ ok: false, text: () => Promise.resolve("Unauthorized") });

    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc").catch(() => {});
    });

    expect(result.current.status).toBe("failed");
  });

  it("sets status=failed when XHR returns non-2xx status", async () => {
    xhrBehavior = "http-error";

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ fileId: "f1" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ url: "https://pinata/signed" }) });

    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc").catch(() => {});
    });

    expect(result.current.status).toBe("failed");
  });

  it("sets status=failed when XHR onerror fires", async () => {
    xhrBehavior = "network-error";

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ fileId: "f1" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ url: "https://pinata/signed" }) });

    const { result } = renderHook(() => useSignedUpload());

    await act(async () => {
      await result.current.startUpload(makeFile(), "MAIN", "0xabc").catch(() => {});
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toMatch(/network error/i);
  });
});
