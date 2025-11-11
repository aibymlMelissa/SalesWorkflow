# Division Connector - Data Format Guide

This guide explains the different data communication formats available in the Division Connector module.

---

## Format Selection

When configuring the Division Connector, you can choose from **8 different data formats** via the dropdown menu:

1. **JSON (Simple)** - Plain JSON data
2. **REST Standard** - JSON with metadata wrapper
3. **JSON:API Specification** - Follows JSON:API spec
4. **GraphQL Mutation** - GraphQL format
5. **XML Format** - Structured XML
6. **Form Data** - URL-encoded form data
7. **CSV Format** - Comma-separated values
8. **Custom Template** - Your own format

---

## Format Examples

### 1. JSON (Simple) ✅ **Recommended for most APIs**

**Description:** Clean JSON with just your data, no extra wrappers.

**Example Output:**
```json
{
  "products": [
    {
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "Electronics"
    }
  ],
  "customers": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

**Best For:**
- Modern REST APIs
- Microservices
- Internal systems
- When you control both ends

---

### 2. REST Standard (with metadata)

**Description:** Standard REST format with workflow metadata and tracking information.

**Example Output:**
```json
{
  "source": "sales_workflow",
  "timestamp": "2025-11-11T12:34:56.789Z",
  "workflowId": "workflow_12345",
  "executionId": "exec_67890",
  "division": "logistics",
  "action": "sync_data",
  "data": {
    "products": [...],
    "customers": [...]
  },
  "metadata": {
    "apiVersion": "1.0",
    "requestId": "req_unique_id"
  }
}
```

**Best For:**
- Enterprise APIs requiring audit trails
- Systems needing request tracking
- Compliance requirements
- Multi-version API support

---

### 3. JSON:API Specification

**Description:** Follows the [JSON:API](https://jsonapi.org/) specification for consistent API design.

**Example Output:**
```json
{
  "data": {
    "type": "workflow_sync",
    "id": "exec_67890",
    "attributes": {
      "products": [...],
      "customers": [...]
    },
    "meta": {
      "workflowId": "workflow_12345",
      "division": "logistics",
      "timestamp": "2025-11-11T12:34:56.789Z"
    }
  }
}
```

**Best For:**
- APIs following JSON:API standard
- Frontend frameworks expecting JSON:API
- Standardized API ecosystems
- When using JSON:API libraries

---

### 4. GraphQL Mutation

**Description:** Formats data as a GraphQL mutation with variables.

**Example Output:**
```json
{
  "query": "mutation SyncWorkflowData($input: WorkflowDataInput!) {\n  syncWorkflowData(input: $input) {\n    success\n    recordsProcessed\n    message\n  }\n}",
  "variables": {
    "input": {
      "workflowId": "workflow_12345",
      "executionId": "exec_67890",
      "division": "logistics",
      "products": [...],
      "customers": [...]
    }
  }
}
```

**Best For:**
- GraphQL endpoints
- Systems using GraphQL schema
- APIs requiring typed inputs
- Modern graph-based APIs

---

### 5. XML Format

**Description:** Traditional XML structure with proper escaping.

**Example Output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<WorkflowSync>
  <WorkflowId>workflow_12345</WorkflowId>
  <ExecutionId>exec_67890</ExecutionId>
  <Division>logistics</Division>
  <Timestamp>2025-11-11T12:34:56.789Z</Timestamp>
  <Data>
    <Products>
      <Item>
        <Name>Wireless Headphones</Name>
        <Price>99.99</Price>
        <Category>Electronics</Category>
      </Item>
    </Products>
    <Customers>
      <Item>
        <Name>John Doe</Name>
        <Email>john@example.com</Email>
      </Item>
    </Customers>
  </Data>
</WorkflowSync>
```

**Best For:**
- Legacy enterprise systems
- SOAP services
- Systems requiring XML
- EDI integrations

---

### 6. Form Data (URL-encoded)

**Description:** Flattens data structure into key-value pairs for form submission.

**Example Output:**
```
workflowId=workflow_12345
executionId=exec_67890
timestamp=2025-11-11T12:34:56.789Z
products[0].name=Wireless+Headphones
products[0].price=99.99
products[0].category=Electronics
customers[0].name=John+Doe
customers[0].email=john%40example.com
```

**Content-Type:** `application/x-www-form-urlencoded`

**Best For:**
- Traditional web forms
- APIs expecting form submissions
- Legacy systems
- Simple HTTP POST endpoints

---

### 7. CSV Format

**Description:** Exports array data as comma-separated values.

**Example Output:**
```csv
name,price,category
Wireless Headphones,99.99,Electronics
Bluetooth Speaker,59.99,Electronics
Laptop Stand,29.99,Accessories
```

**Best For:**
- Spreadsheet imports
- Bulk data transfers
- Database imports
- Analytics systems
- Reporting tools

**Note:** Only the first array in your data will be converted to CSV.

---

### 8. Custom Template

**Description:** Define your own format using template variables.

**Configuration:**
```json
{
  "name": "custom_division",
  "dataFormat": "custom",
  "customTemplate": "{\"workflow\":\"{{workflowId}}\",\"time\":\"{{timestamp}}\",\"payload\":{{data}}}"
}
```

**Variables Available:**
- `{{workflowId}}` - Workflow ID
- `{{executionId}}` - Execution ID
- `{{division}}` - Division name
- `{{timestamp}}` - Current timestamp
- `{{data}}` - Full data as JSON string

