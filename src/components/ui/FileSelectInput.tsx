"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import CustomSelect from "./CustomSelect";
import type { FileFromDB } from "@/types";

interface FileSelectInputProps {
  walletId: string;
  fileExtensions?: string[];
  onChange: (ipfsUrl: string) => void;
  className?: string;
}

const FileSelectInput = ({
  walletId,
  fileExtensions,
  onChange,
  className,
}: FileSelectInputProps) => {
  const [files, setFiles] = useState<FileFromDB[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isLoading,setIsLoading] = useState(false)
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true)
      try {
        // Dummy data for development
        const allFiles: FileFromDB[] = [
          { filename: "track1.mp3", type: ".mp3", ipfsUrl: "ipfs://dummy1" },
          { filename: "cover1.png", type: ".png", ipfsUrl: "ipfs://dummy2" },
          { filename: "metadata1.json", type: ".json", ipfsUrl: "ipfs://dummy3" },
        ];
        let filteredFiles = allFiles;
        if (fileExtensions && fileExtensions.length > 0) {
          filteredFiles = allFiles.filter((file) =>
            fileExtensions.some((ext) => file.type === ext)
          );
        }
        setFiles(filteredFiles);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
      finally{
        setIsLoading(false)
      }
    };

    if (walletId) {
      fetchFiles();
    }
  }, [walletId, fileExtensions]);

  const handleSelectChange = (value: string) => {
    setSelectedFile(value);
    onChange(value);
  };

  const options = files.map((file) => ({
    value: file.ipfsUrl,
    label: `${file.filename}`,
  }));

  return (
    <CustomSelect
      value={selectedFile}
      onChange={handleSelectChange}
      options={options}
      isLoading={isLoading}
      placeholder="Select a file..."
      className={className}
    />
  );
};

export default FileSelectInput;