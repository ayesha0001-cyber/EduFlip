import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  AlertCircle,
  FileText,
  RotateCw
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Comprehensive polyfills for cross-browser safety (Promise.try & Uint8Array.prototype.toHex)
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise(function (resolve) {
      resolve(fn(...args));
    });
  };
}

if (typeof (Uint8Array.prototype as any).toHex !== 'function') {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this as Uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
} catch {
  // Fallback to CDN worker if local worker fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  blob: Blob;
  objectUrl: string;
  title: string;
  onDownload?: () => void;
  onOpenNewTab?: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  blob,
  objectUrl,
  title,
  onDownload,
  onOpenNewTab
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Load the PDF document
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setRenderError(null);

    const loadDocument = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('PDF.js parse warning:', err);
        setRenderError(err?.message || 'Failed to parse PDF document directly.');
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [blob]);

  // Render the current page onto the canvas
  const renderPage = useCallback(
    async (pageNum: number, currentScale: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use devicePixelRatio for crisp, sharp text rendering
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: currentScale });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Page render error:', err);
      } finally {
        setIsRendering(false);
      }
    },
    [pdfDoc]
  );

  useEffect(() => {
    if (pdfDoc && numPages > 0) {
      renderPage(currentPage, scale);
    }
  }, [pdfDoc, currentPage, scale, numPages, renderPage]);

  // Fit to container width
  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    const containerWidth = containerRef.current.clientWidth - 48; // padding
    pdfDoc.getPage(currentPage).then((page: any) => {
      const standardViewport = page.getViewport({ scale: 1.0 });
      const fitScale = Math.min(2.5, Math.max(0.6, containerWidth / standardViewport.width));
      setScale(parseFloat(fitScale.toFixed(2)));
    });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, parseFloat((prev + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, parseFloat((prev - 0.2).toFixed(2))));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none shadow-2xs">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading || !!renderError}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium font-mono text-[11px] px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">
            {currentPage} / {numPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading || !!renderError}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.6 || isLoading || !!renderError}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium font-mono text-slate-600 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5 || isLoading || !!renderError}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            onClick={handleFitWidth}
            disabled={isLoading || !!renderError}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit Width</span>
          </button>
        </div>

        {/* Quick Document Actions */}
        <div className="flex items-center gap-1.5">
          {onOpenNewTab && (
            <button
              onClick={onOpenNewTab}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 text-[11px] font-medium"
              title="Open full PDF in new window"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Open Tab</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1.5 rounded-lg hover:bg-teal-50 text-[#0F766E] transition flex items-center gap-1 text-[11px] font-medium"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Document Stage */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-0 relative"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-9 h-9 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-3" />
            <div className="text-xs font-semibold text-[#1E3A5F]">Rendering PDF Pages...</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Converting document into high-resolution canvas stream.
            </p>
          </div>
        ) : renderError ? (
          /* Graceful Fallback if PDF.js can't parse or if it's formatted text */
          <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1E3A5F]">{title}</h4>
              <p className="text-xs text-slate-500 mt-1">
                This document is ready. You can open it in full view in a dedicated browser tab or download it directly to your device.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {onOpenNewTab && (
                <button
                  onClick={onOpenNewTab}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Rendered PDF Canvas with crisp shadows & page borders */
          <div className="relative inline-block my-auto shadow-lg bg-white rounded-md border border-slate-300 overflow-hidden transition-transform duration-100 ease-out">
            <canvas ref={canvasRef} className="block mx-auto" />
            {isRendering && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
