'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isScanning: boolean;
  progressPercent: number;
  statusText: string;
}

export default function UploadZone({ 
  onFileSelect, 
  isScanning, 
  progressPercent, 
  statusText 
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  }, [onFileSelect]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-8">
      <AnimatePresence mode="wait">
        {!isScanning ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className={`drop-zone ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="drop-zone-content">
              <FileUp className="w-12 h-12 mb-4 mx-auto text-[var(--primary-color)] opacity-70" />
              <div className="text-xl font-bold text-gray-800 mb-2" id="upload-button-text">
                가입제안서 PDF 드래그 & 드롭
              </div>
              <p className="text-sm text-gray-500 font-medium">또는 클릭하여 파일 선택</p>
            </div>
            <div className="pulse-ring"></div>
            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".pdf"
              onChange={handleFileInput}
            />
          </motion.div>
        ) : (
          <motion.div
            key="progress-ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-md rounded-2xl shadow-[var(--glass-shadow)] border border-white/40"
          >
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64" cy="64" r="58"
                  fill="none"
                  className="stroke-gray-200"
                  strokeWidth="8"
                />
                <circle
                  cx="64" cy="64" r="58"
                  fill="none"
                  className="stroke-[var(--primary-color)] transition-all duration-300 ease-out"
                  strokeWidth="8"
                  strokeDasharray="364.4"
                  strokeDashoffset={364.4 - (progressPercent / 100) * 364.4}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-gray-800 tracking-tighter">
                  {progressPercent}<span className="text-lg text-gray-500">%</span>
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-2">분석 중입니다</h3>
              <p className="text-sm text-gray-500 font-medium animate-pulse">{statusText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
