// pdf.js ships no types for its worker file; lib/search/extract.ts only loads it so the server can read PDFs.
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs'
