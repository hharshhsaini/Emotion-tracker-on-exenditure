import { useState, useRef } from 'react';
import { Upload, FileText, Image, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const ACCEPTED_TYPES = '.csv,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

export default function FileUpload({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const isImageFile = (filename) => {
    return IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isValidFile = (filename) => {
    const lower = filename.toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.pdf') || isImageFile(lower);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile.name)) {
      setFile(droppedFile);
      if (isImageFile(droppedFile.name)) {
        setPreview(URL.createObjectURL(droppedFile));
      } else {
        setPreview(null);
      }
    } else {
      setError('Please upload a CSV, PDF, or image file (JPG, PNG, WebP, HEIC)');
    }
  };

  const handleFileSelect = (e) => {
    setError(null);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (isImageFile(selectedFile.name)) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onAnalysisComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400'
        }`}
      >
        {!file ? (
          <>
            <div className="flex justify-center gap-2 mb-4">
              <Upload className="w-10 h-10 text-indigo-500" />
              <Image className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Upload Your Bank Statement or Receipt
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop a CSV, PDF, or photo (JPG, PNG, WebP, HEIC)
            </p>
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              Select File
            </label>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-48 rounded-lg shadow-md"
              />
            ) : (
              <FileText className="w-12 h-12 text-indigo-500" />
            )}
            <div className="flex items-center gap-3">
              {isImageFile(file.name) ? (
                <Image className="w-6 h-6 text-indigo-500" />
              ) : (
                <FileText className="w-6 h-6 text-indigo-500" />
              )}
              <span className="text-gray-700 font-medium">{file.name}</span>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Remove file"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Analyze Button */}
      {file && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {file.name.toLowerCase().endsWith('.pdf') ? 'Processing PDF...' : 
               isImageFile(file.name) ? 'Extracting & Analyzing...' : 'Analyzing...'}
            </>
          ) : (
            'Analyze Finances'
          )}
        </button>
      )}
    </div>
  );
}
