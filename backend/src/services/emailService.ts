import { Resend } from 'resend';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'simulated';
  recipient: string;
  error?: string;
}

export async function sendPayslipEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'payslips@peoplepay360.com';

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments?.map(a => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64')
        }))
      });

      if (error) {
        console.error('[Resend API Error]:', error);
        return {
          success: false,
          status: 'sent',
          recipient: payload.to,
          error: error.message
        };
      }

      console.log(`[Resend Success]: Sent email to ${payload.to} (ID: ${data?.id})`);
      return {
        success: true,
        messageId: data?.id,
        status: 'sent',
        recipient: payload.to
      };
    } catch (err: any) {
      console.error('[Resend Exception]:', err);
      return {
        success: false,
        status: 'sent',
        recipient: payload.to,
        error: err.message
      };
    }
  } else {
    // Transparent, fully functional simulated email delivery with formatted audit logs
    console.log(`\n================== [PEOPLEPAY360 EMAIL DISPATCH LOG] ==================`);
    console.log(`[STATUS]: Simulated Delivery (Real API code ready; RESEND_API_KEY not set)`);
    console.log(`[TO]: ${payload.to}`);
    console.log(`[FROM]: ${fromEmail}`);
    console.log(`[SUBJECT]: ${payload.subject}`);
    console.log(`[ATTACHMENTS]: ${payload.attachments?.map(a => a.filename).join(', ') || 'None'}`);
    console.log(`=======================================================================\n`);

    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'simulated',
      recipient: payload.to
    };
  }
}
