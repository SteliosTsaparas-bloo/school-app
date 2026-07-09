"use client";

import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

type QrLinkModalProps = {
  studentName: string;
  studentUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export function QrLinkModal({
  studentName,
  studentUrl,
  isOpen,
  onClose,
}: QrLinkModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handlePrint() {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=480,height=640");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="el">
        <head>
          <title>QR — ${studentName}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 40px;
              color: #18181b;
            }
            h1 { font-size: 20px; font-weight: 400; margin: 0 0 8px; }
            p { font-size: 12px; color: #71717a; margin: 0 0 32px; word-break: break-all; }
            svg { display: block; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(studentUrl);
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-zinc-900/20"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        className="relative w-full max-w-md border border-zinc-200 bg-white p-10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 transition-colors hover:text-zinc-900"
          aria-label="Κλείσιμο"
        >
          ✕
        </button>

        <header className="mb-10 text-center">
          <p className="mb-2 text-sm tracking-[0.15em] text-zinc-500 uppercase">
            Σύνδεσμος γονέα
          </p>
          <h2
            id="qr-modal-title"
            className="text-2xl font-light tracking-tight text-zinc-900"
          >
            {studentName}
          </h2>
        </header>

        <div ref={printRef} className="flex flex-col items-center">
          <QRCodeSVG value={studentUrl} size={200} level="M" marginSize={2} />
          <p className="mt-8 max-w-xs text-center text-sm leading-relaxed text-zinc-500">
            {studentUrl}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 border border-zinc-200 py-3 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
          >
            Αντιγραφή Link
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 border border-zinc-900 py-3 text-sm text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            Εκτύπωση QR
          </button>
        </div>
      </div>
    </div>
  );
}
