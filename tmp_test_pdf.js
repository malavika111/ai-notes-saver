const pdfParse = require('pdf-parse');
console.log('pdfParse type:', typeof pdfParse);
console.log('pdfParse keys:', Object.keys(pdfParse));
if (pdfParse.PDFParse) {
  console.log('PDFParse class found');
}
