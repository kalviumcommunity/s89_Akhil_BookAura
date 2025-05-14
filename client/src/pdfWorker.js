import { pdfjs } from 'react-pdf';

// This ensures we're using the correct worker version that matches the PDF.js version used by react-pdf
// Update to match the version in package.json (pdfjs-dist@5.2.133)
const pdfjsVersion = '5.2.133';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

export default pdfjs;