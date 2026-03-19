'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { imageSrc } from '@/lib/api';

export interface ImageUploadButtonProps {
  value?: string;
  onChange: (value: string) => void;
  onError?: (message: string) => void;
  label?: string;
  accept?: string;
  className?: string;
  disabled?: boolean;
  maxSizeBytes?: number;
}

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Componentă pentru încărcare imagine: buton + preview jos.
 * La selectare fișier, citește imaginea ca Data URL și o pasează prin onChange.
 */
export function ImageUploadButton({
  value,
  onChange,
  onError,
  label = 'Imagine',
  accept = 'image/*',
  className,
  disabled = false,
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Selectează un fișier imagine (JPG, PNG, etc.).');
      return;
    }
    if (file.size > maxSizeBytes) {
      onError?.(`Imaginea este prea mare (max ${Math.round(maxSizeBytes / 1024)} KB).`);
      return;
    }
    setLoading(true);
    onError?.('');
    const reader = new FileReader();
    reader.onload = () => {
      setLoading(false);
      try {
        const dataUrl = reader.result as string;
        if (dataUrl) onChange(dataUrl);
      } catch (err) {
        onError?.((err as Error).message || 'Eroare la citirea imaginii.');
      }
    };
    reader.onerror = () => {
      setLoading(false);
      onError?.('Nu s-a putut citi fișierul. Încearcă altă imagine.');
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      setLoading(false);
      onError?.((err as Error).message || 'Eroare la încărcare.');
    }
  };

  const handleRemove = () => {
    onError?.('');
    onChange('');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && <Label>{label}</Label>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {loading ? 'Se încarcă...' : 'Încarcă imagine'}
      </Button>

      {value && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Preview</p>
          <div className="relative inline-block rounded-lg border overflow-hidden bg-muted max-w-xs">
            <img
              src={imageSrc(value)}
              alt="Preview"
              className="max-h-48 w-auto object-contain block"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
