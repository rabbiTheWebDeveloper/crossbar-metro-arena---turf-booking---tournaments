// Re-export the canonical Crossbar Metro Arena mail utilities from src/utils/mail.js
export {
    isMailConfigured,
    isDeliverableEmail,
    sendWelcomeEmail,
    safeSendWelcomeEmail,
    sendInvestorWelcomeEmail,
    safeSendInvestorWelcomeEmail,
    sendAdminPasswordResetEmail,
    safeSendAdminPasswordResetEmail,
    sendBookingConfirmationEmail,
    safeSendBookingConfirmationEmail,
    sendEmailOtp,
    sendPasswordChangedEmail,
    sendCustomEmail
} from '@/utils/mail';
