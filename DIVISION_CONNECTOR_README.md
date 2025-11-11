# Division Connector Module - Complete Guide

## 🎯 Overview

The **Division Connector** enables your AI Sales Workflow to integrate with other business divisions (Logistics, Marketing, Finance, Inventory, etc.) by sending workflow data through their APIs.

**Key Feature:** Choose from **8 different data formats** via a dropdown menu to match any division's API requirements!

---

## ✨ Quick Start

### 1. Add Division Connector to Your Workflow
In the UI, drag the **"Connector to Divisions"** module to your workflow.

### 2. Select Data Format
Choose from the dropdown:
- **JSON (Simple)** ← Most common, recommended
- **REST Standard** (with metadata)
- **JSON:API Specification**
- **GraphQL Mutation**
- **XML Format**
- **Form Data** (URL-encoded)
- **CSV Format**
- **Custom Template**

### 3. Configure Division(s)
Paste JSON configuration with your division details:

```json
[
  {
    "name": "logistics",
    "endpoint": "https://api.logistics.company.com/sync",
    "method": "POST",
    "auth": {
      "type": "bearer",
      "token": "${LOGISTICS_API_KEY}"
    }
  }
]
```

### 4. Add API Credentials to .env
```bash
LOGISTICS_API_KEY=your_api_key_here
```

### 5. Run Workflow!
The connector will:
- Format data in your chosen format
- Send to all configured divisions
- Return sync status and results

---

## 📊 Data Format Examples

### JSON (Simple)
```json
{
  "products": [...],
  "customers": [...]
}
```

### REST Standard
```json
{
  "source": "sales_workflow",
  "timestamp": "2025-11-11T12:34:56Z",
  "workflowId": "workflow_123",
  "data": {...}
}
```

### XML
```xml
<?xml version="1.0"?>
<WorkflowSync>
  <Data>
    <Products>...</Products>
  </Data>
</WorkflowSync>
```

**See:** `DIVISION_CONNECTOR_FORMATS.md` for all format examples

---

## 🔧 Configuration Schema

### Division Object

```typescript
{
  name: string,              // Division identifier
  endpoint: string,          // Full API URL
  method?: string,           // GET, POST, PUT, PATCH (default: POST)
  dataFormat?: string,       // Override global format for this division
  auth?: {                   // Authentication config
    type: 'bearer' | 'api_key' | 'basic' | 'oauth2',
    // ... auth-specific fields
  },
  dataMapping?: {            // Map workflow fields to division fields
    "products": "items",
    "customers": "recipients"
  },
  timeout?: number,          // Milliseconds (default: 10000)
  retries?: number,          // Retry attempts (default: 3)
  headers?: {                // Custom headers
    "X-Custom-Header": "value"
  }
}
```

---

## 🔐 Authentication Examples

### Bearer Token
```json
{
  "type": "bearer",
  "token": "${LOGISTICS_API_KEY}"
}
```

### API Key (Header)
```json
{
  "type": "api_key",
  "header": "X-API-Key",
  "key": "${MARKETING_API_KEY}"
}
```

### Basic Auth
```json
{
  "type": "basic",
  "username": "${FINANCE_USER}",
  "password": "${FINANCE_PASS}"
}
```

### OAuth2
```json
{
  "type": "oauth2",
  "token": "${OAUTH_TOKEN}"
}
```

---

## 📝 Complete Example

### Workflow with 3 Divisions

```json
{
  "divisions": [
    {
      "name": "logistics",
      "endpoint": "https://api.logistics.company.com/shipments",
      "method": "POST",
      "dataFormat": "json",
      "auth": {
        "type": "bearer",
        "token": "${LOGISTICS_API_KEY}"
      },
      "dataMapping": {
        "products": "shipmentItems",
        "customers": "recipients"
      },
      "timeout": 15000,
      "retries": 3
    },
    {
      "name": "marketing",
      "endpoint": "https://api.marketing.company.com/leads",
      "method": "POST",
      "dataFormat": "rest_standard",
      "auth": {
        "type": "api_key",
        "header": "X-Marketing-Key",
        "key": "${MARKETING_API_KEY}"
      },
      "dataMapping": {
        "customers": "leads",
        "emails": "campaigns"
      }
    },
    {
      "name": "finance",
      "endpoint": "https://api.finance.company.com/invoices",
      "method": "POST",
      "dataFormat": "xml",
      "auth": {
        "type": "basic",
        "username": "${FINANCE_USER}",
        "password": "${FINANCE_PASS}"
      },
      "dataMapping": {
        "quotes": "invoices"
      }
    }
  ]
}
```

### Add to .env:
```bash
LOGISTICS_API_KEY=sk-logistics-123
MARKETING_API_KEY=mk-marketing-456
FINANCE_USER=finance_api
FINANCE_PASS=secure_password_789
```

---

## 🎯 Format Selection Guide

| Your Division Uses | Choose Format | Why |
|-------------------|---------------|-----|
| Modern REST API | **JSON (Simple)** | Clean, standard, widely supported |
| Enterprise system | **REST Standard** | Includes metadata for tracking |
| Follows JSON:API | **JSON:API** | Matches specification |
| GraphQL endpoint | **GraphQL** | Native format |
| Legacy/SOAP | **XML** | Legacy compatibility |
| Form submission | **Form Data** | Traditional POST |
| Database import | **CSV** | Easy bulk import |
| Unique format | **Custom** | Full control |

---

## 🧪 Testing Your Configuration

