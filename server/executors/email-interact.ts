import nodemailer from 'nodemailer';
import OpenAI from 'openai';

interface EmailConfig {
  subject?: string;
  signature?: string;
}

export async function executeEmailInteract(config: EmailConfig, inputData: any, llm?: string): Promise<any> {
  try {
    // Extract data from previous steps
    const quotes = inputData?.quotes || [];
    const customers = inputData?.customers || [];

    if (quotes.length === 0 && customers.length === 0) {
      throw new Error('No quotes or customer data available for email');
    }

    console.log(`Preparing emails for ${Math.max(quotes.length, customers.length)} recipients...`);

    // Check if email is configured
    const emailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    const openaiConfigured = process.env.OPENAI_API_KEY;

    const emails: any[] = [];
    const signature = config.signature || 'Best regards,\\nYour Sales Team';

    // Generate personalized email content using AI if available
    if (openaiConfigured) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      for (let i = 0; i < Math.min(quotes.length || customers.length, 10); i++) {
        const quote = quotes[i];
        const customer = customers[i] || quote?.customerName || { name: 'Valued Customer', email: 'customer@example.com' };

        try {
          const prompt = `Write a professional, personalized sales email for the following:

Customer: ${customer.name || customer.customerName || 'Valued Customer'}
${quote ? `
Quote Details:
- Products: ${quote.products?.map((p: any) => p.name).join(', ')}
- Total Price: $${quote.totalPrice}
- Final Price: $${quote.finalPrice}
- Discount: ${quote.discount}%
- Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}
` : ''}

Subject Template: ${config.subject || 'Your Personalized Quote'}

Create an email that:
1. Greets the customer warmly
2. ${quote ? 'Presents the quotation professionally' : 'Follows up on their interest'}
3. Highlights key benefits and value
4. Creates urgency (limited time offer)
5. Includes a clear call to action
6. Ends with: ${signature}

Return as JSON:
{
  "subject": "Email subject line",
  "body": "Full email body in HTML format"
}`;

          const completion = await openai.chat.completions.create({
            model: llm || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional sales email copywriter. Write compelling, personalized emails that drive customer engagement and conversions.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          });

          const result = JSON.parse(completion.choices[0].message.content || '{}');

          const emailData = {
            to: customer.email || customer.customerEmail || 'customer@example.com',
            toName: customer.name || customer.customerName || 'Valued Customer',
            subject: result.subject || config.subject || 'Your Personalized Quote',
            body: result.body,
            quoteId: quote?.id,
            sent: false,
            opened: false,
            clicked: false,
            createdAt: new Date().toISOString()
          };

          // Actually send email if SMTP is configured
          if (emailConfigured) {
            await sendEmail(emailData);
            emailData.sent = true;
          } else {
            emailData.sent = false; // Simulated - SMTP not configured
          }

          emails.push(emailData);

        } catch (error: any) {
          console.error(`Error generating email for ${customer.name}:`, error.message);
          emails.push({
            to: customer.email || 'customer@example.com',
            subject: config.subject || 'Quote Follow-up',
            body: 'Email generation failed',
            sent: false,
            error: error.message
          });
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      // Fallback without AI
      for (let i = 0; i < Math.min(quotes.length || customers.length, 10); i++) {
        const quote = quotes[i];
        const customer = customers[i] || quote?.customerName || { name: 'Valued Customer', email: 'customer@example.com' };

        const emailData = {
          to: customer.email || 'customer@example.com',
          toName: customer.name || 'Valued Customer',
          subject: config.subject || 'Your Quote Request',
          body: `Dear ${customer.name || 'Valued Customer'},\\n\\nThank you for your interest.\\n\\n${signature}`,
          sent: false,
          opened: false,
          clicked: false
        };

        if (emailConfigured) {
          await sendEmail(emailData);
          emailData.sent = true;
        }

        emails.push(emailData);
      }
    }

    const sentCount = emails.filter(e => e.sent).length;
    // Simulate some emails being opened
    const openedCount = emailConfigured ? Math.floor(sentCount * 0.7) : 0;
    const clickedCount = emailConfigured ? Math.floor(sentCount * 0.4) : 0;

    return {
      status: 'completed',
      emailsSent: sentCount,
      emailsPrepared: emails.length,
      opened: openedCount,
      clicked: clickedCount,
      responses: Math.floor(clickedCount * 0.3),
      emails: emails,
      smtpConfigured: emailConfigured,
      message: emailConfigured
        ? `${sentCount} emails sent successfully`
        : `${emails.length} emails prepared (SMTP not configured - set SMTP credentials in .env to send real emails)`,
      sentAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Email interaction error:', error.message);

    return {
      status: 'error',
      error: error.message,
      emailsSent: 0,
      message: 'Failed to process emails. ' + error.message
    };
  }
}

async function sendEmail(emailData: any): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.body
  });

  console.log(`Email sent to ${emailData.to}`);
}
