# Apollo NFT — Minting Guide

## Overview

Apollo supports two minting modes:

- **Single Mint** — one file, one NFT
- **Batch Mint** — one file, multiple identical copies (set a quantity)

Both support files up to **15 GB**. For large files, you can **queue your mint** — save your details and navigate freely around the app while the upload runs in the background.

---

## Single Mint

### Step 1 — Connect Your Wallet

Make sure your wallet is connected before you begin. The Mint button will remain disabled until a wallet is detected.

### Step 2 — Upload Your File

Go to **Dashboard → Mint** and drop or select your file.

- Supported formats: audio, video, image, PDF, Word, Markdown, text
- Maximum size: **15 GB**
- The upload starts immediately
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

### Step 4a — Mint Now (upload finished)

Once the upload finishes, the **Mint NFT** button becomes active. Click it, approve the wallet transaction, and your NFT is minted on-chain.

### Step 4b — Queue Mint (upload still in progress)

If your file is still uploading and you don't want to sit and wait:

1. Fill in Name, Title, and Description
2. Click **Queue Mint**
3. Your mint details are saved to the server
4. Navigate anywhere else in the app — Notifications, Marketplace, wherever
5. You'll get a notification automatically when the upload finishes and it's ready to sign

> **Important:** The upload runs in your browser tab. You can freely navigate within the app, but **don't close the browser tab** until the upload is done — that will cancel it.

---

## Batch Mint

Go to **Dashboard → Batch Mint** to mint multiple identical copies of the same NFT in one transaction.

### Step 1 — Upload Your File

Same as single mint. Drop or select your file — the upload starts immediately.

### Step 2 — Fill in the Metadata

Same required fields: **Name, Title, and Description**. Cover image and trailer are optional.

### Step 3 — Set Quantity & Royalty

- **Quantity** — how many copies to mint (must be a whole number ≥ 1)
- **Royalty %** — applied to all copies on secondary sales (default 5%)

### Step 4a — Mint Now (upload finished)

The **Mint N NFTs** button becomes active once the upload completes. One wallet transaction mints all copies at once.

### Step 4b — Queue Mint (upload still in progress)

Same as single mint — click **Queue Mint**, navigate away freely, and come back when you get the notification. The quantity you set is saved and used when you sign.

---

## What Happens After You Queue

```
Upload running in background (browser tab stays open)
      ↓
Upload completes → CID confirmed on Pinata
      ↓
Metadata JSON pinned automatically (server-side)
      ↓
Notification: "Your NFT is ready to mint!"
      ↓
You sign one wallet transaction → NFT(s) minted on-chain
```

The system checks your upload every **15 seconds** automatically. You don't need to be on any particular page.

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
| Minted | NFT(s) are on-chain |

---

## Frequently Asked Questions

**Can I navigate away while uploading?**
Yes — once you click Queue Mint, navigate freely anywhere in the app. The upload keeps running silently in the background. You'll get a notification when it's ready to sign. Just don't close the browser tab or window, as that will cancel the upload.

**Can I close the browser tab while uploading?**
No. The upload runs in your browser, so closing the tab cancels it. Keep the tab open in the background (you can switch to other tabs or apps). Once the upload finishes and you've signed the mint, you can close everything.

**What if I forget to sign?**
Your queued mint stays in the system. Every time you open the app and connect your wallet, the floating panel and notifications will remind you.

**Is the cover image required?**
No. Cover image and trailer are both optional for both single and batch mint.

**Can I queue multiple mints at once?**
Yes. Each file upload creates its own queued mint (with its own quantity for batch) and they are tracked independently.

**What happens if the upload fails?**
The queued mint will remain in "uploading" state. If you encounter a stuck upload, try re-uploading the file from the Mint or Batch Mint page.

**For batch mint, does each copy get the same metadata?**
Yes. All copies in a batch mint share the same metadata URI. The quantity controls how many on-chain tokens are created pointing to that metadata.

**When does the royalty apply?**
The royalty percentage is locked in at the time of on-chain minting and applies to all secondary sales of that NFT (or all copies in a batch).
