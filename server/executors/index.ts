import { executeEcommerceScraper } from './ecommerce-scraper.js';
import { executeProductInfo } from './product-info.js';
import { executeQuotation } from './quotation.js';
import { executeEmailInteract } from './email-interact.js';
import { executeSalesAnalysis } from './sales-analysis.js';
import { executeBusinessIntelligence } from './business-intelligence.js';
import { executeDiscountPricing } from './discount-pricing.js';
import { executeWebChatbot } from './web-chatbot.js';
import { executeHumanDecision } from './human-decision.js';
import { executeHumanManualInput } from './human-manual-input.js';
import { executeConnectorDivisions } from './connector-divisions.js';

export interface ModuleExecutor {
  (config: any, previousResults?: any, llm?: string): Promise<any>;
}

export const moduleExecutors: Record<string, ModuleExecutor> = {
  'ecommerce-scraper': executeEcommerceScraper,
  'product-info': executeProductInfo,
  'quotation': executeQuotation,
  'email-interact': executeEmailInteract,
  'sales-analysis': executeSalesAnalysis,
  'business-intelligence': executeBusinessIntelligence,
  'discount-pricing': executeDiscountPricing,
  'web-chatbot': executeWebChatbot,
  'human-decision': executeHumanDecision,
  'human-manual-input': executeHumanManualInput,
  'connector-divisions': executeConnectorDivisions,
};

export function hasRealImplementation(moduleId: string): boolean {
  return moduleId in moduleExecutors;
}

export async function executeModule(
  moduleId: string,
  config: any,
  previousResults?: any,
  llm?: string
): Promise<any> {
  const executor = moduleExecutors[moduleId];

  if (!executor) {
    throw new Error(`No executor found for module: ${moduleId}`);
  }

  return await executor(config, previousResults, llm);
}
