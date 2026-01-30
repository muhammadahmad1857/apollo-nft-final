"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";
import { updateUserByWallet } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EditProfilePage() {
  const { address } = useAccount();
  const { data: user, refetch } = useUser(address || "");
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!user) return <div className="p-8">Connect your wallet to edit your profile.</div>;


  // Pinata upload logic (from FileUpload)
  const uploadToPinata = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 1️⃣ Get signed URL from your server
      const signedRes = await fetch("/api/pinata/signed-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!signedRes.ok) throw new Error("Failed to get signed URL");
      const { data } = await signedRes.json();
      setUploadProgress(33);
      // 2️⃣ Prepare FormData for upload
      const formData = new FormData();
      formData.append("file", file);
      setUploadProgress(50);

      // 3️⃣ Upload directly to Pinata
      const uploadRes = await fetch(data, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Pinata upload failed");
      const uploadResJson = await uploadRes.json();
      const ipfsHash = uploadResJson?.data.cid;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setUploadProgress(75);
      await fetch("/api/pinata/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: ipfsHash }),
      });
      setUploadProgress(100);
      setAvatarUrl(ipfsUrl);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Show preview immediately
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
      // Upload to Pinata
      uploadToPinata(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let uploadedUrl = avatarUrl;
    // If a new file is selected and not yet uploaded to Pinata, upload it now
    if (file && !avatarUrl.startsWith("https://gateway.pinata.cloud/ipfs/")) {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        // 1️⃣ Get signed URL from your server
        const signedRes = await fetch("/api/pinata/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        });
        if (!signedRes.ok) throw new Error("Failed to get signed URL");
        const { data } = await signedRes.json();
        setUploadProgress(33);
        // 2️⃣ Prepare FormData for upload
        const formData = new FormData();
        formData.append("file", file);
        setUploadProgress(50);
        // 3️⃣ Upload directly to Pinata
        const uploadRes = await fetch(data, { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Pinata upload failed");
        const uploadResJson = await uploadRes.json();
        const ipfsHash = uploadResJson?.data.cid;
        uploadedUrl = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}`;
        setUploadProgress(75);
        await fetch("/api/pinata/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid: ipfsHash }),
        });
        setUploadProgress(100);
        setAvatarUrl(uploadedUrl);
        toast.success("Image uploaded successfully!");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
        setIsSaving(false);
        return;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
    try {
      await updateUserByWallet(address!, {
        name,
        avatarUrl: uploadedUrl,
      });
      refetch();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="size-24">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
            disabled={isUploading}
          />
          {isUploading && (
            <div className="w-full mt-2">
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-zinc-500 mt-1 text-center">Uploading image...</div>
            </div>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <Button type="submit" disabled={isSaving || isUploading} className="w-full">
          {isSaving ? "Saving..." : isUploading ? "Uploading..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
