// Reusable print CSS component for both SummaryStep and ConsultationSummary
function PrintStyles() {
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
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: A4;
          margin: 8mm;
        }

        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          height: auto !important;
        }

        .summary-step,
        .consultation-summary {
          min-height: auto !important;
          height: auto !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          page-break-after: avoid !important;
          orphans: 0 !important;
          widows: 0 !important;
        }

        .summary-print-wrap {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          flex: none !important;
          page-break-inside: avoid !important;
        }

        /* FIX: Cap content to fit 1 page exactly (A4 = 297mm, minus 16mm margins = 281mm) */
        .summary-print-page {
          min-height: auto !important;
          height: auto !important;
          max-height: 277mm !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          page-break-inside: avoid !important;
          display: block !important;
          overflow: hidden !important;
        }

        /* Hide decorative bars to save space */
        .summary-print-page > div:first-child,
        .summary-print-page > div:last-child {
          display: none !important;
        }

        /* Hide UI elements */
        button {
          display: none !important;
        }

        .print\:hidden {
          display: none !important;
        }

        /* Tight table styling */
        table {
          page-break-inside: avoid !important;
          width: 100%;
          margin: 0 !important;
          border-collapse: collapse !important;
        }

        tr, td, th {
          page-break-inside: avoid !important;
          orphans: 0 !important;
          widows: 0 !important;
        }

        /* Reduce cell padding to fit content */
        td, th {
          padding: 2px 4px !important;
          font-size: 8px !important;
          line-height: 1.2 !important;
        }
      }
    `}</style>
  )
}

export default PrintStyles
