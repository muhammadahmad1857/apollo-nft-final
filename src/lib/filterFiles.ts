import { FileModel } from "@/generated/prisma/models";

export function filterFilesByExtension(allFiles:FileModel[], fileExtensions: string[] = []) {
  if (!fileExtensions || fileExtensions.length === 0) return allFiles;

  const excludeExtensions = fileExtensions
    .filter((ext) => ext.startsWith("!"))
    .map((ext) => ext.slice(1).toLowerCase());

  const includeExtensions = fileExtensions
    .filter((ext) => !ext.startsWith("!"))
    .map((ext) => ext.toLowerCase());

  return allFiles.filter((file) => {
    const ext = `.${file.filename.split(".").pop()?.toLowerCase()}` || "";

    // ❌ Exclude first
    if (excludeExtensions.includes(ext)) return false;

    // ✅ Include only if includeExtensions exist
    if (includeExtensions.length > 0)
      return includeExtensions.includes(ext);

    // ✅ Otherwise include all
    return true;
  });
}
