# Fix R2 video URL (remove pinata-videos prefix)

## Root cause (confirmed)

`NEXT_PUBLIC_R2_PUBLIC_URL` is set to `https://storage.apollonft.io/pinata-videos` but the custom domain serves objects at the bucket root.

- **Broken:** `https://storage.apollonft.io/pinata-videos/videos/{file}.mp4` → `NS_BINDING_ABORTED`
- **Working:** `https://storage.apollonft.io/videos/{file}.mp4`

Object keys in R2 are already `videos/...` ([`buildR2ObjectPath`](src/lib/r2/config.ts)); only the public base URL is wrong.

## Implementation (minimal)

### 1. [`src/lib/r2/config.ts`](src/lib/r2/config.ts)

- In `getR2PublicBaseUrl()`, strip trailing `/pinata-videos` from env value so new uploads get correct URLs even if Vercel env is stale.
- Add `normalizeR2MediaUrl(url)` to rewrite stored URLs: `/pinata-videos/videos/` → `/videos/` (and trailers).

### 2. [`src/lib/ipfs.ts`](src/lib/ipfs.ts)

- After IPFS resolution, call `normalizeR2MediaUrl(url)` so playback fixes existing metadata/DB URLs without migration.

### 3. Vercel env (manual)

Set:

```env
NEXT_PUBLIC_R2_PUBLIC_URL=https://storage.apollonft.io
```

(no `/pinata-videos`, no trailing slash). Redeploy after change.

## Success criteria

- New uploads: `getR2PublicUrl("videos/...")` → `https://storage.apollonft.io/videos/...`
- Existing NFTs with old `media` URL play in Firefox without Network failure
- `curl -I` on normalized URL returns 200/206 with non-zero length

## Out of scope

- Same-origin proxy / WAF (not needed once URL is correct)
- DB bulk update (normalize on read is enough)
