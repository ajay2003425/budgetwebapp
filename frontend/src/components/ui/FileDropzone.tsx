import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  value?: File | null;
  onClear?: () => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  disabled = false,
  error,
  value,
  onClear,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  });

  const hasError = error || fileRejections.length > 0;

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <File className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-900">{value.name}</span>
            <span className="text-xs text-gray-500">
              ({(value.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer',
            isDragActive && !hasError && 'border-blue-500 bg-blue-50',
            hasError && 'border-red-500 bg-red-50',
            !isDragActive && !hasError && 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={clsx(
            'w-8 h-8 mx-auto mb-4',
            hasError ? 'text-red-400' : 'text-gray-400'
          )} />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag and drop a file here, or click to select'
            }
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, PDF up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
      )}

      {hasError && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>
            {error || 
             (fileRejections[0] && 
              (fileRejections[0].errors[0]?.message || 'Invalid file')
             )
            }
          </span>
        </div>
      )}
    </div>
  );
};