import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Eye, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage, formatFileSize, CompressedImageResult } from '@/lib/imageCompressor';

export interface ImageAttachmentValue {
  file: File;
  dataUrl: string;
  name: string;
  size: number;
}

interface ImageAttachmentFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  value?: ImageAttachmentValue | null;
  onChange: (value: ImageAttachmentValue | null) => void;
  aspectRatio?: 'square' | 'card' | 'wide' | 'auto';
  className?: string;
}

export const ImageAttachmentField: React.FC<ImageAttachmentFieldProps> = ({
  label,
  description,
  required = false,
  value,
  onChange,
  aspectRatio = 'auto',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (rawFile: File) => {
    if (!rawFile) return;

    // Check if it's an image
    if (!rawFile.type.startsWith('image/') && !rawFile.name.match(/\.(jpg|jpeg|png|webp|gif|heic|bmp)$/i)) {
      alert('Please upload an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setIsProcessing(true);
    try {
      const compressed: CompressedImageResult = await compressImage(rawFile, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.85,
        mimeType: 'image/jpeg'
      });

      onChange({
        file: compressed.file,
        dataUrl: compressed.dataUrl,
        name: rawFile.name || compressed.name,
        size: compressed.compressedSize
      });
    } catch (err) {
      console.error('Failed to process image:', err);
      // Fallback: create object URL
      const fallbackUrl = URL.createObjectURL(rawFile);
      onChange({
        file: rawFile,
        dataUrl: fallbackUrl,
        name: rawFile.name,
        size: rawFile.size
      });
    } finally {
      setIsProcessing(false);
      // Reset input value so re-selecting same file triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {value && (
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 size={12} /> Ready ({formatFileSize(value.size)})
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/*"
        onChange={handleFileChange}
        className="sr-only hidden"
        tabIndex={-1}
      />

      {/* Upload Box / Preview Area */}
      {isProcessing ? (
        <div className="border border-border border-dashed rounded-2xl p-6 bg-muted/40 flex flex-col items-center justify-center gap-2 min-h-[110px]">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-xs font-medium text-muted-foreground">Optimizing & attaching image...</span>
        </div>
      ) : value ? (
        <div className="relative border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-3 flex items-center gap-3.5 transition-all overflow-hidden">
          <div
            onClick={() => setPreviewModalOpen(true)}
            className="relative w-16 h-16 rounded-xl overflow-hidden bg-background border border-border shrink-0 cursor-pointer group shadow-sm"
          >
            <img
              src={value.dataUrl}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Eye size={16} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{value.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Image attached • {formatFileSize(value.size)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={openPicker}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Change Photo
              </button>
              <span className="text-muted-foreground text-[10px]">•</span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
              >
                View Full
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
            title="Remove attachment"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Camera size={20} />
          </div>
          <span className="text-xs font-bold text-foreground mb-0.5">
            Tap to upload photo or take picture
          </span>
          <span className="text-[10px] text-muted-foreground">
            JPG, PNG, WebP up to 15MB (Auto-compressed)
          </span>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalOpen && value && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div className="relative max-w-lg w-full bg-card rounded-3xl overflow-hidden border border-border shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h4 className="font-bold text-sm text-foreground">{label} Preview</h4>
                <p className="text-[10px] text-muted-foreground">{value.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img
                src={value.dataUrl}
                alt={label}
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  openPicker();
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Replace Photo
              </button>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ImageAttachmentField;
