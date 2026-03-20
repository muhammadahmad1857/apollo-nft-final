"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import CustomSelect from "./CustomSelect";
import type { FileFromDB } from "@/types";
import { marketplaceApi } from "@/lib/marketplaceApi";
import { FileModel } from "@/generated/prisma/models";
import { filterFilesByExtension } from "@/lib/filterFiles";

interface FileSelectInputProps {
  walletId: string;
  fileExtensions?: string[];
  onChange: (ipfsUrl: string) => void;
  onFileChange?: (file: FileModel) => void;
  className?: string;
  file_id?:string
}

const FileSelectInput = ({
  file_id="",
  walletId,
  fileExtensions,
  onChange,
  onFileChange,
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
        const allFiles =  await marketplaceApi.files.getByWallet(walletId);
        const filteredFiles = filterFilesByExtension(allFiles, fileExtensions);
       
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
    if (onFileChange) {
      const file = files.find((f) => f.ipfsUrl === value);
      if (file) onFileChange(file);
    }
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