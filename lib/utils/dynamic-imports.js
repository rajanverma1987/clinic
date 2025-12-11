/**
 * Dynamic Import Utilities
 * Lazy load heavy dependencies only when needed
 */

/**
 * Dynamically import html2canvas
 * Use this instead of direct import to reduce initial bundle size
 */
export async function loadHtml2Canvas() {
  if (typeof window === 'undefined') {
    throw new Error('html2canvas can only be used in the browser');
  }
  
  try {
    const html2canvas = (await import('html2canvas')).default;
    return html2canvas;
  } catch (error) {
    console.error('Failed to load html2canvas:', error);
    throw error;
  }
}

/**
 * Dynamically import jsPDF
 * Use this instead of direct import to reduce initial bundle size
 */
export async function loadJsPDF() {
  if (typeof window === 'undefined') {
    throw new Error('jsPDF can only be used in the browser');
  }
  
  try {
    const { jsPDF } = await import('jspdf');
    return jsPDF;
  } catch (error) {
    console.error('Failed to load jsPDF:', error);
    throw error;
  }
}

/**
 * Dynamically import both html2canvas and jsPDF
 * Useful when both are needed together (e.g., for PDF generation from HTML)
 */
export async function loadPdfLibraries() {
  if (typeof window === 'undefined') {
    throw new Error('PDF libraries can only be used in the browser');
  }
  
  try {
    const [html2canvas, { jsPDF }] = await Promise.all([
      import('html2canvas').then(m => m.default),
      import('jspdf'),
    ]);
    
    return { html2canvas, jsPDF };
  } catch (error) {
    console.error('Failed to load PDF libraries:', error);
    throw error;
  }
}

