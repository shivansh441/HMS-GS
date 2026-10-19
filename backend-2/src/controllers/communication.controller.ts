import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { generateInvoicePdfBuffer } from '../services/pdf.service.js';
import { notificationQueue } from '../events/notification.events.js';

// Anti-Spam Cache: Maps ledgerId to a timestamp
const emailRateLimitCache = new Map<number, number>(); 

export const downloadInvoicePdf = async (req: Request, res: Response) => {
  try {
    const ledgerId = parseInt(req.params.ledgerId as string, 10);
    
    const pdfBuffer = await generateInvoicePdfBuffer(ledgerId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${ledgerId}.pdf`);
    
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF Download Error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF.' });
  }
};

export const emailInvoiceToGuest = async (req: Request, res: Response) => {
  try {
    const ledgerId = parseInt(req.params.ledgerId as string, 10);

    // THE SPAM CANNON TRAP: Cooldown of 60 seconds
    const lastSentTime = emailRateLimitCache.get(ledgerId);
    if (lastSentTime && (Date.now() - lastSentTime < 60000)) {
      return res.status(429).json({ error: 'Please wait 60 seconds before resending this email.' });
    }

    const ledger = await prisma.financialLedger.findUnique({
      where: { id: ledgerId },
      include: { account: true, property: true }
    });

    if (!ledger || !ledger.account.email) {
      return res.status(400).json({ error: 'Cannot send email. Guest has no email address on file.' });
    }

    emailRateLimitCache.set(ledgerId, Date.now());

    // Trigger the background event
    notificationQueue.emit('SEND_INVOICE_EMAIL', {
      ledgerId,
      recipientEmail: ledger.account.email,
      propertyName: ledger.property.name
    });

    return res.status(200).json({ message: 'Invoice queued for emailing successfully.' });

  } catch (error: any) {
    console.error('Email Queuing Error:', error);
    return res.status(500).json({ error: 'Failed to queue email.' });
  }
};