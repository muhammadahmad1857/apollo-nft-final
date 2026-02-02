"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import MultiSelect from "./MultiSelect";
import { getFilesByWallet } from "@/actions/files";
import { FileModel } from "@/generated/prisma/models";

interface FileSelectInputProps {
  walletId: string;
  fileExtensions?: string[];
  onChange: (ipfsUrls: string[]) => void;
  className?: string;
  maxSelections?: number; // optional limit
}

const FileMultiSelectInput = ({
  walletId,
  fileExtensions,
  onChange,
  className,
  maxSelections = 10,
}: FileSelectInputProps) => {
  const [files, setFiles] = useState<FileModel[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
       
        
       let filteredFiles:FileModel[] = await getFilesByWallet(walletId,true);
if (fileExtensions?.length) {
          filteredFiles = filteredFiles.filter((file) =>
            fileExtensions.includes(file.type)
          );
        }

        setFiles(filteredFiles);
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (walletId) fetchFiles();
  }, [walletId, fileExtensions]);

  const handleChange = (newSelected: string[]) => {
    setSelectedUrls(newSelected);
    onChange(newSelected);
  };

  const options = files.map((file) => ({
    value: file.ipfsUrl,
    label: file.filename,
    isListed:file.isMinted
  }));

  return (
    <MultiSelect
      value={selectedUrls}
      onChange={handleChange}
      options={options}
      isLoading={isLoading}
      placeholder="Select files..."
      className={className}
      maxSelections={maxSelections}
    />
  );
};

export default FileMultiSelectInput;