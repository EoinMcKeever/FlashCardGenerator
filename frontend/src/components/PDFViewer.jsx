import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ pdfUrl, filename, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.0));
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {filename}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 5px',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {/* PDF Viewer */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '20px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ padding: '20px' }}>Loading PDF...</div>}
            error={<div style={{ padding: '20px', color: 'red' }}>Failed to load PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: '15px 20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
          }}
        >
          {/* Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              style={{
                padding: '8px 15px',
                backgroundColor: pageNumber <= 1 ? '#e0e0e0' : '#4CAF50',
                color: pageNumber <= 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Page {pageNumber} of {numPages || '--'}
            </span>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              style={{
                padding: '8px 15px',
                backgroundColor: pageNumber >= numPages ? '#e0e0e0' : '#4CAF50',
                color: pageNumber >= numPages ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Next
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              style={{
                padding: '8px 12px',
                backgroundColor: scale <= 0.5 ? '#e0e0e0' : '#2196F3',
                color: scale <= 0.5 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: scale <= 0.5 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Zoom Out
            </button>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 2.0}
              style={{
                padding: '8px 12px',
                backgroundColor: scale >= 2.0 ? '#e0e0e0' : '#2196F3',
                color: scale >= 2.0 ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: scale >= 2.0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Zoom In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
