import React, { useEffect, useState } from 'react';
import { getSandboxEwayBillStatus, getSandboxEwayBillHealth } from '../services/ewayBillSandboxService';

function EwayBillSandboxPanel({ invoice }) {
  const [records, setRecords] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!invoice?.company_id || !invoice?.id) return;
    setLoading(true);
    setError('');
    try {
      const [statusRows, healthInfo] = await Promise.all([
        getSandboxEwayBillStatus(invoice.company_id, invoice.id),
        getSandboxEwayBillHealth(invoice.company_id),
      ]);
      setRecords(statusRows);
      setHealth(healthInfo);
    } catch (err) {
      setError(err?.message || 'Unable to load E-Way Bill sandbox status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [invoice?.company_id, invoice?.id]);

  const current = records[0];
  const label = current?.status || 'not_generated';
  const readable = label.replace(/_/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());

  return (
    <section style={{ margin: '20px 0', padding: 16, border: '1px solid #b8d6e8', borderRadius: 12, background: '#f3f9fd' }}>
      <h3 style={{ marginTop: 0 }}>E-Way Bill (Sandbox)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <strong>Status: {readable}</strong>
        <button type="button" onClick={refresh} disabled={loading}>{loading ? 'Checking…' : 'Refresh status'}</button>
      </div>
      {current?.eway_bill_number && <p><strong>E-Way Bill No:</strong> {current.eway_bill_number}</p>}
      {current?.generated_at && <p><strong>Generated:</strong> {new Date(current.generated_at).toLocaleString()}</p>}
      {current?.valid_until && <p><strong>Valid until:</strong> {new Date(current.valid_until).toLocaleString()}</p>}
      {current?.cancelled_at && <p><strong>Cancelled:</strong> {new Date(current.cancelled_at).toLocaleString()}</p>}
      {current?.provider_error_message && <p role="alert"><strong>Last provider error:</strong> {current.provider_error_message}</p>}
      {error && <p role="alert" style={{ color: '#a11' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" disabled title="Generation will be enabled after the sandbox provider contract and credentials are verified.">Generate E-Way Bill (not enabled)</button>
        <button type="button" disabled title="Cancellation will be enabled after generation API integration and sandbox tests.">Cancel E-Way Bill (not enabled)</button>
      </div>
      {health && <small style={{ display: 'block', marginTop: 10 }}>Sandbox readiness: {health.adapter_status || 'Unknown'} · Production: disabled</small>}
      <small style={{ display: 'block', marginTop: 6 }}>No live GST portal request is sent from this screen yet. Multi-vehicle and other portal operations are outside SYD's scope.</small>
    </section>
  );
}

function SalesInvoiceView({ invoice, items, onClose }) {
  if (!invoice) return null;

  return (
    <div className="invoice-modal">
      <div className="invoice-modal-content">
        <h2>Invoice Details</h2>
        <p><strong>Invoice No:</strong> {invoice.invoice_no}</p>
        <p><strong>Date:</strong> {invoice.invoice_date}</p>
        <p><strong>Customer:</strong> {invoice.customer_name}</p>
        <table className="sales-grid">
          <thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST %</th><th>Amount</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.item_name}</td><td>{item.hsn_sac}</td><td>{item.qty}</td><td>{item.rate}</td><td>{item.gst_rate}</td><td>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Taxable Value: ₹ {invoice.taxable_value}</h3>
        <h3>GST: ₹ {invoice.igst}</h3>
        <h2>Grand Total: ₹ {invoice.total_amount}</h2>
        <EwayBillSandboxPanel invoice={invoice} />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default SalesInvoiceView;
