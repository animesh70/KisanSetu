function formatPrice(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function formatDate(value) { return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }

function receiptHtml(application) {
  const bank = application.selectedBank;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${application.id}</title>
  <style>body{font-family:Arial,sans-serif;color:#18342a;padding:32px;max-width:560px;margin:0 auto}h1{font-size:18px;margin:0 0 4px}
  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #e5ebe6;font-size:13px}
  .row span:first-child{color:#668075}.row span:last-child{font-weight:700}
  .status{display:inline-block;margin-top:10px;padding:6px 10px;border-radius:8px;background:#e8f5eb;color:#1d7144;font-weight:700;font-size:12px}</style>
  </head><body>
  <p style="color:#668075;font-weight:700;font-size:10px;letter-spacing:.1em">KISANSETU · SMART LOAN RECEIPT</p>
  <h1>Loan Application ${application.id}</h1>
  <span class="status">${application.status.replaceAll('-', ' ')}</span>
  <div style="margin-top:18px">
  <div class="row"><span>Applicant</span><span>${application.applicantName}</span></div>
  <div class="row"><span>Loan type</span><span>${application.category === 'crop' ? 'Crop loan' : 'Business loan'} · ${application.cropOrBusiness}</span></div>
  <div class="row"><span>Selected bank</span><span>${bank ? bank.name : 'Under review'}</span></div>
  <div class="row"><span>Scheme</span><span>${bank ? bank.scheme : '—'}</span></div>
  <div class="row"><span>Loan amount</span><span>${formatPrice(application.amount)}</span></div>
  <div class="row"><span>Interest rate</span><span>${bank ? `${bank.interestRate}% p.a.` : '—'}</span></div>
  <div class="row"><span>Tenure</span><span>${bank ? `${bank.tenureMonths} months` : '—'}</span></div>
  <div class="row"><span>Purpose</span><span>${application.purpose}</span></div>
  <div class="row"><span>Submitted on</span><span>${formatDate(application.submittedAt)}</span></div>
  </div>
  </body></html>`;
}

export default function LoanReceipt({ application, onClose, onNewApplication }) {
  const bank = application.selectedBank;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=640,height=760');
    if (!printWindow) return;
    printWindow.document.write(receiptHtml(application));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([receiptHtml(application)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KisanSetu-Loan-Receipt-${application.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return <div className="modal-backdrop">
    <div className="lot-modal receipt-card">
      <div className="modal-heading">
        <div><p className="eyebrow">APPLICATION RECEIPT</p><h2>{application.id}</h2></div>
        <button type="button" className="icon-button" onClick={onClose}>×</button>
      </div>
      <span className="best-badge receipt-status">{application.status.replaceAll('-', ' ')}</span>
      <div className="receipt-rows">
        <div className="receipt-row"><span>Applicant</span><strong>{application.applicantName}</strong></div>
        <div className="receipt-row"><span>Loan type</span><strong>{application.category === 'crop' ? 'Crop loan' : 'Business loan'} · {application.cropOrBusiness}</strong></div>
        <div className="receipt-row"><span>Selected bank</span><strong>{bank ? bank.name : 'Under review'}</strong></div>
        <div className="receipt-row"><span>Scheme</span><strong>{bank ? bank.scheme : '—'}</strong></div>
        <div className="receipt-row"><span>Loan amount</span><strong>{formatPrice(application.amount)}</strong></div>
        <div className="receipt-row"><span>Interest rate</span><strong>{bank ? `${bank.interestRate}% p.a.` : '—'}</strong></div>
        <div className="receipt-row"><span>Tenure</span><strong>{bank ? `${bank.tenureMonths} months` : '—'}</strong></div>
        <div className="receipt-row"><span>Purpose</span><strong>{application.purpose}</strong></div>
        <div className="receipt-row"><span>Submitted on</span><strong>{formatDate(application.submittedAt)}</strong></div>
      </div>
      <div className="receipt-actions">
        <button type="button" className="outline-button" onClick={handlePrint}>Print</button>
        <button type="button" className="outline-button" onClick={handleDownload}>Download</button>
        <button type="button" className="primary-button" onClick={onNewApplication}>New application</button>
      </div>
    </div>
  </div>;
}
