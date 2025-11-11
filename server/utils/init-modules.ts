import fs from 'fs/promises';
import path from 'path';
import { Module } from '../types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const MODULES_FILE = path.join(DATA_DIR, 'modules.json');

const defaultModules: Module[] = [
  {
    id: 'ecommerce-scraper',
    name: 'E-commerce Scrapper',
    description: 'Scrape product data, images, and prices from your website to build a product database.',
    icon: '🛍️',
    category: 'data_collection',
    io: {
      inputs: [],
      outputs: [{ type: 'products', schema: { name: 'string', price: 'number', description: 'string', imageUrl: 'string' }, required: true }]
    },
    configFields: [
      { name: 'url', label: 'Target URL', type: 'text', placeholder: 'https://example.com' },
      { name: 'selectors', label: 'CSS Selectors', type: 'textarea', placeholder: '.product, .price' }
    ]
  },
  {
    id: 'product-info',
    name: 'Product Information',
    description: 'Review, select, and standardize product information for use in the automation process.',
    icon: '📦',
    configFields: [
      { name: 'categories', label: 'Product Categories', type: 'text', placeholder: 'Electronics, Clothing' },
      { name: 'fields', label: 'Required Fields', type: 'textarea', placeholder: 'name, price, description' }
    ]
  },
  {
    id: 'whatsapp-assistant',
    name: 'WhatsApp Sales Assistant',
    description: 'Automate customer chats and sales follow-ups on WhatsApp.',
    icon: '💬',
    isLLMPowered: true,
    configFields: [
      { name: 'phone', label: 'Phone Number', type: 'text', placeholder: '+1234567890' },
      { name: 'greeting', label: 'Greeting Message', type: 'textarea', placeholder: 'Hello! How can I help you today?' }
    ]
  },
  {
    id: 'web-chatbot',
    name: 'Web Sales Chatbot',
    description: 'Engage website visitors 24/7 to answer questions and capture leads.',
    icon: '🤖',
    isLLMPowered: true,
    configFields: [
      { name: 'website', label: 'Website URL', type: 'text', placeholder: 'https://yoursite.com' },
      { name: 'personality', label: 'Chatbot Personality', type: 'textarea', placeholder: 'Friendly and helpful sales assistant' }
    ]
  },
  {
    id: 'quotation',
    name: 'New and Revised Quotation',
    description: 'Generate, revise, and send sales quotes to customers personally.',
    icon: '💰',
    isLLMPowered: true,
    configFields: [
      { name: 'template', label: 'Quote Template', type: 'textarea', placeholder: 'Quote template content...' },
      { name: 'validityDays', label: 'Quote Validity (Days)', type: 'number', placeholder: '30' }
    ]
  },
  {
    id: 'email-interact',
    name: 'Email Interact with Customer',
    description: 'Automate personalized email quotations, re-quotes, and follow-ups.',
    icon: '📧',
    isLLMPowered: true,
    configFields: [
      { name: 'subject', label: 'Email Subject Template', type: 'text', placeholder: 'Your Quote Request' },
      { name: 'signature', label: 'Email Signature', type: 'textarea', placeholder: 'Best regards,\\nYour Sales Team' }
    ]
  },
  {
    id: 'sales-analysis',
    name: 'Sales Analysis',
    description: 'Analyze sales data and generate performance reports for each step in the workflow.',
    icon: '📊',
    isLLMPowered: true,
    configFields: [
      { name: 'metrics', label: 'Key Metrics', type: 'textarea', placeholder: 'Conversion rate, Revenue, Lead quality' },
      { name: 'period', label: 'Analysis Period', type: 'text', placeholder: 'Monthly' }
    ]
  },
  {
    id: 'business-intelligence',
    name: 'Business Intelligence',
    description: 'Generate comparison reports on similar products and find actionable business insights.',
    icon: '📈',
    isLLMPowered: true,
    configFields: [
      { name: 'competitors', label: 'Competitor URLs', type: 'textarea', placeholder: 'https://competitor1.com\\nhttps://competitor2.com' },
      { name: 'reportType', label: 'Report Type', type: 'text', placeholder: 'Market Analysis' }
    ]
  },
  {
    id: 'connector-divisions',
    name: 'Connector to Divisions',
    description: 'Connect and sync workflow data with other business divisions (e.g., logistics, marketing).',
    icon: '🔗',
    configFields: [
      { name: 'divisions', label: 'Target Divisions', type: 'text', placeholder: 'Logistics, Marketing, Finance' },
      { name: 'syncFrequency', label: 'Sync Frequency', type: 'text', placeholder: 'Daily' }
    ]
  },
  {
    id: 'human-decision',
    name: 'Human Decision',
    description: 'Pause the automation for manual review, approval, or input from a team member.',
    icon: '👤',
    configFields: [
      { name: 'approver', label: 'Approver Email', type: 'text', placeholder: 'manager@company.com' },
      { name: 'instruction', label: 'Review Instructions', type: 'textarea', placeholder: 'Please review and approve this step...' }
    ]
  },
  {
    id: 'discount-pricing',
    name: 'Discount & Pricing Strategy',
    description: 'Automatically apply dynamic discounts and strategic pricing models for different customers.',
    icon: '💸',
    isLLMPowered: true,
    configFields: [
      { name: 'strategy', label: 'Pricing Strategy', type: 'text', placeholder: 'Volume-based, Loyalty-based' },
      { name: 'maxDiscount', label: 'Maximum Discount (%)', type: 'number', placeholder: '25' }
    ]
  }
];

export async function initializeModules() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(MODULES_FILE);
    console.log('Modules file already exists, skipping initialization');
  } catch {
    await fs.writeFile(MODULES_FILE, JSON.stringify(defaultModules, null, 2));
    console.log('Initialized modules data');
  }
}