**Example Output:**
```json
{
  "workflow": "workflow_12345",
  "time": "2025-11-11T12:34:56.789Z",
  "payload": {
    "products": [...],
    "customers": [...]
  }
}
```

**Best For:**
- Unique API requirements
- Non-standard formats
- Legacy system compatibility
- Special integration needs

---

## Configuration Examples

### Example 1: Logistics Division (JSON Simple)

```json
{
  "dataFormat": "json",
  "divisions": [
    {
      "name": "logistics",
      "endpoint": "https://api.logistics.company.com/shipments",
      "method": "POST",
      "auth": {
        "type": "bearer",
        "token": "${LOGISTICS_API_KEY}"
      },
      "dataMapping": {
        "products": "items",
        "customers": "recipients"
      }
    }
  ]
}
```

**What Gets Sent:**
```json
{
  "items": [...],
  "recipients": [...]
}
```

---

### Example 2: Marketing Division (REST Standard)

```json
{
  "dataFormat": "rest_standard",
  "divisions": [
    {
      "name": "marketing",
      "endpoint": "https://api.marketing.company.com/campaigns",
      "method": "POST",
      "auth": {
        "type": "api_key",
        "header": "X-Marketing-Key",
        "key": "${MARKETING_API_KEY}"
      }
    }
  ]
}
```

**What Gets Sent:**
```json
{
  "source": "sales_workflow",
  "timestamp": "...",
  "workflowId": "...",
  "executionId": "...",
  "division": "marketing",
  "action": "sync_data",
  "data": { /* your data */ },
  "metadata": {
    "apiVersion": "1.0",
    "requestId": "..."
  }
}
```

---

### Example 3: Finance Division (XML)

```json
{
  "dataFormat": "xml",
  "divisions": [
    {
      "name": "finance",
      "endpoint": "https://api.finance.company.com/invoices",
      "method": "POST",
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

**What Gets Sent:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<WorkflowSync>
  <WorkflowId>...</WorkflowId>
  <Data>
    <Invoices>...</Invoices>
  </Data>
</WorkflowSync>
```

---

### Example 4: Multiple Divisions with Different Formats

```json
{
  "divisions": [
    {
      "name": "logistics",
      "endpoint": "https://api.logistics.com/sync",
      "dataFormat": "json",
      "auth": { "type": "bearer", "token": "${LOGISTICS_KEY}" }
    },
    {
      "name": "marketing",
      "endpoint": "https://api.marketing.com/leads",
      "dataFormat": "rest_standard",
      "auth": { "type": "api_key", "header": "X-API-Key", "key": "${MARKETING_KEY}" }
    },
    {
      "name": "finance",
      "endpoint": "https://api.finance.com/invoices",
      "dataFormat": "xml",
      "auth": { "type": "basic", "username": "${FINANCE_USER}", "password": "${FINANCE_PASS}" }
    }
  ]
}
```

**Note:** Each division can use a different format!

---

## Format Selection Guide

| Division Type | Recommended Format | Why |
|--------------|-------------------|-----|
| Modern REST API | JSON (Simple) | Clean, lightweight, widely supported |
| Enterprise System | REST Standard | Includes metadata for tracking |
| JSON:API Service | JSON:API | Follows specification |
| GraphQL API | GraphQL | Native format |
| Legacy System | XML or Form Data | Compatibility with older systems |
| Spreadsheet/DB | CSV | Easy import |
| Special Requirements | Custom | Maximum flexibility |

---

## Testing Your Format

Use [webhook.site](https://webhook.site) or [requestbin.com](https://requestbin.com) to test what data is being sent:

1. Get a test URL from webhook.site
2. Configure your division with that URL
3. Run workflow
4. View the exact payload in webhook.site

**Example Test Configuration:**
```json
{
  "dataFormat": "rest_standard",
  "divisions": [
    {
      "name": "test",
      "endpoint": "https://webhook.site/your-unique-id",
      "method": "POST"
    }
  ]
}
```

---

## Troubleshooting

### Division Returns Error
- **Check format**: Does the division API expect JSON, XML, or form data?
- **Check Content-Type**: Verify headers match expected format
- **Check authentication**: Ensure API keys are correct
- **Check endpoint**: Verify URL is accessible

### Data Not Formatted Correctly
- **Try different format**: Switch between JSON, REST Standard, etc.
- **Check data mapping**: Ensure field names match division expectations
- **Use custom template**: For special requirements
- **Test with webhook.site**: See exact payload

### Environment Variables Not Working
- **Syntax**: Use `${VARIABLE_NAME}` format
- **Check .env file**: Ensure variables are defined
- **Restart server**: After adding new environment variables

---

## Best Practices

1. **Start Simple**: Begin with JSON format, add complexity if needed
2. **Test First**: Use webhook.site before connecting to real division
3. **Use Environment Variables**: Never hardcode API keys
4. **Map Field Names**: Use `dataMapping` to match division expectations
5. **Handle Errors**: Check division responses in workflow results
6. **Document Format**: Note which format each division expects
7. **Version APIs**: Include version in endpoint or headers

---

## Summary

- **8 formats available** via dropdown menu
- **Each division** can use a different format
- **JSON (Simple)** recommended for most modern APIs
- **Custom template** for special requirements
- **Test with webhook.site** before production use
- **Environment variables** for secure credential management

Choose the format that matches your division's API requirements, and the connector will handle the conversion automatically!
