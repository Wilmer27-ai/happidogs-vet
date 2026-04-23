function copyDocumentStyles() {
  const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]')
  return Array.from(styleNodes).map((node) => node.outerHTML).join('\n')
}

function waitForImages(container, timeoutMs = 2000) {
  const images = Array.from(container.querySelectorAll('img'))
  if (images.length === 0) return Promise.resolve()

  const imagePromises = images.map((img) => {
    if (img.complete) return Promise.resolve()
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  })

  return Promise.race([
    Promise.all(imagePromises),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

export async function printSummaryPage(selector = '.summary-print-page') {
  const source = document.querySelector(selector)
  if (!source) return

  const printWindow = window.open('', '_blank', 'width=1024,height=900')
  if (!printWindow) return

  const html = source.outerHTML
  const styles = copyDocumentStyles()

  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Print Preview</title>
    ${styles}
    <style>
      @page { size: A4; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-shell {
        width: 210mm;
        margin: 0 auto;
      }
      .summary-print-page {
        margin: 0 !important;
        max-width: none !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body>
    <div class="print-shell">${html}</div>
  </body>
</html>`)
  printWindow.document.close()

  await waitForImages(printWindow.document.body)

  printWindow.focus()
  printWindow.print()
  printWindow.close()
}
