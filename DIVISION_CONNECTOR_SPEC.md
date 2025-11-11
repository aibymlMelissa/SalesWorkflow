# Division Connector API Specification

## Overview
The Division Connector module enables the AI Sales Workflow to integrate with other business divisions by sending and receiving data through standardized REST API endpoints.

---

## Communication Protocol

### Standard Message Format

All communications with division APIs follow this JSON structure:

```json
{
  "source": "sales_workflow",
  "timestamp": "2025-11-11T12:34:56.789Z",
  "workflowId": "workflow_12345",
  "executionId": "exec_67890",
  "division": "logistics",
  "action": "sync_data",
  "data": {
    // Division-specific payload
  },
  "metadata": {
    "apiVersion": "1.0",
    "requestId": "req_unique_id"
  }
}
```

### Required Fields:
- `source`: Always "sales_workflow"
- `timestamp`: ISO 8601 timestamp
- `workflowId`: Unique workflow identifier
- `executionId`: Current execution ID
- `division`: Target division name
- `action`: Operation to perform
- `data`: Payload specific to the division
- `metadata`: Additional context information

---

## Division Configuration Format

Division APIs are configured in the module configuration:

### Configuration Schema:

```json
{
  "divisions": [
    {
      "name": "logistics",
      "endpoint": "https://api.logistics.company.com/v1/sales-sync",
      "method": "POST",
      "auth": {
        "type": "bearer",
        "token": "${LOGISTICS_API_KEY}"
      },
      "dataMapping": {
        "products": "items",
        "customers": "recipients",
        "quotes": "orders"
      },
      "timeout": 10000,
      "retries": 3
    },
    {
      "name": "marketing",
      "endpoint": "https://api.marketing.company.com/leads",
      "method": "POST",
      "auth": {
        "type": "api_key",
        "header": "X-API-Key",
        "key": "${MARKETING_API_KEY}"
      },
      "dataMapping": {
        "customers": "leads",
        "emails": "campaigns"
      }
    }
  ],
  "syncMode": "async",
  "notifyOnComplete": true
}
```

### Configuration Fields:

#### Division Object:
- `name`: Division identifier (required)
- `endpoint`: Full API URL (required)
- `method`: HTTP method - GET, POST, PUT, PATCH (default: POST)
- `auth`: Authentication configuration (optional)
- `dataMapping`: Maps workflow data to division fields (optional)
- `timeout`: Request timeout in ms (default: 10000)
- `retries`: Number of retry attempts (default: 3)
- `headers`: Custom headers (optional)

#### Auth Types:

**1. Bearer Token:**
```json
{
  "type": "bearer",
  "token": "your-token-here"
}
```

**2. API Key (Header):**
```json
{
  "type": "api_key",
  "header": "X-API-Key",
  "key": "your-api-key"
}
```

**3. Basic Auth:**
```json
{
  "type": "basic",
  "username": "user",
  "password": "pass"
}
```

**4. OAuth2:**
```json
{
  "type": "oauth2",
  "tokenUrl": "https://auth.example.com/token",
  "clientId": "client_id",
  "clientSecret": "client_secret"
}
```

---

## Data Payload Structure

### Standard Data Types:

#### 1. Products:
```json
{
  "products": [
    {
      "id": "product_123",
      "name": "Product Name",
      "price": 99.99,
      "category": "Electronics",
      "quantity": 10,
      "description": "Product description"
    }
  ]
}
```

#### 2. Customers:
```json
{
  "customers": [
    {
      "id": "customer_456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "active",
      "metadata": {}
    }
  ]
}
```

#### 3. Quotes/Orders:
```json
{
  "quotes": [
    {
      "id": "quote_789",
      "customerId": "customer_456",
      "products": [...],
      "totalAmount": 299.99,
      "status": "pending",
      "validUntil": "2025-12-31"
    }
  ]
}
```

#### 4. Analytics:
```json
{
  "analytics": {
    "conversionRate": 0.185,
    "revenue": 15400.00,
    "customerCount": 42,
    "period": "2025-11-01 to 2025-11-11"
  }
}
```

---

## Response Format

Division APIs should respond with:

### Success Response:
```json
{
  "status": "success",
  "divisionId": "logistics",
  "requestId": "req_unique_id",
  "recordsProcessed": 25,
  "recordsUpdated": 20,
  "recordsCreated": 5,
  "timestamp": "2025-11-11T12:35:00.123Z",
  "message": "Data synchronized successfully",
  "data": {
    // Optional response data
  }
}
```

### Error Response:
```json
{
  "status": "error",
  "divisionId": "logistics",
  "requestId": "req_unique_id",
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid product data format",
  "details": {
    "field": "products[0].price",
    "error": "Price must be a positive number"
  },
  "timestamp": "2025-11-11T12:35:00.123Z"
}
```

---

## Common Actions