### Step 1: Get a Test Webhook
Visit [webhook.site](https://webhook.site) and copy your unique URL.

### Step 2: Configure Test Division
```json
{
  "divisions": [
    {
      "name": "test",
      "endpoint": "https://webhook.site/YOUR-UNIQUE-ID",
      "method": "POST",
      "dataFormat": "rest_standard"
    }
  ]
}
```

### Step 3: Run Workflow
View the exact payload sent in webhook.site!

---

## ⚙️ Field Mapping

Map workflow field names to division-specific names:

```json
{
  "dataMapping": {
    "products": "items",           // workflow → division
    "customers": "recipients",
    "quotes": "orders",
    "emails": "communications"
  }
}
```

**Example:**
- Workflow has: `{ products: [...] }`
- Division receives: `{ items: [...] }`

---

## 🔄 Error Handling

The connector automatically handles:

- **Connection errors** - Retries with exponential backoff
- **Timeouts** - Configurable per division
- **Authentication failures** - Clear error messages
- **Rate limits** - Respects 429 responses
- **Server errors** - Logs detailed error codes

### Error Codes:
- `CONNECTION_ERROR` - Cannot reach API
- `AUTHENTICATION_ERROR` - Invalid credentials
- `VALIDATION_ERROR` - Bad data format
- `TIMEOUT_ERROR` - Request too slow
- `SERVER_ERROR` - Division API error (5xx)
- `RATE_LIMIT_ERROR` - Too many requests

---

## 📋 Workflow Output

After execution, you'll receive:

```json
{
  "status": "completed",
  "divisionsSync": 3,
  "successfulSyncs": 3,
  "failedSyncs": 0,
  "recordsProcessed": 156,
  "recordsUpdated": 150,
  "syncStatus": "success",
  "results": [
    {
      "division": "logistics",
      "status": "success",
      "recordsProcessed": 50,
      "message": "Data synchronized with logistics"
    },
    {
      "division": "marketing",
      "status": "success",
      "recordsProcessed": 42,
      "message": "Data synchronized with marketing"
    },
    {
      "division": "finance",
      "status": "success",
      "recordsProcessed": 64,
      "message": "Data synchronized with finance"
    }
  ]
}
```

---

## 🎨 Custom Template Format

For unique requirements, use custom template with variables:

### Configuration:
```json
{
  "name": "special_division",
  "dataFormat": "custom",
  "customTemplate": "{\"wf\":\"{{workflowId}}\",\"time\":\"{{timestamp}}\",\"payload\":{{data}}}"
}
```

### Variables:
- `{{workflowId}}` - Workflow identifier
- `{{executionId}}` - Execution identifier
- `{{division}}` - Division name
- `{{timestamp}}` - Current ISO timestamp
- `{{data}}` - Your data as JSON string

---

## 💡 Best Practices

1. **Start with JSON** - Simplest, works for most APIs
2. **Test with webhook.site** - Before connecting to real division
3. **Use environment variables** - Never hardcode API keys
4. **Map field names** - Use `dataMapping` when needed
5. **Set reasonable timeouts** - Balance speed vs. reliability
6. **Monitor results** - Check `failedSyncs` in output
7. **Document divisions** - Keep a list of which format each uses

---

## 🔍 Troubleshooting

### Division returns 401/403
✓ Check auth credentials in `.env`
✓ Verify token hasn't expired
✓ Confirm auth type matches division requirements

### Division returns 400
✓ Try different data format
✓ Check division API documentation
✓ Verify required fields are present
✓ Use data mapping if field names differ

### Connection timeout
✓ Increase `timeout` value
✓ Check division endpoint is accessible
✓ Verify network connectivity

### Data format mismatch
✓ Use webhook.site to see actual payload
✓ Compare with division's expected format
✓ Switch format or use custom template

---

## 📚 Documentation Files

- **DIVISION_CONNECTOR_SPEC.md** - Detailed API specification
- **DIVISION_CONNECTOR_FORMATS.md** - All format examples & guide
- **DIVISION_CONNECTOR_README.md** - This file
- **IMPLEMENTATION_STATUS.md** - Overall implementation status

---

## 🚀 Example Workflows

### Workflow 1: E-commerce to Logistics
```
1. E-commerce Scraper (get products)
2. Product Information (enhance with AI)
3. Division Connector (send to logistics)
   → Format: JSON
   → Division: logistics API
```

### Workflow 2: Sales to Multiple Divisions
```
1. Product Info (products)
2. Quotation (generate quotes)
3. Email Interact (send to customers)
4. Division Connector (sync everything)
   → Format: REST Standard
   → Divisions: logistics, finance, marketing
```

### Workflow 3: Analysis to BI System
```
1. [Multiple workflow steps]
2. Sales Analysis (analyze performance)
3. Business Intelligence (market insights)
4. Division Connector (send to BI dashboard)
   → Format: CSV
   → Division: analytics platform
```

---

## ✅ Features Summary

- ✅ **8 data formats** with dropdown selection
- ✅ **4 authentication methods**
- ✅ **Multiple divisions** in one step
- ✅ **Per-division format** override
- ✅ **Field name mapping**
- ✅ **Automatic retries** with backoff
- ✅ **Environment variables** for security
- ✅ **Detailed error handling**
- ✅ **Timeout configuration**
- ✅ **Custom headers support**
- ✅ **Template-based custom format**

---

## 🎓 Learn More

1. Read **DIVISION_CONNECTOR_FORMATS.md** for format details
2. Read **DIVISION_CONNECTOR_SPEC.md** for technical specs
3. Test with webhook.site before production
4. Check division API documentation
5. Contact division teams for endpoint details

---

## 🆘 Support

For division-specific questions:
- **Logistics:** logistics-api@company.com
- **Marketing:** marketing-tech@company.com
- **Finance:** finance-api@company.com
- **Inventory:** inventory-systems@company.com

For workflow questions, check server logs for detailed execution traces.

---

**The Division Connector makes it easy to integrate with any division API, regardless of their data format requirements!**
