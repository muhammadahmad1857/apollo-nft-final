# Apollo NFT — Minting Guide

## Overview

Apollo supports two minting modes:

- **Single Mint** — one file, one NFT
- **Batch Mint** — one file, multiple identical copies (set a quantity)

Both support files up to **15 GB**. Video uploads go to Cloudflare R2; other media uses Pinata. Finish uploading your file on the mint form, then mint in one flow.

---

## Single Mint

### Step 1 — Connect Your Wallet

Make sure your wallet is connected before you begin. The Mint button stays disabled until a wallet is detected.

### Step 2 — Upload Your File

Go to **Dashboard → Mint** and drop or select your file.

- Supported formats: audio, video, image, PDF, Word, Markdown, text
- Maximum size: **15 GB**
- Large **video** uploads use multipart R2 upload with resume: if upload stops, return to the page and select the **same file** to continue

### Step 3 — Fill in the Metadata

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Display name of the NFT |
| Title | Yes | Title of the content |
| Description | Yes | Short description of your NFT |
| Cover Image | No | Thumbnail/cover art |
| Trailer | No | Short preview clip (video → R2) |
| Royalty % | Yes | Default is 5% |

**You cannot mint until Name, Title, Description are filled and the main file upload has finished.**

### Step 4 — Mint

Click **Mint NFT**, approve the wallet transaction. Metadata JSON is pinned to IPFS, then your NFT is minted on-chain.

---

## Batch Mint

Go to **Dashboard → Batch Mint** to mint multiple identical copies of the same NFT in one transaction.

### Step 1 — Upload Your File

Same as single mint. Drop or select your file and wait for upload to complete.

### Step 2 — Fill in the Metadata

Same required fields: **Name, Title, and Description**. Cover image and trailer are optional.

### Step 3 — Set Quantity & Royalty

- **Quantity** — how many copies to mint (whole number ≥ 1)
- **Royalty %** — applied to all copies on secondary sales (default 5%)

The estimated total cost is shown in the mint summary before you confirm.

### Step 4 — Mint

Once the upload completes, click **Mint N NFTs**. One wallet transaction mints all copies at once.

---

## Upload tips (large videos)

- Stay on the page while uploading when possible; leaving during upload shows a **Stay / Leave** warning.
- If upload is interrupted, an **Incomplete upload** banner appears — select the **same file** to resume.
- Do not close the browser mid-upload unless necessary; R2 resume requires picking the same file again.

---

## Frequently Asked Questions

**Can I close the browser while uploading?**
You can, but the in-browser upload stops. For R2 videos, come back and select the **same file** to resume from saved progress.

**Is the cover image required?**
No. Cover image and trailer are both optional for single and batch mint.

**For batch mint, does each copy get the same metadata?**
Yes. All copies share the same metadata URI. Quantity controls how many on-chain tokens point to it.

**When does the royalty apply?**
The royalty percentage is set at mint time and applies to secondary sales of that NFT (or all copies in a batch).
