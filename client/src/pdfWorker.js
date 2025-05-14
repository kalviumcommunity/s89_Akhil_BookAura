import { pdfjs } from 'react-pdf';

// This ensures we're using the correct worker version that matches the PDF.js version used by react-pdf
// Using a non-module format to avoid MIME type issues
const pdfjsVersion = '5.2.133';

// Only set the worker source if it hasn't been set already
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  // Use a CDN that serves with the correct MIME type
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
}

export default pdfjs;