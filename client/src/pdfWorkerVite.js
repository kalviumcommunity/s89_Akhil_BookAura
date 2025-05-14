// This file is specifically for Vite to properly bundle the PDF.js worker
// Using a direct path to the worker file that's compatible with Vite
import * as PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs';

// Export the worker URL
export default PDFWorker.default;
