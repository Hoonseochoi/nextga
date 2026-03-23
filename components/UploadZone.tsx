'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText } from 'lucide-react';

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
  statusText,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.includes('pdf') && !file.type.startsWith('image/')) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (isScanning) {
    return (
      <div className="w-full p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center animate-pulse">
          <FileText className="w-8 h-8 text-[var(--color-meritz-primary)]" />
        </div>
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-gray-600">{statusText || 'PDF 분석 중...'}</p>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-[var(--color-meritz-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-gray-400 font-medium">{progressPercent}%</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full p-10 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200
        flex flex-col items-center gap-4 text-center
        ${isDragging
          ? 'border-[var(--color-meritz-primary)] bg-red-50'
          : 'border-gray-200 bg-white hover:border-[var(--color-meritz-primary)] hover:bg-red-50/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <AnimatePresence>
        <motion.div
          key={isDragging ? 'drag' : 'idle'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"
        >
          <Upload className="w-8 h-8 text-[var(--color-meritz-primary)]" />
        </motion.div>
      </AnimatePresence>
      <div>
        <p className="text-base font-bold text-gray-700">
          PDF 파일을 드래그하거나 클릭하세요
        </p>
        <p className="text-sm text-gray-400 mt-1">
          가입제안서 PDF 또는 이미지 파일 지원
        </p>
      </div>
    </div>
  );
}
