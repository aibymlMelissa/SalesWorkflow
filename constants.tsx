import React from 'react';
import { Module } from './types';

// Icon Components
const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7v10l8 4m0-14L4 7m8 4v10M4 7l8 4" />
  </svg>
);
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
const DocumentTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 14h.01M14 10h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
    </svg>
);
const PieChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);

export const LLM_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'llama-3-8b', label: 'Llama 3 8B' },
];

export const MODULES: Module[] = [
  { 
    id: 'scrapper', 
    name: 'E-commerce Scrapper', 
    description: 'Scrape product data, images, and prices from your website to build database products.json for sale automation.', 
    icon: <ShoppingCartIcon />,
    configFields: [
      { name: 'targetUrl', label: 'Target URL', type: 'text', placeholder: 'https://www.printngift.com' }
    ]
  },
  { id: 'product_info', name: 'Product Information', description: 'Review and Select, and standardize product information for database product.json in automation process.', icon: <PackageIcon /> },
  { 
    id: 'whatsapp_assistant', 
    name: 'WhatsApp Sales Assistant', 
    description: 'Automate customer chats and sales follow-ups on WhatsApp.', 
    icon: <ChatIcon />,
    isLLMPowered: true,
    configFields: [
      { name: 'targetSegment', label: 'Target Customer Segment', type: 'text', placeholder: 'e.g., "New Leads", "VIP Customers"' },
      { name: 'welcomeMessage', label: 'Initial Message', type: 'textarea', placeholder: 'Hi there! How can I help you today?' }
    ]
  },
  { 
    id: 'web_chatbot', 
    name: 'Web Sales Chatbot', 
    description: 'Engage website visitors 24/7 to answer questions and capture leads.', 
    icon: <ChatIcon />,
    isLLMPowered: true,
    configFields: [
        { name: 'botPersonality', label: 'Bot Personality', type: 'text', placeholder: 'e.g., "Friendly & Casual", "Formal & Professional"' }
    ]
  },
  { id: 'quotation', name: 'New and Revised Quotation', description: 'Generate, revise, and send sales quotes to customers personally.', icon: <DocumentTextIcon />, isLLMPowered: true, },
  { 
    id: 'email_interact', 
    name: 'Email Interact with Customer', 
    description: 'Automate personalized email quotations, and follow-ups with your customers.', 
    icon: <MailIcon />,
    isLLMPowered: true,
    configFields: [
        { name: 'emailTemplate', label: 'Email Template Name', type: 'text', placeholder: 'e.g., "Follow-up Q3"' }
    ]
  },
  { id: 'sales_analysis', name: 'Sales Analysis', description: 'Analyze sales data, insights and generate performance reports on each step along sale workflow.', icon: <ChartBarIcon />, isLLMPowered: true, },
  { 
    id: 'bi_module', 
    name: 'Business Intelligence', 
    description: 'Generate report on competitive products in the market suggest actionable insights.', 
    icon: <PieChartIcon />, 
    isLLMPowered: true 
  },
  { id: 'connector', name: 'Connector to Divisions', description: 'Connect and sync workflow data with other business divisions.', icon: <ShareIcon /> },
  { 
    id: 'human_decision', 
    name: 'Human Decision', 
    description: 'Pause the automation for manual review, approval, or input.', 
    icon: <UserIcon />,
    configFields: [
        { name: 'approvalTo', label: 'Send Approval To', type: 'text', placeholder: 'e.g., "Sales Manager"' }
    ]
  },
  { 
    id: 'pricing_strategy', 
    name: 'Discount & Pricing Strategy', 
    description: 'Automatically apply dynamic discounts and strategic pricing models on different groups of customer intelligently', 
    icon: <TagIcon />,
    isLLMPowered: true,
    configFields: [
        { name: 'discountPercentage', label: 'Discount Percentage', type: 'number', placeholder: 'e.g., 15' }
    ]
  },
];