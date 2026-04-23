// Reusable print CSS component for both SummaryStep and ConsultationSummary
import { useEffect } from 'react'
import { usePrintContext } from '../contexts/PrintContext'

function PrintStyles() {
  const { setIsPrinting } = usePrintContext()
  
  // Dynamically adjust print layout when print dialog opens
  useEffect(() => {
    const handleBeforePrint = () => {
      setIsPrinting(true)
      const spacerEl = document.querySelector('.flex-1.print\\:hidden')
      
      if (spacerEl) {
        spacerEl.style.display = 'none'
        spacerEl.style.visibility = 'hidden'
        spacerEl.style.height = '0'
      }
    }

    const handleAfterPrint = () => {
      setIsPrinting(false)
      const spacerEl = document.querySelector('.flex-1.print\\:hidden')
      if (spacerEl) {
        spacerEl.style.display = ''
        spacerEl.style.visibility = ''
        spacerEl.style.height = ''
      }
    }
    
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [setIsPrinting])

  return (
    <style>{`
      /* Hide scrollbar on screen but keep scrolling */
      .summary-print-wrap {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .summary-print-wrap::-webkit-scrollbar {
        display: none;
      }

      @media print {
        /* Force exact color printing */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Hide all layout elements (header, sidebar, navigation) */
        header,
        nav,
        aside,
        [class*="sidebar"],
        [class*="layout"],
        .print\:hidden {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Show only the page content */
        .summary-step,
        .consultation-summary {
          display: block !important;
          visibility: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Smart page sizing - fit content naturally */
        @page {
          size: A4;
          margin: 0mm;
        }

        /* Reset document margins */
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          height: auto !important;
          width: 100% !important;
        }

        /* Force-remove any layout top offset left by mobile header spacing */
        main,
        .main,
        [role="main"] {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        /* Remove all decorative spacing from page wrappers */
        .summary-step,
        .consultation-summary {
          min-height: auto !important;
          height: auto !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          page-break-after: auto !important;
        }

        /* Scrollable wrapper - make it flow naturally */
        .summary-print-wrap {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          flex: none !important;
          page-break-inside: auto !important;
        }

        /* Main page container - flexbox to push footer to bottom */
        .summary-print-page {
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 8mm !important;
          min-height: 297mm !important;
          height: 297mm !important;
          max-height: none !important;
          flex: none !important;
          page-break-inside: auto !important;
        }

        /* Content expands to fill available space */
        .summary-print-page > div:nth-child(2) {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Footer stays at bottom of receipt content */
        .summary-print-footer {
          margin-top: auto !important;
        }

        /* Clean print look: remove box fills/outlines from info containers */
        .summary-print-client-box,
        .summary-print-followup-box {
          background: transparent !important;
          border: none !important;
        }

        /* Hide toolbar/button controls in print */
        button,
        input,
        select,
        textarea {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }

        /* Hide print:hidden elements completely */
        .print\:hidden {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Hide any Edit buttons or UI elements specifically */
        button[class*="blue"],
        button[class*="Edit"],
        svg[class*="Edit"],
        div[class*="edit"],
        span[class*="Edit"],
        .flex.items-center.gap-1:not(.flex-1) {
          display: none !important;
        }

        /* Extra layer: hide any element with edit-related classes */
        [class*="edit"],
        [class*="Edit"],
        div[role="button"] {
          display: none !important;
        }

        /* Hide scrollbars completely */
        ::-webkit-scrollbar {
          display: none !important;
        }

        /* Keep table layout stable */
        table {
          width: 100% !important;
          margin: 0 !important;
          border-collapse: collapse !important;
        }

        /* Re-assert hidden UI classes after spacing overrides */
        .print\:hidden {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `}</style>
  )
}

export default PrintStyles