### 1. Sync Data (Default):
Sends workflow data to division for processing/storage
```json
{
  "action": "sync_data",
  "data": { /* workflow results */ }
}
```

### 2. Update Records:
Updates existing records in division system
```json
{
  "action": "update_records",
  "data": {
    "recordIds": ["rec1", "rec2"],
    "updates": { /* fields to update */ }
  }
}
```

### 3. Query Status:
Retrieves status from division
```json
{
  "action": "query_status",
  "data": {
    "referenceId": "workflow_12345"
  }
}
```

### 4. Notify Event:
Sends event notification
```json
{
  "action": "notify_event",
  "data": {
    "eventType": "workflow_completed",
    "eventData": { /* event details */ }
  }
}
```

---

## Example Configurations

### Logistics Division:
```json
{
  "name": "logistics",
  "endpoint": "https://api.logistics.company.com/v1/shipment-requests",
  "method": "POST",
  "auth": {
    "type": "bearer",
    "token": "${LOGISTICS_API_KEY}"
  },
  "dataMapping": {
    "products": "shipmentItems",
    "customers": "recipients",
    "quotes": "shipmentOrders"
  },
  "headers": {
    "X-Department": "sales",
    "X-Priority": "high"
  }
}
```

### Marketing Division:
```json
{
  "name": "marketing",
  "endpoint": "https://api.marketing.company.com/v2/campaigns/leads",
  "method": "POST",
  "auth": {
    "type": "api_key",
    "header": "X-Marketing-API-Key",
    "key": "${MARKETING_API_KEY}"
  },
  "dataMapping": {
    "customers": "leads",
    "emails": "emailCampaigns",
    "analysis": "performanceMetrics"
  }
}
```

### Finance Division:
```json
{
  "name": "finance",
  "endpoint": "https://api.finance.company.com/invoicing",
  "method": "POST",
  "auth": {
    "type": "basic",
    "username": "${FINANCE_USER}",
    "password": "${FINANCE_PASS}"
  },
  "dataMapping": {
    "quotes": "invoices",
    "customers": "billingAccounts"
  }
}
```

### Inventory Division:
```json
{
  "name": "inventory",
  "endpoint": "https://api.inventory.company.com/stock/sync",
  "method": "PUT",
  "auth": {
    "type": "bearer",
    "token": "${INVENTORY_API_KEY}"
  },
  "dataMapping": {
    "products": "inventoryItems",
    "quotes": "reservations"
  }
}
```

---

## Environment Variables

Add division API credentials to `.env`:

```bash
# Division API Keys
LOGISTICS_API_KEY=your_logistics_api_key
MARKETING_API_KEY=your_marketing_api_key
FINANCE_USER=finance_user
FINANCE_PASS=finance_password
INVENTORY_API_KEY=your_inventory_api_key
```

---

## Error Handling

The connector implements:
- **Automatic retries** (3 attempts by default)
- **Exponential backoff** between retries
- **Timeout handling** (10 seconds default)
- **Detailed error logging**
- **Graceful degradation** (continues workflow even if division fails)

### Error Codes:
- `CONNECTION_ERROR`: Cannot reach division API
- `AUTHENTICATION_ERROR`: Invalid credentials
- `VALIDATION_ERROR`: Invalid data format
- `TIMEOUT_ERROR`: Request took too long
- `SERVER_ERROR`: Division API error (5xx)
- `RATE_LIMIT_ERROR`: Too many requests

---

## Security Considerations

1. **Use Environment Variables**: Never hardcode API keys
2. **HTTPS Only**: All division endpoints must use HTTPS
3. **Token Rotation**: Regularly rotate API keys
4. **Least Privilege**: Use read/write permissions as needed
5. **Audit Logging**: All division calls are logged
6. **Data Validation**: Validate all data before sending

---

## Testing Your Division API

### Mock Division Endpoint:
You can test with a mock service like webhook.site or requestbin.com

Example test configuration:
```json
{
  "divisions": [
    {
      "name": "test_division",
      "endpoint": "https://webhook.site/your-unique-id",
      "method": "POST",
      "auth": {
        "type": "bearer",
        "token": "test-token-123"
      }
    }
  ]
}
```

This will show you exactly what data is being sent to your division APIs.

---

## Best Practices

1. **Keep Divisions Stateless**: Each request should be independent
2. **Use Data Mapping**: Map workflow fields to division-specific names
3. **Set Reasonable Timeouts**: Balance between patience and workflow speed
4. **Monitor Sync Status**: Check division responses for errors
5. **Implement Webhooks**: For async operations, have divisions call back
6. **Version Your APIs**: Include API version in endpoint or headers
7. **Document Division Requirements**: Each division should document its expected format

---

## Support

For division-specific integration questions, contact the division's API team:
- Logistics: logistics-api@company.com
- Marketing: marketing-tech@company.com
- Finance: finance-api@company.com
- Inventory: inventory-systems@company.com
