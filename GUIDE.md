# Apollo NFT — Minting Guide

## Overview

Apollo supports minting NFTs from files of any size — including large videos and audio files up to **15 GB**. For small files, minting is instant. For large files, you can **queue your mint** and walk away while the upload runs in the background.

---

## How to Mint an NFT

### Step 1 — Connect Your Wallet

Make sure your wallet is connected before you begin. The Mint button will remain disabled until a wallet is detected.

### Step 2 — Upload Your File

Go to **Dashboard → Mint** and drop or select your file.

- Supported formats: audio, video, image, PDF, Word, Markdown, text
- Maximum size: **15 GB**
- The upload starts immediately in the background
- You can fill in the metadata form while the upload is running — you don't have to wait

### Step 3 — Fill in the Metadata

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Display name of the NFT |
| Title | Yes | Title of the content |
| Description | Yes | Short description of your NFT |
| Cover Image | No | Thumbnail/cover art |
| Trailer | No | Short preview clip |
| Royalty % | Yes | Default is 5% |

**You cannot mint or queue until Name, Title, and Description are all filled in.**

### Step 4a — Mint Now (small/fast uploads)

Once the upload finishes, the **Mint NFT** button becomes active. Click it, approve the wallet transaction, and your NFT is minted on-chain.

### Step 4b — Queue Mint (large/slow uploads)

If your file is still uploading and you don't want to wait:

1. Fill in Name, Title, and Description
2. Click **Queue Mint**
3. A confirmation toast appears — *"We'll notify you when the upload finishes. You can close this page."*
4. You can now close the tab or navigate away safely

---

## What Happens After You Queue

```
Upload in progress
      ↓
Upload completes → CID confirmed on Pinata
      ↓
Metadata JSON pinned automatically (server-side)
      ↓
Notification: "Your NFT is ready to mint!"
      ↓
You sign one wallet transaction → NFT minted on-chain
```

The system checks your upload progress every **15 seconds** automatically. You don't need to stay on any particular page.

---

## Where to Sign Your Queued Mint

Once your upload finishes and the NFT is ready, you'll be notified in **three places simultaneously**:

### 1. Toast Notification
A persistent toast appears at the bottom of the screen with a **Sign Now** button.

### 2. Floating Panel
A floating card appears at the bottom-center of every page showing all your NFTs ready to sign. Click **Sign & Mint** to proceed.

### 3. Notifications Page
Go to **Dashboard → Notifications**. You'll see a **"Your NFT is ready to mint!"** notification with a **Sign & Mint** button directly in the card.

Any of these three places triggers the exact same flow — pick whichever is most convenient.

---

## Mint Status Lifecycle

| Status | Meaning |
|--------|---------|
| Uploading | File is being transferred to storage |
| Queued | Upload running, mint details saved |
| Ready to Sign | Upload done, metadata pinned — waiting for your signature |
| Confirming | Wallet transaction submitted, waiting for blockchain confirmation |
| Minted | NFT is on-chain |

---

## Frequently Asked Questions

**Can I close the browser while uploading?**
Yes. Once you click Queue Mint, the system tracks everything. Come back anytime and you'll see your pending NFTs.

**What if I forget to sign?**
Your queued mint stays in the system. Every time you open the app and connect your wallet, the floating panel and notifications will remind you.

**Is the cover image required?**
No. Cover image and trailer are both optional.

**Can I queue multiple NFTs at once?**
Yes. Each file upload creates its own queued mint and they are tracked independently.

**What happens if the upload fails?**
The queued mint will remain in "uploading" state. If you encounter a stuck upload, try re-uploading the file from the Mint page.

**When does the royalty apply?**
The royalty percentage is locked in at the time of on-chain minting and applies to all secondary sales of that NFT.
