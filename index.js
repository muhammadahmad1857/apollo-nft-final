// index.js
const allFiles = [
  { filename: "image.png" },
  { filename: "video.mp4" },
  { filename: "doc.pdf" },
  { filename: "data.json" },
  { filename: "music.mp3" },
  { filename: "archive.zip" },
  { filename: "readme.txt" },
];

export function filterFilesByExtension(allFiles, fileExtensions = []) {
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


// 👉 Change this to test different cases
// const fileExtensions = ["!.json", "!.zip"]; 
// const fileExtensions = ["png", "mp4"]; 
const fileExtensions = [".json"];
// const fileExtensions = [];
const files = filterFilesByExtension(allFiles,fileExtensions)

console.log("Files",files)