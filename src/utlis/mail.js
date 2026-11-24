// Re-export the canonical Crossbar Metro Arena mail utilities from src/utils/mail.js
export {
    isMailConfigured,
    isDeliverableEmail,
    sendWelcomeEmail,
    safeSendWelcomeEmail,
    sendEmailOtp,
    sendPasswordChangedEmail,
    sendCustomEmail
} from '@/utils/mail';
