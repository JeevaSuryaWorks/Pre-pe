import { format } from 'date-fns';

export const generateInvoice = (transaction: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to download invoice.");
        return;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${transaction.id}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
            .invoice-title { font-size: 32px; font-weight: bold; color: #333; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .table th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 1px solid #eee; }
            .table td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-row td { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .success { background: #dcfce7; color: #166534; }
            .failed { background: #fee2e2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Prepe</div>
            <div class="invoice-title">INVOICE</div>
        </div>

        <div class="grid">
            <div>
                <div class="label">Billed To</div>
                <div class="value">Customer</div>
                <div class="value">Mobile: ${transaction.mobile_number || 'N/A'}</div>
            </div>
            <div style="text-align: right;">
                <div class="label">Invoice Details</div>
                <div class="value">No: ${transaction.id.substring(0, 8)}</div>
                <div class="value">Date: ${format(new Date(transaction.created_at), 'MMM d, yyyy')}</div>
                <div class="value">Status: <span class="badge ${transaction.status === 'SUCCESS' ? 'success' : 'failed'}">${transaction.status}</span></div>
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        ${transaction.service_type} Recharge<br>
                        <span style="font-size: 12px; color: #666;">Operator Ref: ${transaction.providerRef || 'N/A'}</span>
                    </td>
                    <td style="text-align: right;">₹${Number(transaction.amount).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td>Total</td>
                    <td style="text-align: right;">₹${Number(transaction.amount).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>Thank you for using Prepe!</p>
            <p>This is a computer generated invoice and does not require signature.</p>
        </div>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
