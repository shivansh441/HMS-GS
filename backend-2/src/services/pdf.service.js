import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma.js';
/**
 * Fetches ledger data and returns a raw PDF Buffer.
 * Relies STRICTLY on the frozen mathematical totals in the database.
 */
export const generateInvoicePdfBuffer = async (ledgerId) => {
    const ledger = await prisma.financialLedger.findUnique({
        where: { id: ledgerId },
        include: {
            property: true,
            account: true,
            reservation: true
        }
    });
    if (!ledger)
        throw new Error('Ledger entry not found');
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            // --- PDF Formatting ---
            doc.fontSize(20).text(`TAX INVOICE`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(ledger.property.name);
            doc.text(ledger.property.address);
            doc.moveDown();
            doc.text(`Invoice Number: ${ledger.invoiceNumber || 'DRAFT'}`);
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
            doc.text(`Guest: ${ledger.account.firstName} ${ledger.account.lastName}`);
            doc.moveDown();
            // Ensure we use the pre-calculated, frozen numbers
            doc.text(`Description: ${ledger.description}`);
            doc.text(`Subtotal: ${ledger.currency} ${Number(ledger.subTotal).toFixed(2)}`);
            doc.text(`Taxes: ${ledger.currency} ${Number(ledger.taxAmount).toFixed(2)}`);
            doc.text(`Adjustments: ${ledger.currency} ${Number(ledger.adjustments).toFixed(2)}`);
            doc.moveDown();
            doc.fontSize(14).text(`Total Amount: ${ledger.currency} ${Number(ledger.totalAmount).toFixed(2)}`, { underline: true });
            doc.fontSize(14).text(`Amount Paid: ${ledger.currency} ${Number(ledger.paidAmount).toFixed(2)}`);
            const due = (Number(ledger.totalAmount) - Number(ledger.paidAmount));
            doc.fontSize(14).text(`Balance Due: ${ledger.currency} ${due.toFixed(2)}`);
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
};
//# sourceMappingURL=pdf.service.js.map