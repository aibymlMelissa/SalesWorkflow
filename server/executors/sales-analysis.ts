import OpenAI from 'openai';

interface SalesAnalysisConfig {
  metrics?: string;
  period?: string;
}

export async function executeSalesAnalysis(config: SalesAnalysisConfig, inputData: any, llm?: string): Promise<any> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    // Gather all available data from workflow
    const products = inputData?.products || [];
    const quotes = inputData?.quotes || [];
    const emails = inputData?.emails || [];
    const customers = inputData?.customers || [];

    console.log('Analyzing sales data with AI...');

    // Prepare data summary for analysis
    const dataSummary = {
      totalProducts: products.length,
      totalQuotes: quotes.length,
      totalEmails: emails.length,
      totalCustomers: customers.length,
      quoteValues: quotes.map((q: any) => q.finalPrice || q.totalPrice || 0),
      productPrices: products.map((p: any) => p.price || 0),
      emailStats: {
        sent: emails.filter((e: any) => e.sent).length,
        opened: emails.filter((e: any) => e.opened).length,
        clicked: emails.filter((e: any) => e.clicked).length
      }
    };

    const totalRevenue = dataSummary.quoteValues.reduce((sum: number, val: number) => sum + val, 0);
    const avgQuoteValue = dataSummary.quoteValues.length > 0
      ? totalRevenue / dataSummary.quoteValues.length
      : 0;

    const conversionRate = dataSummary.totalEmails > 0
      ? (dataSummary.emailStats.clicked / dataSummary.totalEmails) * 100
      : 0;

    const prompt = `Analyze the following sales workflow performance data and provide actionable insights:

WORKFLOW DATA:
- Total Products Processed: ${dataSummary.totalProducts}
- Total Quotes Generated: ${dataSummary.totalQuotes}
- Total Revenue from Quotes: $${totalRevenue.toFixed(2)}
- Average Quote Value: $${avgQuoteValue.toFixed(2)}
- Emails Sent: ${dataSummary.emailStats.sent}
- Email Open Rate: ${dataSummary.totalEmails > 0 ? ((dataSummary.emailStats.opened / dataSummary.totalEmails) * 100).toFixed(1) : 0}%
- Email Click Rate: ${dataSummary.totalEmails > 0 ? ((dataSummary.emailStats.clicked / dataSummary.totalEmails) * 100).toFixed(1) : 0}%
- Estimated Conversion Rate: ${conversionRate.toFixed(1)}%
- Customers Engaged: ${dataSummary.totalCustomers}

Analysis Period: ${config.period || 'Current workflow execution'}
Key Metrics Focus: ${config.metrics || 'Conversion rate, Revenue, Lead quality'}

Please provide:
1. Overall performance assessment
2. Key strengths identified
3. Areas for improvement
4. Specific actionable recommendations (3-5 items)
5. Predicted revenue forecast based on current trends
6. Top performing products (if applicable)

Return as JSON:
{
  "overallScore": number (0-100),
  "performanceAssessment": "Brief overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"],
  "revenueForecast": "Forecast description",
  "topProducts": ["product 1", "product 2", "product 3"],
  "insights": "Detailed insights paragraph"
}`;

    const completion = await openai.chat.completions.create({
      model: llm || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a senior sales analyst with expertise in e-commerce and workflow optimization. Provide data-driven insights and actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Identify top products by value
    const productValues = products.map((p: any, idx: number) => ({
      name: p.name,
      price: p.price || 0,
      quality: p.qualityScore || 0,
      value: (p.price || 0) * (p.qualityScore || 1)
    }));

    productValues.sort((a: any, b: any) => b.value - a.value);
    const topProducts = productValues.slice(0, 3).map((p: any) => p.name);

    return {
      status: 'completed',
      conversionRate: `${conversionRate.toFixed(1)}%`,
      revenue: `$${totalRevenue.toFixed(2)}`,
      avgQuoteValue: `$${avgQuoteValue.toFixed(2)}`,
      topProducts: analysis.topProducts || topProducts,
      emailPerformance: {
        sent: dataSummary.emailStats.sent,
        openRate: `${dataSummary.totalEmails > 0 ? ((dataSummary.emailStats.opened / dataSummary.totalEmails) * 100).toFixed(1) : 0}%`,
        clickRate: `${dataSummary.totalEmails > 0 ? ((dataSummary.emailStats.clicked / dataSummary.totalEmails) * 100).toFixed(1) : 0}%`
      },
      analysis: {
        overallScore: analysis.overallScore || 75,
        assessment: analysis.performanceAssessment,
        strengths: analysis.strengths || [],
        improvements: analysis.improvements || [],
        recommendations: analysis.recommendations || [],
        revenueForecast: analysis.revenueForecast,
        insights: analysis.insights
      },
      metrics: {
        totalProducts: dataSummary.totalProducts,
        totalQuotes: dataSummary.totalQuotes,
        totalCustomers: dataSummary.totalCustomers,
        totalRevenue: totalRevenue
      },
      analyzedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Sales analysis error:', error.message);

    return {
      status: 'error',
      error: error.message,
      message: 'Failed to perform sales analysis. ' + error.message
    };
  }
}
