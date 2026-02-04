"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import CustomSelect from "./CustomSelect";
import type { FileFromDB } from "@/types";
import { getFilesByWallet } from "@/actions/files";
import { FileModel } from "@/generated/prisma/models";

interface FileSelectInputProps {
  walletId: string;
  fileExtensions?: string[];
  onChange: (ipfsUrl: string) => void;
  className?: string;
  file_id?:string
}

const FileSelectInput = ({
  file_id="",
  walletId,
  fileExtensions,
  onChange,
  className,
  
}: FileSelectInputProps) => {
  const [files, setFiles] = useState<FileModel[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(file_id);
  const [isLoading,setIsLoading] = useState(false)
  useEffect(() => {
    if (file_id) {
      setSelectedFile(file_id);
      onChange(file_id);
    }
  }, [file_id]);
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true)
      try {
        const allFiles =  await getFilesByWallet(walletId);
        let filteredFiles = allFiles;
         if (fileExtensions && fileExtensions.length > 0) {
          const excludeExtensions = fileExtensions.filter((ext) => ext.startsWith("!")).map((ext) => ext.slice(1).toLowerCase());
          const includeExtensions = fileExtensions.filter((ext) => !ext.startsWith("!")).map((ext) => ext.toLowerCase());

          filteredFiles = allFiles.filter((file) => {
            const ext = file.filename.split(".").pop()?.toLowerCase() || "";
            // Exclude first
            if (excludeExtensions.includes(ext)) return false;
            // Include only if includeExtensions is specified
            if (includeExtensions.length > 0) return includeExtensions.includes(ext);
            // Otherwise include all
            return true;
          });
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
    isListed:file.isMinted
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