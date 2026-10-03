import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Dialog from '../Dialog';
import InvoiceDocument from './InvoiceDocument';
import { Entry } from '../../data';
import { BTN_PRIMARY, BTN_SECONDARY } from '../ui';

interface InvoiceViewProps {
  invoice: Entry;
  today: string;
  onClose: () => void;
  onEdit: () => void;
}

// Read-only invoice with Edit and "Download PDF". PDF export is the browser's
// print pipeline (Save as PDF) on a print-only copy of the same document: no
// PDF library to ship, and the output is real selectable text.
const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, today, onClose, onEdit }) => {
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'invoice-print-root';
    document.body.appendChild(el);
    setPrintRoot(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const originalTitle = React.useRef('');
  useEffect(() => {
    const restore = () => {
      if (originalTitle.current) document.title = originalTitle.current;
    };
    window.addEventListener('afterprint', restore);
    return () => window.removeEventListener('afterprint', restore);
  }, []);

  const handlePrint = () => {
    // The document title becomes the suggested PDF file name.
    originalTitle.current = document.title;
    document.title = invoice.UUID;
    window.print();
  };

  return (
    <Dialog title={`Invoice ${invoice.UUID}`} variant="light" onClose={onClose} wide>
      {() => (
        <>
          <div className="mb-4 overflow-auto rounded-lg border border-slate-200 shadow-inner dark:border-slate-700">
            <InvoiceDocument invoice={invoice} today={today} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handlePrint} className={BTN_PRIMARY}>
              Download PDF
            </button>
            <button type="button" onClick={onEdit} className={BTN_SECONDARY}>
              Edit
            </button>
          </div>
          {printRoot && createPortal(<InvoiceDocument invoice={invoice} today={today} />, printRoot)}
        </>
      )}
    </Dialog>
  );
};

export default InvoiceView;
