import OpenAI from 'openai';

interface QuotationConfig {
  template?: string;
  validityDays?: number;
}

export async function executeQuotation(config: QuotationConfig, inputData: any, llm?: string): Promise<any> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    // Extract data from previous steps
    const products = inputData?.products || [];
    const customers = inputData?.customers || [];

    if (products.length === 0) {
      throw new Error('No product data available for quotation');
    }

    console.log(`Generating quotations for ${products.length} products...`);

    const validityDays = config.validityDays || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Generate quotes using AI
    const quotes: any[] = [];
    const customTemplate = config.template || 'Professional and friendly sales quotation';

    // Process products in batches
    const batchSize = 3;
    for (let i = 0; i < Math.min(products.length, 10); i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const batchPromises = batch.map(async (product: any, idx: number) => {
        try {
          const customerInfo = customers[idx] || {
            name: 'Valued Customer',
            email: 'customer@example.com',
            interest: 'General inquiry'
          };

          const prompt = `Generate a professional sales quotation for the following:

Product: ${product.name}
Description: ${product.enhancedDescription || product.description}
Price: $${product.price}
Category: ${product.category || 'General'}

Customer: ${customerInfo.name}
Customer Interest: ${customerInfo.interest || 'Product inquiry'}

Template Style: ${customTemplate}
Quote Valid Until: ${validUntil.toLocaleDateString()}

Please create a personalized, compelling quotation that:
1. Highlights the product's key benefits
2. Addresses the customer's specific interests
3. Includes the price and validity period
4. Has a professional yet friendly tone
5. Includes a call to action

Return as JSON:
{
  "quotationText": "Full quotation text here...",
  "highlights": ["benefit 1", "benefit 2", "benefit 3"],
  "totalPrice": number,
  "discount": number (percentage if applicable),
  "finalPrice": number
}`;

          const completion = await openai.chat.completions.create({
            model: llm || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional sales quotation specialist. Create compelling, personalized quotes that convert leads into customers.'
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

          return {
            id: `quote_${Date.now()}_${idx}`,
            customerId: customerInfo.email,
            customerName: customerInfo.name,
            products: [{
              productId: product.name,
              name: product.name,
              price: product.price,
              quantity: 1
            }],
            quotationText: result.quotationText,
            highlights: result.highlights || [],
            totalPrice: result.totalPrice || product.price,
            discount: result.discount || 0,
            finalPrice: result.finalPrice || product.price,
            validUntil: validUntil.toISOString(),
            status: 'draft',
            createdAt: new Date().toISOString()
          };

        } catch (error: any) {
          console.error(`Error generating quote for product:`, error.message);
          return {
            id: `quote_${Date.now()}_${idx}`,
            customerId: 'customer@example.com',
            products: [product],
            totalPrice: product.price,
            finalPrice: product.price,
            status: 'error',
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      quotes.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successfulQuotes = quotes.filter(q => q.status !== 'error');
    const avgQuoteValue = successfulQuotes.length > 0
      ? successfulQuotes.reduce((sum, q) => sum + q.finalPrice, 0) / successfulQuotes.length
      : 0;

    return {
      status: 'completed',
      quotesGenerated: quotes.length,
      successfulQuotes: successfulQuotes.length,
      quotes: quotes,
      avgQuoteValue: `$${avgQuoteValue.toFixed(2)}`,
      totalValue: `$${quotes.reduce((sum, q) => sum + (q.finalPrice || 0), 0).toFixed(2)}`,
      pendingApprovals: quotes.filter(q => q.status === 'draft').length,
      validUntil: validUntil.toISOString(),
      generatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Quotation generation error:', error.message);

    return {
      status: 'error',
      error: error.message,
      quotesGenerated: 0,
      message: 'Failed to generate quotations. ' + error.message
    };
  }
}
