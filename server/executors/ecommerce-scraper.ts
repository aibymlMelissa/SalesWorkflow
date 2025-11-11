import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScraperConfig {
  url: string;
  selectors?: string;
}

interface Product {
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
}

export async function executeEcommerceScraper(config: ScraperConfig): Promise<any> {
  try {
    const { url, selectors } = config;

    if (!url) {
      throw new Error('URL is required for e-commerce scraper');
    }

    console.log(`Scraping e-commerce site: ${url}`);

    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Parse custom selectors if provided
    let productSelectors = {
      container: '.product, .product-item, [data-product], .item',
      name: '.product-name, .title, h2, h3, .product-title',
      price: '.price, .product-price, [data-price]',
      description: '.description, .product-description, p',
      image: 'img'
    };

    // If custom selectors provided, try to parse them
    if (selectors) {
      try {
        const customSelectors = JSON.parse(selectors);
        productSelectors = { ...productSelectors, ...customSelectors };
      } catch (e) {
        console.log('Using default selectors, custom selectors parse failed');
      }
    }

    const products: Product[] = [];

    // Try to find product containers
    $(productSelectors.container).each((index, element) => {
      if (index >= 50) return false; // Limit to 50 products

      const $element = $(element);

      const name = $element.find(productSelectors.name).first().text().trim() ||
                   $element.find('h2, h3, h4').first().text().trim();

      const priceText = $element.find(productSelectors.price).first().text().trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

      const description = $element.find(productSelectors.description).first().text().trim().substring(0, 200);

      const imageUrl = $element.find(productSelectors.image).first().attr('src') ||
                      $element.find(productSelectors.image).first().attr('data-src') || '';

      if (name && name.length > 2) {
        products.push({
          name,
          price,
          description: description || 'No description available',
          imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? new URL(imageUrl, url).href : ''),
          category: 'General'
        });
      }
    });

    // If no products found with containers, try alternative approach
    if (products.length === 0) {
      console.log('No products found with container approach, trying alternative...');

      // Look for any elements that might be products
      $('article, .card, .item, [class*="product"]').each((index, element) => {
        if (index >= 20) return false;

        const $element = $(element);
        const name = $element.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
        const priceText = $element.text();
        const priceMatch = priceText.match(/\$?\s*[\d,]+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : 0;

        if (name && name.length > 2) {
          products.push({
            name,
            price,
            description: 'Product found on page',
            imageUrl: $element.find('img').first().attr('src') || '',
            category: 'General'
          });
        }
      });
    }

    return {
      status: 'completed',
      productsFound: products.length,
      products: products,
      categories: [...new Set(products.map(p => p.category))],
      avgPrice: products.length > 0
        ? `$${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}`
        : '$0.00',
      scrapedAt: new Date().toISOString(),
      sourceUrl: url
    };

  } catch (error: any) {
    console.error('E-commerce scraper error:', error.message);

    return {
      status: 'error',
      error: error.message,
      productsFound: 0,
      products: [],
      message: 'Failed to scrape website. Please check the URL and try again.'
    };
  }
}
