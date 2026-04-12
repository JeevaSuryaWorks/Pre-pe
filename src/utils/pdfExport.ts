import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface LedgerEntry {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
}

interface UserInfo {
    id: string;
    name?: string;
    phone?: string;
}

export const generateTransactionPDF = async (
    data: LedgerEntry[], 
    user: UserInfo, 
    title: string = "Account Statement"
) => {
    // Create doc
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("Pre-pe", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(title.toUpperCase(), pageWidth - 14, 25, { align: 'right' });
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth - 14, 32, { align: 'right' });

    // User Information
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("CUSTOMER DETAILS", 14, 55);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`User ID: ${user.id}`, 14, 62);
    if (user.phone) doc.text(`Mobile: ${user.phone}`, 14, 67);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 75, pageWidth - 14, 75);

    // Table
    const tableData = data.map(entry => [
        format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm'),
        entry.description,
        entry.type,
        `INR ${entry.amount.toFixed(2)}`,
        `INR ${entry.balance_after.toFixed(2)}`
    ]);

    (doc as any).autoTable({
        startY: 85,
        head: [['Date', 'Description', 'Type', 'Amount', 'Balance']],
        body: tableData,
        headStyles: { 
            fillColor: [30, 41, 59], 
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20 },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("This is an electronically generated statement and does not require a signature.", 14, finalY + 20);
    doc.text("© 2026 Pre-pe Financial Services. All rights reserved.", 14, finalY + 25);

    return doc;
};

export const generateHistoryPDF = async (
    data: Transaction[], 
    user: UserInfo, 
    title: string = "Transaction History"
) => {
    // Create doc
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900 (darker for history)
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("Pre-pe", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(title.toUpperCase(), pageWidth - 14, 25, { align: 'right' });
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth - 14, 32, { align: 'right' });

    // User Information
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("ACCOUNT SUMMARY", 14, 55);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`User ID: ${user.id}`, 14, 62);
    if (user.phone) doc.text(`Mobile: ${user.phone}`, 14, 67);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 75, pageWidth - 14, 75);

    // Table
    const tableData = data.map(tx => [
        format(new Date(tx.created_at), 'MMM dd, yyyy'),
        tx.mobile_number || tx.dth_id || 'N/A',
        tx.operator_name || tx.service_type,
        tx.status,
        `INR ${Number(tx.amount).toFixed(2)}`
    ]);

    (doc as any).autoTable({
        startY: 85,
        head: [['Date', 'Number/ID', 'Operator', 'Status', 'Amount']],
        body: tableData,
        headStyles: { 
            fillColor: [15, 23, 42], 
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 25 },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for using Pre-pe (Digital Mobility).", 14, finalY + 20);
    doc.text("© 2026 Pre-pe Financial Services. All rights reserved.", 14, finalY + 25);

    return doc;
};

export const sharePDF = async (doc: any, filename: string) => {
    const pdfOutput = doc.output('blob');
    const file = new File([pdfOutput], filename, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Transaction Statement',
                text: 'Sharing my Pre-pe transaction statement.'
            });
            return true;
        } catch (error) {
            console.error("Error sharing:", error);
            doc.save(filename);
            return false;
        }
    } else {
        // Fallback to download
        doc.save(filename);
        return false;
    }
};
