import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Presentation,
  FileCheck,
  Code,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import type { LearningMaterial } from '../../types';
import { loadFileFromFirestore, updateMaterialFileInFirestore } from '../../services/firestoreStorage';
import { markMaterialRead } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface MaterialViewerModalProps {
  material: LearningMaterial;
  onClose: () => void;
  onMaterialUpdated?: (updated: LearningMaterial) => void;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  material,
  onClose,
  onMaterialUpdated
}) => {
  const { currentUser, selectedCourse, addToast, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedBlob, setLoadedBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    loadFileFromFirestore(material.url, material.title)
      .then((res) => {
        if (!isMounted) return;
        setLoadedBlob(res.blob);
        setObjectUrl(res.objectUrl);
        setFileName(res.fileName);
        setIsFallback(Boolean(res.isFallback));
        setIsLoading(false);

        // Mark read for student
        if (currentUser && selectedCourse) {
          markMaterialRead(currentUser.userId, material.materialId, selectedCourse.courseId);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load file:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [material.materialId, material.url, material.title, currentUser?.userId, selectedCourse?.courseId]);

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName || `${material.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(`Downloading "${material.title}"`, 'success');
  };

  const handleOpenInNewTab = () => {
    if (!objectUrl) return;
    window.open(objectUrl, '_blank');
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReplacing(true);
    setReplaceProgress('Uploading file to Firebase Store...');
    try {
      const { url, sizeBytes } = await updateMaterialFileInFirestore(
        material.materialId,
        file,
        (msg) => setReplaceProgress(msg)
      );

      const updatedMat: LearningMaterial = {
        ...material,
        url,
        sizeBytes
      };

      onMaterialUpdated?.(updatedMat);
      addToast('File updated and saved permanently to Firebase Store!', 'success');

      // Reload into viewer
      const newLoad = await loadFileFromFirestore(url, file.name);
      setLoadedBlob(newLoad.blob);
      setObjectUrl(newLoad.objectUrl);
      setFileName(newLoad.fileName);
      setIsFallback(false);
    } catch (err) {
      console.error('Failed to update file:', err);
      addToast('Failed to update material file.', 'error');
    } finally {
      setIsReplacing(false);
      setReplaceProgress('');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    switch (material.type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'SLIDES':
        return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'NOTES':
        return <FileCheck className="w-5 h-5 text-teal-600" />;
      case 'CODE':
        return <Code className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5">
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[850px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1E3A5F] truncate">
                {material.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#5B6B7C] mt-0.5">
                <span className="px-1.5 py-0.5 rounded font-semibold text-[10px] bg-slate-200 text-slate-700">
                  {material.type}
                </span>
                <span>•</span>
                <span>{formatBytes(material.sizeBytes)}</span>
                <span>•</span>
                <span className="text-teal-700 font-medium">Cloud Synchronized</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice for Legacy Session Blobs */}
        {isFallback && !isLoading && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Session Link Note:</strong> The original file was attached as an ephemeral session link in a previous session. A formatted study guide has been synthesized below.
              </span>
            </div>
            {role === 'TEACHER' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Upload Real File
              </button>
            )}
          </div>
        )}

        {/* Document Viewer Body */}
        <div className="flex-1 bg-[#F1F5F9] p-3 sm:p-4 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-4" />
              <div className="font-semibold text-sm text-[#1E3A5F]">
                Loading document from Firebase Store...
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Fetching document and preparing secure viewer preview.
              </p>
            </div>
          ) : loadedBlob && objectUrl ? (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PdfCanvasViewer
                blob={loadedBlob}
                objectUrl={objectUrl}
                title={material.title}
                onDownload={handleDownload}
                onOpenNewTab={handleOpenInNewTab}
              />
            </div>
          ) : objectUrl ? (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs relative">
              <iframe
                src={objectUrl}
                title={material.title}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-slate-200">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <div className="font-semibold text-sm text-slate-800">Unable to preview document</div>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Please click Download Document below to open it with your device application.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !objectUrl}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Document</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              disabled={isLoading || !objectUrl}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#1E3A5F] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in New Window</span>
            </button>
          </div>

          {role === 'TEACHER' && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleReplaceFile}
                accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.txt,.md,.zip,.py,.js"
                className="hidden"
              />

              {isReplacing ? (
                <div className="flex items-center gap-2 text-xs text-[#0F766E] font-medium bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                  <div className="w-3.5 h-3.5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                  <span>{replaceProgress}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  title="Upload a new file to permanently replace this document in Firebase Store"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Replace / Update File</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
