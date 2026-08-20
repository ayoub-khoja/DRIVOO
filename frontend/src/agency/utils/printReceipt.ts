/**
 * Print only the receipt node in a hidden iframe (one A4 page, no app chrome).
 */
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: auto;
    overflow: hidden;
    background: #fff;
    color: #12233a;
    font-family: Outfit, Cairo, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .agency-receipt-sheet {
    width: 100%;
    max-width: none;
    page-break-after: avoid;
    page-break-inside: auto;
    break-inside: auto;
  }
  .agency-receipt-sheet-frame {
    position: relative;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
  .agency-receipt-sheet-frame::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px solid rgb(245 166 35 / 28%);
    border-radius: 8px;
    pointer-events: none;
    z-index: 1;
  }
  .agency-receipt-hero {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px 10px;
    background:
      radial-gradient(circle at 100% 0%, rgb(255 122 24 / 28%), transparent 42%),
      linear-gradient(135deg, #0b1626 0%, #12233a 55%, #1a2f4a 100%);
    color: #fff;
  }
  .agency-receipt-hero::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 3px;
    background: linear-gradient(90deg, #f5a623, #ff7a18 45%, #ffd39a);
  }
  .agency-receipt-hero-brand {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }
  .agency-receipt-logo,
  .agency-receipt-logo-fallback {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid rgb(255 255 255 / 22%);
  }
  .agency-receipt-logo-fallback {
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #f5a623, #ff7a18);
    color: #fff;
    font-family: Syne, Cairo, sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .agency-receipt-brand-kicker {
    margin: 0 0 2px;
    color: #ffb45c;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.12em;
  }
  .agency-receipt-hero-brand h3 {
    margin: 0 0 2px;
    font-family: Syne, Cairo, sans-serif;
    font-size: 0.95rem;
    color: #fff;
  }
  .agency-receipt-hero-brand p {
    margin: 0;
    color: rgb(255 255 255 / 72%);
    font-size: 0.7rem;
    line-height: 1.3;
  }
  .agency-receipt-hero-doc { text-align: right; min-width: 140px; }
  .agency-receipt-badge {
    display: inline-flex;
    margin-bottom: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgb(255 255 255 / 12%);
    border: 1px solid rgb(255 255 255 / 18%);
    color: #fff;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .agency-receipt-doc-number {
    display: block;
    font-family: Syne, Cairo, sans-serif;
    font-size: 0.95rem;
    color: #fff;
  }
  .agency-receipt-doc-date {
    margin: 2px 0 6px;
    color: rgb(255 255 255 / 72%);
    font-size: 0.7rem;
  }
  .agency-receipt-paid-stamp {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, #f5a623, #ff7a18);
    color: #1a1206;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .agency-receipt-parties {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 10px 12px 2px;
  }
  .agency-receipt-party-card {
    background: #f7f9fc;
    border: 1px solid #e6ebf2;
    border-radius: 10px;
    padding: 8px 10px;
  }
  .agency-receipt-party-card > span {
    display: block;
    color: #7a889c;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .agency-receipt-party-card > strong {
    display: block;
    font-family: Syne, Cairo, sans-serif;
    font-size: 0.88rem;
    color: #0b1626;
    margin-bottom: 1px;
  }
  .agency-receipt-party-card p {
    margin: 0;
    color: #5b6b80;
    font-size: 0.72rem;
    line-height: 1.3;
  }
  .agency-receipt-inline-label { margin-top: 8px !important; }
  .agency-receipt-table-card {
    position: relative;
    z-index: 2;
    margin: 8px 12px;
    border: 1px solid #e6ebf2;
    border-radius: 10px;
    overflow: hidden;
  }
  .agency-receipt-lines { width: 100%; border-collapse: collapse; }
  .agency-receipt-lines th,
  .agency-receipt-lines td {
    padding: 7px 10px;
    text-align: left;
    border-bottom: 1px solid #eef2f7;
  }
  .agency-receipt-lines th:last-child,
  .agency-receipt-lines td:last-child {
    text-align: right;
    white-space: nowrap;
  }
  .agency-receipt-lines thead th {
    background: #0b1626;
    color: rgb(255 255 255 / 82%);
    font-size: 0.58rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .agency-receipt-line-title { color: #12233a; font-weight: 700; font-size: 0.8rem; }
  .agency-receipt-lines tbody td { color: #12233a; font-size: 0.8rem; }
  .agency-receipt-lines tbody td:last-child { font-weight: 800; }
  .agency-receipt-total-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    background: #fff8f0;
    border-top: 1px solid #f0e0c8;
  }
  .agency-receipt-total-bar span {
    display: block;
    color: #0b1626;
    font-family: Syne, Cairo, sans-serif;
    font-size: 0.8rem;
    font-weight: 800;
  }
  .agency-receipt-total-bar p {
    margin: 1px 0 0;
    color: #8a6a3d;
    font-size: 0.65rem;
  }
  .agency-receipt-total-bar > strong {
    font-family: Syne, Cairo, sans-serif;
    font-size: 1.05rem;
    color: #0b1626;
  }
  .agency-receipt-notes {
    position: relative;
    z-index: 2;
    margin: 0 12px 8px;
    padding: 7px 9px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px dashed #d5deea;
  }
  .agency-receipt-notes > span {
    display: block;
    margin-bottom: 3px;
    color: #7a889c;
    font-size: 0.58rem;
    font-weight: 800;
    text-transform: uppercase;
  }
  .agency-receipt-notes p {
    margin: 0;
    color: #3d4f66;
    font-size: 0.74rem;
    max-height: 2.6em;
    overflow: hidden;
  }
  .agency-receipt-foot {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 12px 6px;
  }
  .agency-receipt-sign span {
    display: block;
    margin-bottom: 10px;
    color: #7a889c;
    font-size: 0.58rem;
    font-weight: 800;
    text-transform: uppercase;
  }
  .agency-receipt-sign-line {
    height: 1px;
    background: #c5d0de;
    margin-bottom: 4px;
  }
  .agency-receipt-sign p {
    margin: 0;
    color: #5b6b80;
    font-size: 0.7rem;
  }
  .agency-receipt-bottom {
    position: relative;
    z-index: 2;
    margin: 0 12px 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, #0b1626, #1a2f4a);
    color: #fff;
  }
  .agency-receipt-bottom p { margin: 0; font-weight: 700; font-size: 0.78rem; }
  .agency-receipt-foot-muted {
    margin-top: 2px !important;
    color: rgb(255 255 255 / 68%) !important;
    font-weight: 500 !important;
    font-size: 0.66rem !important;
  }
`

let isPrinting = false

export const printReceiptElement = (elementId = 'agency-receipt-print', title = 'Reçu') => {
  if (isPrinting) {
    return
  }

  const source = document.getElementById(elementId)
  if (!source) {
    return
  }

  isPrinting = true

  // Remove any previous print iframe
  document.querySelectorAll('iframe[data-receipt-print="1"]').forEach((node) => node.remove())

  const iframe = document.createElement('iframe')
  iframe.setAttribute('data-receipt-print', '1')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    isPrinting = false
    return
  }

  const safeTitle = title.replace(/[<>&"']/g, '')
  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>${PRINT_STYLES}</style>
</head>
<body>${source.outerHTML}</body>
</html>`)
  doc.close()

  let printed = false
  const cleanup = () => {
    isPrinting = false
    window.setTimeout(() => iframe.remove(), 400)
  }

  const triggerPrint = () => {
    if (printed) {
      return
    }
    printed = true
    win.focus()
    win.addEventListener('afterprint', cleanup, { once: true })
    win.print()
    // Fallback cleanup if afterprint does not fire
    window.setTimeout(cleanup, 2000)
  }

  window.setTimeout(triggerPrint, 350)
}
