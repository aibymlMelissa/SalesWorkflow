import OpenAI from 'openai';

interface DiscountPricingConfig {
  strategy?: string;
  maxDiscount?: number;
}

export async function executeDiscountPricing(config: DiscountPricingConfig, inputData: any, llm?: string): Promise<any> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    // Extract data from previous steps
    const customers = inputData?.customers || [];
    const products = inputData?.products || [];
    const quotes = inputData?.quotes || [];

    if (customers.length === 0 && products.length === 0) {
      throw new Error('No customer or product data available for pricing strategy');
    }

    console.log('Calculating dynamic pricing strategies...');

    const strategy = config.strategy || 'Volume-based, Loyalty-based';
    const maxDiscount = config.maxDiscount || 25;

    const pricingResults: any[] = [];

    // Process customer-product combinations
    const processLimit = Math.min(products.length, customers.length || products.length, 20);

    for (let i = 0; i < processLimit; i++) {
      const customer = customers[i] || { name: 'New Customer', email: 'customer@example.com', purchaseHistory: 0 };
      const product = products[i] || products[0];

      try {
        const prompt = `Determine optimal pricing and discount strategy:

PRODUCT:
- Name: ${product.name}
- Base Price: $${product.price}
- Category: ${product.category || 'General'}
- Quality Score: ${product.qualityScore || 'N/A'}

CUSTOMER:
- Name: ${customer.name || 'New Customer'}
- Interest Level: ${customer.interest || 'Medium'}
- Status: ${customer.status || 'New'}
- Purchase History: ${customer.purchaseHistory || 0} previous purchases

PRICING STRATEGY: ${strategy}
MAXIMUM DISCOUNT ALLOWED: ${maxDiscount}%

Consider:
1. Customer loyalty and purchase history
2. Product value and quality
3. Market conditions
4. Competitive positioning
5. Profit margins

Provide pricing recommendation with:
- Optimal discount percentage (within max limit)
- Final price
- Justification for the discount
- Upsell opportunities

Return as JSON:
{
  "discountPercentage": number,
  "finalPrice": number,
  "originalPrice": number,
  "discountAmount": number,
  "strategy": "Strategy name used",
  "justification": "Why this discount was chosen",
  "upsellOpportunities": ["opportunity 1", "opportunity 2"],
  "expectedConversion": number (0-100)
}`;

        const completion = await openai.chat.completions.create({
          model: llm || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a pricing strategy expert. Determine optimal discounts and pricing to maximize revenue while maintaining customer satisfaction and loyalty.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          response_format: { type: "json_object" }
        });

        const pricing = JSON.parse(completion.choices[0].message.content || '{}');

        // Ensure discount doesn't exceed maximum
        const discount = Math.min(pricing.discountPercentage || 0, maxDiscount);
        const finalPrice = product.price * (1 - discount / 100);

        pricingResults.push({
          customerId: customer.email || `customer_${i}`,
          customerName: customer.name || 'Customer',
          productId: product.name,
          productName: product.name,
          originalPrice: product.price,
          discountPercentage: discount,
          discountAmount: product.price - finalPrice,
          finalPrice: finalPrice,
          strategy: pricing.strategy || strategy,
          justification: pricing.justification,
          upsellOpportunities: pricing.upsellOpportunities || [],
          expectedConversion: pricing.expectedConversion || 70,
          appliedAt: new Date().toISOString()
        });

      } catch (error: any) {
        console.error(`Error calculating pricing for ${customer.name}:`, error.message);
        // Fallback to simple pricing
        const discount = Math.min(10, maxDiscount);
        pricingResults.push({
          customerId: customer.email || `customer_${i}`,
          productId: product.name,
          originalPrice: product.price,
          discountPercentage: discount,
          finalPrice: product.price * (1 - discount / 100),
          strategy: 'Standard',
          error: error.message
        });
      }

      // Small delay between calculations
      if (i < processLimit - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate summary statistics
    const totalDiscount = pricingResults.reduce((sum, p) => sum + (p.discountPercentage || 0), 0);
    const avgDiscount = totalDiscount / pricingResults.length;

    const totalRevenue = pricingResults.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const potentialRevenue = pricingResults.reduce((sum, p) => sum + (p.originalPrice || 0), 0);
    const revenueImpact = totalRevenue - potentialRevenue;

    return {
      status: 'completed',
      discountsApplied: pricingResults.length,
      avgDiscount: `${avgDiscount.toFixed(1)}%`,
      maxDiscountApplied: `${Math.max(...pricingResults.map(p => p.discountPercentage || 0)).toFixed(1)}%`,
      minDiscountApplied: `${Math.min(...pricingResults.map(p => p.discountPercentage || 0)).toFixed(1)}%`,
      revenueImpact: revenueImpact >= 0 ? `+$${revenueImpact.toFixed(2)}` : `-$${Math.abs(revenueImpact).toFixed(2)}`,
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      potentialRevenue: `$${potentialRevenue.toFixed(2)}`,
      pricingResults: pricingResults,
      strategies: {
        primary: strategy,
        maxDiscountAllowed: `${maxDiscount}%`,
        avgConversionExpected: `${pricingResults.reduce((sum, p) => sum + (p.expectedConversion || 0), 0) / pricingResults.length}%`
      },
      calculatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Discount pricing error:', error.message);

    return {
      status: 'error',
      error: error.message,
      discountsApplied: 0,
      message: 'Failed to calculate pricing strategy. ' + error.message
    };
  }
}
