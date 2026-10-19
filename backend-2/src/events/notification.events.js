import EventEmitter from 'events';
import { prisma } from '../utils/prisma.js';
import nodemailer from 'nodemailer';
import { generateInvoicePdfBuffer } from '../services/pdf.service.js';
export const notificationQueue = new EventEmitter();
// Configure your email transport (AWS SES, SendGrid, Gmail, etc.)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
// Helper to log failures to the database for cron-job retries
const logSystemEvent = async (entityType, entityId, action, details) => {
    try {
        await prisma.systemStatusLog.create({
            data: { entityType, entityId, action, details }
        });
    }
    catch (logError) {
        console.error('CRITICAL: Failed to write to SystemStatusLog', logError);
    }
};
// ============================================================================
// 1. INVOICE EMAIL (With PDF Attachment)
// ============================================================================
notificationQueue.on('SEND_INVOICE_EMAIL', async ({ ledgerId, recipientEmail, propertyName }) => {
    try {
        const pdfBuffer = await generateInvoicePdfBuffer(ledgerId);
        await transporter.sendMail({
            from: `"Billing - ${propertyName}" <billing@maharanapratap.com>`,
            to: recipientEmail,
            subject: `Your Invoice from ${propertyName}`,
            text: 'Please find your official tax invoice attached.',
            attachments: [{ filename: `Invoice_${ledgerId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        });
        await logSystemEvent('FINANCIAL_LEDGER', ledgerId, 'EMAIL_SENT_SUCCESS', { recipientEmail, type: 'INVOICE' });
    }
    catch (error) {
        console.error(`[Email Failed] Invoice to ${recipientEmail}:`, error);
        await logSystemEvent('FINANCIAL_LEDGER', ledgerId, 'EMAIL_SENT_FAILED', { recipientEmail, type: 'INVOICE', error: error.message });
    }
});
// ============================================================================
// 2. WELCOME / REGISTRATION EMAIL
// ============================================================================
notificationQueue.on('SEND_WELCOME_EMAIL', async ({ accountId, email, firstName }) => {
    try {
        await transporter.sendMail({
            from: `"Maharanapratap Stays" <hello@maharanapratap.com>`,
            to: email,
            subject: `Welcome to Maharanapratap, ${firstName}!`,
            html: `
        <h3>Hi ${firstName},</h3>
        <p>Your account has been successfully created. You can now book rooms, manage your stays, and access property amenities directly from your dashboard.</p>
        <p>We look forward to hosting you!</p>
      `
        });
        await logSystemEvent('ACCOUNT', accountId, 'EMAIL_SENT_SUCCESS', { type: 'WELCOME', email });
    }
    catch (error) {
        console.error(`[Email Failed] Welcome to ${email}:`, error);
    }
});
// ============================================================================
// 3. LOGIN OTP EMAIL
// ============================================================================
notificationQueue.on('SEND_OTP_EMAIL', async ({ accountId, email, otpCode }) => {
    try {
        await transporter.sendMail({
            from: `"Maharanapratap Security" <security@maharanapratap.com>`,
            to: email,
            subject: `${otpCode} is your Login OTP`,
            html: `
        <h2>${otpCode}</h2>
        <p>Use this code to log into your account. This code expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
        });
        await logSystemEvent('ACCOUNT', accountId, 'EMAIL_SENT_SUCCESS', { type: 'OTP', email });
    }
    catch (error) {
        console.error(`[Email Failed] OTP to ${email}:`, error);
    }
});
// ============================================================================
// 4. BOOKING CONFIRMATION EMAIL
// ============================================================================
notificationQueue.on('SEND_BOOKING_CONFIRMATION', async ({ reservationId, email, guestName, checkIn, propertyName }) => {
    try {
        const formattedDate = new Date(checkIn).toLocaleDateString('en-IN');
        await transporter.sendMail({
            from: `"Reservations - ${propertyName}" <bookings@maharanapratap.com>`,
            to: email,
            subject: `Booking Confirmed: ${propertyName}`,
            html: `
        <h3>Booking Confirmation</h3>
        <p>Dear ${guestName},</p>
        <p>Your reservation (ID: <b>#${reservationId}</b>) at <b>${propertyName}</b> is confirmed!</p>
        <p><b>Expected Check-In:</b> ${formattedDate} from 2:00 PM onwards.</p>
        <p>Safe travels, and see you soon.</p>
      `
        });
        await logSystemEvent('RESERVATION', reservationId, 'EMAIL_SENT_SUCCESS', { type: 'BOOKING_CONFIRMATION', email });
    }
    catch (error) {
        console.error(`[Email Failed] Booking Confirmation to ${email}:`, error);
    }
});
// ============================================================================
// 5. POST-CHECKOUT THANK YOU EMAIL
// ============================================================================
notificationQueue.on('SEND_CHECKOUT_THANK_YOU', async ({ reservationId, email, guestName, propertyName }) => {
    try {
        await transporter.sendMail({
            from: `"Management - ${propertyName}" <feedback@maharanapratap.com>`,
            to: email,
            subject: `Thank you for staying at ${propertyName}`,
            html: `
        <h3>Thank you, ${guestName}!</h3>
        <p>We hope you enjoyed your stay at ${propertyName}. Your check-out is complete.</p>
        <p>We would love to host you again in the future.</p>
      `
        });
        await logSystemEvent('RESERVATION', reservationId, 'EMAIL_SENT_SUCCESS', { type: 'CHECKOUT_THANK_YOU', email });
    }
    catch (error) {
        console.error(`[Email Failed] Checkout Thank You to ${email}:`, error);
    }
});
//# sourceMappingURL=notification.events.js.map