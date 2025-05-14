// Direct worker URL for PDF.js
const pdfjsVersion = '5.2.133';

// Create a direct URL to the worker file on CDN
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

export default workerUrl;
