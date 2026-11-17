import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function QuotationPdfPreview({ blob, fileName, onClose, onDownload, onShare }) {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let task;
    setLoading(true); setError(""); setPdf(null);
    blob.arrayBuffer().then(data => {
      if (!active) return;
      task = pdfjsLib.getDocument({ data: new Uint8Array(data) });
      return task.promise;
    }).then(document => {
      if (!active || !document) return;
      setPdf(document); setPage(1); setLoading(false);
    }).catch(err => {
      if (active) { setError(err?.message || "Unable to open this quotation PDF."); setLoading(false); }
    });
    return () => { active = false; if (task) task.destroy(); };
  }, [blob]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let active = true;
    let renderTask;
    setLoading(true); setError("");
    pdf.getPage(page).then(pdfPage => {
      if (!active) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const fit = Math.min(1.8, Math.max(.5, (window.innerWidth - 32) / base.width));
      const viewport = pdfPage.getViewport({ scale: zoom * fit });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      renderTask = pdfPage.render({ canvasContext: context, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null });
      return renderTask.promise;
    }).then(() => { if (active) setLoading(false); }).catch(err => {
      if (active && err?.name !== "RenderingCancelledException") { setError(err?.message || "PDF page could not be rendered."); setLoading(false); }
    });
    return () => { active = false; if (renderTask) renderTask.cancel(); };
  }, [pdf, page, zoom]);

  return <div className="sw-pdf-preview-backdrop">
    <section className="sw-pdf-preview" role="dialog" aria-modal="true" aria-label="Quotation PDF preview">
      <header className="sw-pdf-preview-header">
        <div><strong>Quotation Preview</strong><span>{fileName}</span></div>
        <button type="button" onClick={onClose} aria-label="Close PDF preview">×</button>
      </header>
      <div className="sw-pdf-toolbar">
        <div className="sw-pdf-page-controls">
          <button type="button" disabled={!pdf || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
          <span>{pdf ? page + " / " + pdf.numPages : "— / —"}</span>
          <button type="button" disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(p => Math.min(pdf.numPages, p + 1))}>›</button>
        </div>
        <div className="sw-pdf-zoom-controls">
          <button type="button" onClick={() => setZoom(z => Math.max(.7, +(z - .15).toFixed(2)))} disabled={zoom <= .7}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(z => Math.min(2, +(z + .15).toFixed(2)))} disabled={zoom >= 2}>+</button>
        </div>
      </div>
      <div className="sw-pdf-canvas-area">
        {loading && <div className="sw-pdf-loading">Preparing PDF page…</div>}
        {error && <div className="sw-pdf-error">{error}</div>}
        <canvas ref={canvasRef} aria-label={"Quotation PDF page " + page}/>
      </div>
      <footer className="sw-pdf-preview-footer">
        <button type="button" className="sw-secondary" onClick={onShare}>Share</button>
        <button type="button" className="sw-primary" onClick={onDownload}>Download PDF</button>
      </footer>
    </section>
  </div>;
}
