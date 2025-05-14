import { pdfjs } from 'react-pdf';

// We're going to use the fake worker approach by not setting the worker source
// This is more reliable when there are MIME type issues
console.log('Using fake worker for PDF.js (worker disabled)');

// If you want to try with a worker later, uncomment this:
/*
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  try {
    console.log('Setting PDF worker from CDN');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.js';
  } catch (error) {
    console.warn('Error setting up PDF worker:', error);
  }
}
*/

export default pdfjs;