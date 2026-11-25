import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface ImageUploaderProps {
  maxImages?: number;
  files: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  maxImages = 3,
  files,
  onChange,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', { description: `${file.name} is not an image.` });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', { description: `${file.name} exceeds 10MB limit.` });
        continue;
      }
      validFiles.push(file);
    }

    if (files.length + validFiles.length > maxImages) {
      toast.warning(`Maximum ${maxImages} images allowed.`, {
        description: `Only the first ${maxImages - files.length} additional images were added.`
      });
    }

    const combined = [...files, ...validFiles].slice(0, maxImages);
    onChange(combined);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      {files.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>

          <h4 className="text-sm font-semibold text-foreground">
            Click to upload or drag & drop photos
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG or WEBP up to 10MB (max {maxImages} photos)
          </p>

          {/* Mobile Camera Fast Action */}
          <div className="mt-4 flex gap-2 sm:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="rounded-xl flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4 text-primary" />
              Use Camera
            </Button>
          </div>
        </div>
      )}

      {/* Previews Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((file, idx) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-sm"
              >
                <img
                  src={previewUrl}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors opacity-90 group-hover:opacity-100"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white font-mono backdrop-blur-sm">
                  {idx + 1}/{maxImages}
                </div>
              </div>
            );
          })}

          {files.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="mt-1 text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
