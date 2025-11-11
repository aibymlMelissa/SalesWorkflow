import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Supported data formats for communication
type DataFormat =
  | 'json'              // Standard JSON
  | 'json_api'          // JSON:API specification
  | 'rest_standard'     // REST standard with metadata
  | 'graphql'           // GraphQL query
  | 'xml'               // XML format
  | 'form_data'         // URL-encoded form data
  | 'csv'               // CSV format
  | 'custom';           // Custom format

interface DivisionAuth {
  type: 'bearer' | 'api_key' | 'basic' | 'oauth2' | 'none';
  token?: string;
  header?: string;
  key?: string;
  username?: string;
  password?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

interface Division {
  name: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  dataFormat?: DataFormat;  // Format for data communication
  auth?: DivisionAuth;
  dataMapping?: Record<string, string>;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  customTemplate?: string;  // For custom format
}

interface ConnectorConfig {
  divisions?: Division[] | string; // Can be JSON array or JSON string
  syncMode?: 'sync' | 'async';
  notifyOnComplete?: boolean;
  dataFormat?: DataFormat;  // Default format for all divisions
}

interface DivisionResponse {
  status: 'success' | 'error' | 'partial';
  divisionId: string;
  requestId: string;
  recordsProcessed?: number;
  recordsUpdated?: number;
  recordsCreated?: number;
  timestamp: string;
  message: string;
  data?: any;
  errorCode?: string;
  details?: any;
}

export async function executeConnectorDivisions(config: ConnectorConfig, inputData: any): Promise<any> {
  try {
    console.log('Executing Division Connector...');

    // Parse divisions configuration
    let divisions: Division[] = [];

    if (typeof config.divisions === 'string') {
      try {
        divisions = JSON.parse(config.divisions);
      } catch (e) {
        throw new Error('Invalid divisions configuration: must be valid JSON');
      }
    } else if (Array.isArray(config.divisions)) {
      divisions = config.divisions;
    } else {
      throw new Error('No divisions configured. Please add division configurations.');
    }

    if (divisions.length === 0) {
      throw new Error('At least one division must be configured');
    }

    console.log(`Syncing with ${divisions.length} division(s)...`);

    const syncMode = config.syncMode || 'sync';
    const results: any[] = [];

    // Generate unique IDs for tracking
    const workflowId = `workflow_${Date.now()}`;
    const executionId = `exec_${uuidv4()}`;

    // Process each division
    for (const division of divisions) {
      try {
        console.log(`Syncing with ${division.name}...`);

        // Prepare data with mapping
        const mappedData = applyDataMapping(inputData, division.dataMapping);

        // Determine format to use (division-specific or global default)
        const format = division.dataFormat || config.dataFormat || 'json';

        // Format data according to selected format
        const formattedData = formatDataForDivision(
          mappedData,
          format,
          workflowId,
          executionId,
          division.name,
          division.customTemplate
        );

        // Send to division
        const response = await sendToDivision(division, formattedData, format);

        results.push({
          division: division.name,
          status: response.status,
          requestId: response.requestId,
          recordsProcessed: response.recordsProcessed,
          recordsUpdated: response.recordsUpdated,
          recordsCreated: response.recordsCreated,
          message: response.message,
          timestamp: response.timestamp,
          responseData: response.data
        });

        console.log(`✓ ${division.name}: ${response.message}`);

      } catch (error: any) {
        console.error(`✗ ${division.name}: ${error.message}`);

        results.push({
          division: division.name,
          status: 'error',
          error: error.message,
          errorCode: error.code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      // Small delay between divisions to avoid overwhelming systems
      if (divisions.indexOf(division) < divisions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate summary statistics
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalRecordsProcessed = results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0);
    const totalRecordsUpdated = results.reduce((sum, r) => sum + (r.recordsUpdated || 0), 0);

    return {
      status: errorCount === 0 ? 'completed' : (successCount > 0 ? 'partial' : 'error'),
      divisionsSync: divisions.length,
      successfulSyncs: successCount,
      failedSyncs: errorCount,
      recordsUpdated: totalRecordsUpdated,
      recordsProcessed: totalRecordsProcessed,
      syncStatus: errorCount === 0 ? 'success' : 'partial_failure',
      syncMode: syncMode,
      results: results,
      workflowId: workflowId,
      executionId: executionId,
      summary: `${successCount}/${divisions.length} divisions synchronized successfully`,
      completedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Division connector error:', error.message);

    return {
      status: 'error',
      error: error.message,
      divisionsSync: 0,
      message: 'Failed to execute division connector. ' + error.message
    };
  }
}

/**
 * Format data according to the selected communication format
 */
function formatDataForDivision(
  data: any,
  format: DataFormat,
  workflowId: string,
  executionId: string,
  divisionName: string,
  customTemplate?: string
): any {
  const timestamp = new Date().toISOString();
  const requestId = `req_${uuidv4()}`;

  switch (format) {
    case 'json':
      // Simple JSON - just the data
      return data;

    case 'json_api':
      // JSON:API specification format
      return {
        data: {
          type: 'workflow_sync',
          id: executionId,
          attributes: data,
          meta: {
            workflowId,
            division: divisionName,
            timestamp
          }
        }
      };

    case 'rest_standard':
      // REST standard with metadata wrapper
      return {
        source: 'sales_workflow',
        timestamp,
        workflowId,
        executionId,
        division: divisionName,
        action: 'sync_data',
        data,
        metadata: {
          apiVersion: '1.0',
          requestId
        }
      };

    case 'graphql':
      // GraphQL mutation format
      const variables = JSON.stringify(data).replace(/"/g, '\\"');
      return {
        query: `mutation SyncWorkflowData($input: WorkflowDataInput!) {
          syncWorkflowData(input: $input) {
            success
            recordsProcessed
            message
          }
        }`,
        variables: {
          input: {
            workflowId,
            executionId,
            division: divisionName,
            ...data
          }
        }
      };

    case 'xml':
      // Convert to XML format
      return convertToXML(data, workflowId, executionId, divisionName);

    case 'form_data':
      // Flatten data for form submission
      return flattenForFormData(data, workflowId, executionId);

    case 'csv':
      // Convert to CSV format (for arrays of objects)
      return convertToCSV(data);

    case 'custom':
      // Use custom template if provided
      if (customTemplate) {
        return applyCustomTemplate(customTemplate, data, workflowId, executionId, divisionName);
      }
      // Fallback to simple JSON
      return data;

    default:
      return data;
  }
}

/**
 * Convert data to XML format
 */
function convertToXML(data: any, workflowId: string, executionId: string, division: string): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

  const dataXML = objectToXML(data, 2);

  return `${xmlHeader}
<WorkflowSync>
  <WorkflowId>${workflowId}</WorkflowId>
  <ExecutionId>${executionId}</ExecutionId>
  <Division>${division}</Division>
  <Timestamp>${new Date().toISOString()}</Timestamp>
  <Data>
${dataXML}
  </Data>
</WorkflowSync>`;
}

function objectToXML(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  let xml = '';

  for (const [key, value] of Object.entries(obj)) {
    const tagName = key.charAt(0).toUpperCase() + key.slice(1);

    if (Array.isArray(value)) {
      xml += `${spaces}<${tagName}>\n`;
      value.forEach(item => {
        xml += `${spaces}  <Item>\n`;
        if (typeof item === 'object') {
          xml += objectToXML(item, indent + 2);
        } else {
          xml += `${spaces}    ${escapeXML(String(item))}\n`;
        }
        xml += `${spaces}  </Item>\n`;
      });
      xml += `${spaces}</${tagName}>\n`;
    } else if (typeof value === 'object' && value !== null) {
      xml += `${spaces}<${tagName}>\n`;
      xml += objectToXML(value, indent + 1);
      xml += `${spaces}</${tagName}>\n`;
    } else {
      xml += `${spaces}<${tagName}>${escapeXML(String(value))}</${tagName}>\n`;
    }
  }

  return xml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Flatten nested objects for form data
 */
function flattenForFormData(obj: any, workflowId: string, executionId: string, prefix: string = ''): any {
  const flattened: any = {
    workflowId,
    executionId,
    timestamp: new Date().toISOString()
  };

  function flatten(current: any, path: string) {
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        flatten(item, `${path}[${index}]`);
      });
    } else if (typeof current === 'object' && current !== null) {
      for (const [key, value] of Object.entries(current)) {
        const newPath = path ? `${path}.${key}` : key;
        flatten(value, newPath);
      }
    } else {
      flattened[path] = current;
    }
  }

  flatten(obj, prefix);
  return flattened;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any): string {
  // Find all arrays in the data
  const arrays: { name: string; data: any[] }[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      arrays.push({ name: key, data: value });
    }
  }

  if (arrays.length === 0) {
    return '';
  }

  // Convert first array to CSV
  const firstArray = arrays[0];
  const headers = Object.keys(firstArray.data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = firstArray.data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Apply custom template with variable substitution
 */
function applyCustomTemplate(
  template: string,
  data: any,
  workflowId: string,
  executionId: string,
  division: string
): any {
  // Replace template variables
  let result = template;

  // Replace special variables
  result = result.replace(/\{\{workflowId\}\}/g, workflowId);
  result = result.replace(/\{\{executionId\}\}/g, executionId);
  result = result.replace(/\{\{division\}\}/g, division);
  result = result.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

  // Replace data variables (simple dot notation)
  const dataStr = JSON.stringify(data);
  result = result.replace(/\{\{data\}\}/g, dataStr);

  // Try to parse as JSON
  try {
    return JSON.parse(result);
  } catch (e) {
    // Return as string if not valid JSON
    return result;
  }
}

function applyDataMapping(data: any, mapping?: Record<string, string>): any {
  if (!mapping || Object.keys(mapping).length === 0) {
    return data;
  }

  const mappedData: any = {};

  // Apply mappings
  for (const [sourceKey, targetKey] of Object.entries(mapping)) {
    if (data.hasOwnProperty(sourceKey)) {
      mappedData[targetKey] = data[sourceKey];
    }
  }

  // Include any unmapped data
  for (const key of Object.keys(data)) {
    if (!mapping.hasOwnProperty(key) && !mappedData.hasOwnProperty(key)) {
      mappedData[key] = data[key];
    }
  }

  return mappedData;
}

/**
 * Get appropriate Content-Type header for the data format
 */
function getContentType(format: DataFormat): string {
  switch (format) {
    case 'json':
    case 'json_api':
    case 'rest_standard':
      return 'application/json';
    case 'graphql':
      return 'application/json'; // GraphQL uses JSON
    case 'xml':
      return 'application/xml';
    case 'form_data':
      return 'application/x-www-form-urlencoded';
    case 'csv':
      return 'text/csv';
    case 'custom':
      return 'application/json'; // Default to JSON for custom
    default:
      return 'application/json';
  }
}

async function sendToDivision(division: Division, message: any, format: DataFormat): Promise<DivisionResponse> {
  const maxRetries = division.retries || 3;
  const timeout = division.timeout || 10000;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Determine content type based on format
      const contentType = getContentType(format);

      // Prepare request configuration
      const requestConfig: AxiosRequestConfig = {
        method: division.method || 'POST',
        url: division.endpoint,
        data: message,
        timeout: timeout,
        headers: {
          'Content-Type': contentType,
          ...(division.headers || {})
        }
      };

      // For form data, convert to URL-encoded format
      if (format === 'form_data') {
        requestConfig.data = new URLSearchParams(message).toString();
      }

      // Apply authentication
      applyAuthentication(requestConfig, division.auth);

      // Make request
      const response = await axios(requestConfig);

      // Parse response
      if (response.data) {
        // If division returns standard format, use it
        if (response.data.status && response.data.requestId) {
          return response.data as DivisionResponse;
        }

        // Otherwise, create standard response
        return {
          status: 'success',
          divisionId: division.name,
          requestId: message.metadata.requestId,
          recordsProcessed: calculateRecordsProcessed(message.data),
          recordsUpdated: calculateRecordsProcessed(message.data),
          recordsCreated: 0,
          timestamp: new Date().toISOString(),
          message: `Data synchronized with ${division.name}`,
          data: response.data
        };
      }

      // No response data - assume success
      return {
        status: 'success',
        divisionId: division.name,
        requestId: message.metadata.requestId,
        recordsProcessed: calculateRecordsProcessed(message.data),
        timestamp: new Date().toISOString(),
        message: `Successfully sent to ${division.name}`
      };

    } catch (error: any) {
      lastError = error;

      // Log retry attempt
      if (attempt < maxRetries) {
        console.log(`Retry ${attempt}/${maxRetries} for ${division.name}...`);

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // All retries failed
  throw createDivisionError(lastError, division.name);
}

function applyAuthentication(config: AxiosRequestConfig, auth?: DivisionAuth): void {
  if (!auth || auth.type === 'none') {
    return;
  }

  if (!config.headers) {
    config.headers = {};
  }

  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        const token = resolveEnvVariable(auth.token);
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      break;

    case 'api_key':
      if (auth.header && auth.key) {
        const key = resolveEnvVariable(auth.key);
        config.headers[auth.header] = key;
      }
      break;

    case 'basic':
      if (auth.username && auth.password) {
        const username = resolveEnvVariable(auth.username);
        const password = resolveEnvVariable(auth.password);
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${credentials}`;
      }
      break;

    case 'oauth2':
      // OAuth2 would require a separate token exchange
      // For now, treat as bearer if token is provided
      if (auth.token) {
        const token = resolveEnvVariable(auth.token);
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      break;
  }
}

function resolveEnvVariable(value: string): string {
  // Check if value is an environment variable reference
  const envVarMatch = value.match(/^\$\{(.+)\}$/);

  if (envVarMatch) {
    const envVarName = envVarMatch[1];
    const envValue = process.env[envVarName];

    if (!envValue) {
      console.warn(`Environment variable ${envVarName} not found, using placeholder`);
      return value; // Return original if not found
    }

    return envValue;
  }

  return value;
}

function calculateRecordsProcessed(data: any): number {
  let count = 0;

  if (data.products && Array.isArray(data.products)) {
    count += data.products.length;
  }
  if (data.customers && Array.isArray(data.customers)) {
    count += data.customers.length;
  }
  if (data.quotes && Array.isArray(data.quotes)) {
    count += data.quotes.length;
  }
  if (data.emails && Array.isArray(data.emails)) {
    count += data.emails.length;
  }

  return count;
}

function createDivisionError(error: any, divisionName: string): Error {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    const err = new Error(`Cannot connect to ${divisionName} API`);
    (err as any).code = 'CONNECTION_ERROR';
    return err;
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    const err = new Error(`Authentication failed for ${divisionName}`);
    (err as any).code = 'AUTHENTICATION_ERROR';
    return err;
  }

  if (error.response?.status === 400) {
    const err = new Error(`Invalid data format for ${divisionName}: ${error.response.data?.message || 'Validation error'}`);
    (err as any).code = 'VALIDATION_ERROR';
    return err;
  }

  if (error.response?.status === 429) {
    const err = new Error(`Rate limit exceeded for ${divisionName}`);
    (err as any).code = 'RATE_LIMIT_ERROR';
    return err;
  }

  if (error.response?.status >= 500) {
    const err = new Error(`${divisionName} server error: ${error.response.statusText}`);
    (err as any).code = 'SERVER_ERROR';
    return err;
  }

  if (error.code === 'ECONNABORTED') {
    const err = new Error(`Request to ${divisionName} timed out`);
    (err as any).code = 'TIMEOUT_ERROR';
    return err;
  }

  return new Error(`${divisionName} error: ${error.message}`);
}
