import { pdfjs } from 'react-pdf';

// This ensures we're using the correct worker version that matches the PDF.js version used by react-pdf
const pdfjsVersion = '4.8.69';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.mjs`;

export default pdfjs;