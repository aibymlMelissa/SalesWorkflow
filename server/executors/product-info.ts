import OpenAI from 'openai';

interface ProductInfoConfig {
  categories?: string;
  fields?: string;
}

interface Product {
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
}

interface ProcessedProduct extends Product {
  standardized: boolean;
  enhancedDescription?: string;
  suggestedCategory?: string;
  qualityScore?: number;
}

export async function executeProductInfo(config: ProductInfoConfig, inputData: any): Promise<any> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('OPENAI_API_KEY not found, running in basic mode without AI enhancement');
      return processProductsBasic(config, inputData);
    }

    const openai = new OpenAI({ apiKey });

    // Extract products from previous step
    let products: Product[] = [];

    if (inputData?.products && Array.isArray(inputData.products)) {
      products = inputData.products;
    } else {
      throw new Error('No product data found from previous step');
    }

    if (products.length === 0) {
      return {
        status: 'completed',
        processedProducts: 0,
        products: [],
        message: 'No products to process'
      };
    }

    console.log(`Processing ${products.length} products with OpenAI...`);

    // Process products with AI enhancement
    const processedProducts: ProcessedProduct[] = [];
    const targetCategories = config.categories?.split(',').map(c => c.trim()) || [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < Math.min(products.length, 20); i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const batchPromises = batch.map(async (product) => {
        try {
          const prompt = `Analyze this product and provide structured information:

Product Name: ${product.name}
Current Description: ${product.description}
Price: $${product.price}
${targetCategories.length > 0 ? `Available Categories: ${targetCategories.join(', ')}` : ''}

Please provide:
1. An enhanced, professional product description (2-3 sentences)
2. The most appropriate category${targetCategories.length > 0 ? ' from the available categories' : ''}
3. A quality score (0-1) based on how complete and accurate the product information is

Respond in JSON format:
{
  "enhancedDescription": "...",
  "category": "...",
  "qualityScore": 0.0
}`;

          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a product information specialist. Analyze product data and provide enhanced, standardized information in JSON format.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          });

          const result = JSON.parse(completion.choices[0].message.content || '{}');

          return {
            ...product,
            standardized: true,
            enhancedDescription: result.enhancedDescription || product.description,
            suggestedCategory: result.category || product.category,
            qualityScore: result.qualityScore || 0.5
          };

        } catch (error: any) {
          console.error(`Error processing product "${product.name}":`, error.message);
          return {
            ...product,
            standardized: false,
            qualityScore: 0.3
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      processedProducts.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Add remaining products without AI processing if there are more than 20
    if (products.length > 20) {
      processedProducts.push(...products.slice(20).map(p => ({
        ...p,
        standardized: false,
        qualityScore: 0.3
      })));
    }

    const avgQualityScore = processedProducts.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / processedProducts.length;
    const standardizedCount = processedProducts.filter(p => p.standardized).length;

    return {
      status: 'completed',
      processedProducts: processedProducts.length,
      standardizedProducts: standardizedCount,
      products: processedProducts,
      standardizedFields: config.fields?.split(',').length || 8,
      qualityScore: avgQualityScore.toFixed(2),
      avgQualityScore: `${(avgQualityScore * 100).toFixed(1)}%`,
      categories: [...new Set(processedProducts.map(p => p.suggestedCategory || p.category))],
      processedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Product info processor error:', error.message);

    return {
      status: 'error',
      error: error.message,
      processedProducts: 0,
      message: 'Failed to process products. ' + error.message
    };
  }
}

// Fallback function without AI
function processProductsBasic(config: ProductInfoConfig, inputData: any): any {
  const products = inputData?.products || [];

  const processedProducts = products.map((product: Product) => ({
    ...product,
    standardized: true,
    category: product.category || 'General',
    qualityScore: 0.7
  }));

  return {
    status: 'completed',
    processedProducts: processedProducts.length,
    products: processedProducts,
    standardizedFields: 5,
    qualityScore: 0.70,
    message: 'Products processed in basic mode (no AI enhancement)',
    processedAt: new Date().toISOString()
  };
}
