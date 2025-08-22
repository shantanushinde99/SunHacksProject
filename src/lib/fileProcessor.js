import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from './supabase';
import {
  createOptimizedWorker,
  detectLanguageFromFileName,
  getOCRPreset,
  DEFAULT_LANGUAGES
} from './tesseractConfig';

// Configure PDF.js worker to use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// File size and page limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_PDF_PAGES = 25;

/**
 * Main file processing function
 * @param {File} file - The uploaded file
 * @param {string} userId - User ID for storage organization
 * @returns {Promise<Object>} Processing result with extracted text and storage info
 */
export async function processFile(file, userId) {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    console.log(`Processing file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    let extractedText = '';
    let processingMethod = '';

    if (file.type === 'application/pdf') {
      const result = await processPDF(file);
      extractedText = result.text;
      processingMethod = result.method;
    } else if (file.type.startsWith('image/')) {
      extractedText = await processImage(file);
      processingMethod = 'OCR';
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the file');
    }

    // Convert to markdown and upload to Supabase
    const markdownContent = convertToMarkdown(extractedText, file.name, processingMethod);
    const storageResult = await uploadToSupabase(markdownContent, file.name, userId);

    return {
      success: true,
      fileName: file.name,
      extractedText,
      processingMethod,
      markdownUrl: storageResult.url,
      storageInfo: storageResult
    };

  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: error.message,
      fileName: file.name
    };
  }
}

/**
 * Process PDF files - try text extraction first, then OCR if needed
 * @param {File} file - PDF file
 * @returns {Promise<Object>} Extracted text and processing method
 */
async function processPDF(file) {
  try {
    console.log('Attempting PDF text extraction...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
    console.log(`PDF has ${pdf.numPages} pages, processing ${numPages} pages`);
    
    let extractedText = '';
    
    // Try text extraction first
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      extractedText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
    }
    
    // Check if we got meaningful text (more than just whitespace and basic chars)
    const meaningfulText = extractedText.replace(/[\s\n\r\t\-]/g, '');
    
    if (meaningfulText.length > 50) {
      console.log('PDF text extraction successful');
      return { text: extractedText.trim(), method: 'PDF.js Text Extraction' };
    } else {
      console.log('PDF text extraction yielded minimal text, falling back to OCR...');
      return await processPDFWithOCR(file, pdf, numPages);
    }
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Process PDF using OCR (fallback method)
 * @param {File} file - PDF file
 * @param {Object} pdf - PDF.js document object
 * @param {number} numPages - Number of pages to process
 * @returns {Promise<Object>} OCR extracted text and method
 */
async function processPDFWithOCR(file, pdf, numPages) {
  console.log('Starting PDF OCR processing...');

  // Detect best language combination for this file
  const languages = detectLanguageFromFileName(file.name);
  console.log(`Using OCR languages: ${languages}`);

  const worker = await createOptimizedWorker(languages, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`PDF OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  let ocrText = '';
  
  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`Processing PDF page ${pageNum}/${numPages} with OCR...`);
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      // Create canvas to render PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to image data for OCR
      const imageData = canvas.toDataURL('image/png');
      
      // Perform OCR on the page
      const { data: { text } } = await worker.recognize(imageData);
      ocrText += `\n\n--- Page ${pageNum} (OCR) ---\n${text}`;
    }
    
    return { text: ocrText.trim(), method: 'Tesseract OCR (PDF)' };
    
  } finally {
    await worker.terminate();
  }
}

/**
 * Process image files using OCR
 * @param {File} file - Image file
 * @returns {Promise<string>} Extracted text
 */
async function processImage(file) {
  console.log('Starting image OCR processing...');

  // Detect best language combination for this file
  const languages = detectLanguageFromFileName(file.name);
  console.log(`Using OCR languages: ${languages}`);

  // Use handwriting preset for better image recognition
  const preset = getOCRPreset('HANDWRITING');
  const worker = await createOptimizedWorker(languages, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`Image OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  try {
    // Apply handwriting-specific parameters
    await worker.setParameters(preset.options);

    const { data: { text } } = await worker.recognize(file);
    console.log('Image OCR completed');
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Convert extracted text to markdown format
 * @param {string} text - Extracted text
 * @param {string} fileName - Original file name
 * @param {string} method - Processing method used
 * @returns {string} Formatted markdown content
 */
function convertToMarkdown(text, fileName, method) {
  const timestamp = new Date().toISOString();
  
  const markdownContent = `# Extracted Content: ${fileName}

**File:** ${fileName}  
**Processing Method:** ${method}  
**Extracted Date:** ${timestamp}  

---

## Content

${text}

---

*This content was automatically extracted and processed.*
`;

  return markdownContent;
}

/**
 * Upload markdown content to Supabase storage
 * @param {string} markdownContent - Markdown content to upload
 * @param {string} originalFileName - Original file name
 * @param {string} userId - User ID for organization
 * @returns {Promise<Object>} Upload result with URL
 */
async function uploadToSupabase(markdownContent, originalFileName, userId) {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const markdownFileName = `${timestamp}_${sanitizedFileName}.md`;
    const filePath = `extracted-content/${userId}/${markdownFileName}`;
    
    console.log(`Uploading to Supabase: ${filePath}`);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, markdownContent, {
        contentType: 'text/markdown',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    console.log('Successfully uploaded to Supabase');
    
    return {
      path: filePath,
      url: urlData.publicUrl,
      fileName: markdownFileName,
      uploadData: data
    };
    
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }
}

/**
 * Batch process multiple files
 * @param {File[]} files - Array of files to process
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of processing results
 */
export async function processMultipleFiles(files, userId) {
  const results = [];
  
  for (const file of files) {
    const result = await processFile(file, userId);
    results.push(result);
  }
  
  return results;
}
