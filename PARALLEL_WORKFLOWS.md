# Parallel Workflows & Multiple Inputs

## 🚀 Overview

The AI Sales Workflow Builder now supports **parallel processing** and **multiple inputs**, allowing you to:

1. **Run multiple modules simultaneously** when they don't depend on each other
2. **Merge data from multiple sources** into a single module
3. **Create complex workflow graphs** with branches and joins
4. **Reduce workflow execution time** through parallelism

---

## 📊 Key Concepts

### 1. Dependencies (`dependsOn`)

Each workflow step can specify which other steps it depends on:

```json
{
  "instanceId": "step3",
  "moduleId": "sales-analysis",
  "dependsOn": ["step1", "step2"],  // Waits for step1 AND step2
  "config": {}
}
```

### 2. Parallel Execution

Steps with **no dependencies** or **satisfied dependencies** run **in parallel**:

```
Step1 (Scraper)  ──┐
                    ├──> Step3 (Analysis)
Step2 (Chatbot)  ──┘
```

### 3. Multiple Inputs

When a step depends on multiple previous steps, their outputs are automatically merged:

```javascript
// Step3 receives merged data from Step1 and Step2:
{
  products: [...],      // from Step1
  customers: [...],     // from Step2
  _sources: ["step1", "step2"],
  _allResults: [result1, result2]
}
```

---

## 🎯 How to Create Parallel Workflows

### Example 1: Simple Parallel Execution

**Scenario:** Scrape products AND run chatbot **at the same time**

```json
{
  "name": "Parallel Data Collection",
  "steps": [
    {
      "instanceId": "scraper",
      "moduleId": "ecommerce-scraper",
      "config": { "url": "https://example.com" }
      // No dependsOn - runs immediately
    },
    {
      "instanceId": "chatbot",
      "moduleId": "web-chatbot",
      "config": { "personality": "friendly" }
      // No dependsOn - runs in parallel with scraper!
    },
    {
      "instanceId": "analysis",
      "moduleId": "sales-analysis",
      "dependsOn": ["scraper", "chatbot"],  // Waits for BOTH
      "config": {}
    }
  ]
}
```

**Execution Timeline:**
```
Time 0s:  [Scraper]  [Chatbot]  (parallel)
          └──────┬──────┘
Time 5s:        [Analysis]      (waits for both)
```

---

### Example 2: Diamond Pattern (Fork & Join)

**Scenario:** Process product data in 3 different ways, then combine results

```json
{
  "steps": [
    {
      "instanceId": "source",
      "moduleId": "ecommerce-scraper",
      "config": {"url": "..."}
    },
    {
      "instanceId": "enhance",
      "moduleId": "product-info",
      "dependsOn": ["source"]
    },
    {
      "instanceId": "pricing",
      "moduleId": "discount-pricing",
      "dependsOn": ["source"]
    },
    {
      "instanceId": "intel",
      "moduleId": "business-intelligence",
      "dependsOn": ["source"]
    },
    {
      "instanceId": "final",
      "moduleId": "connector-divisions",
      "dependsOn": ["enhance", "pricing", "intel"]  // Merge all 3!
    }
  ]
}
```

**Execution Graph:**
```
       [Source]
          │
    ┌─────┼─────┐
    │     │     │
[Enhance][Pricing][Intel]  (parallel)
    │     │     │
    └─────┼─────┘
          │
      [Division Connector]
```

---

### Example 3: Complex Pipeline

```json
{
  "steps": [
    // Parallel data sources
    {"instanceId": "web_scrape", "moduleId": "ecommerce-scraper"},
    {"instanceId": "chatbot_leads", "moduleId": "web-chatbot"},

    // Process each source
    {"instanceId": "process_products", "moduleId": "product-info", "dependsOn": ["web_scrape"]},
    {"instanceId": "process_customers", "moduleId": "product-info", "dependsOn": ["chatbot_leads"]},

    // Parallel analysis branches
    {"instanceId": "pricing", "moduleId": "discount-pricing", "dependsOn": ["process_products", "process_customers"]},
    {"instanceId": "quotations", "moduleId": "quotation", "dependsOn": ["process_products", "process_customers"]},

    // Final merge
    {"instanceId": "send_emails", "moduleId": "email-interact", "dependsOn": ["pricing", "quotations"]},
    {"instanceId": "sync_divisions", "moduleId": "connector-divisions", "dependsOn": ["pricing", "quotations"]}
  ]
}
```

---

## 🔧 API Endpoints

### 1. Execute Workflow in Parallel

```bash
POST /api/workflows/:id/execute-parallel
```

**Response:**
```json
{
  "workflowId": "workflow_123",
  "status": "completed",
  "executionMode": "parallel",
  "duration": "3247ms",
  "parallelism": {
    "maxParallelism": 3,
    "levels": [
      ["step1", "step2"],
      ["step3", "step4", "step5"],
      ["step6"]
    ],
    "independentPaths": 2
  },
  "results": {
    "step1": {...},
    "step2": {...}
  },
  "stats": {
    "total": 6,
    "completed": 6,
    "running": 0,
    "pending": 0
  }
}
```

### 2. Analyze Workflow Parallelism

```bash
GET /api/workflows/:id/analyze
```

**Response:**
```json
{
  "workflowId": "workflow_123",
  "analysis": {
    "maxParallelism": 3,
    "levels": [...],
    "independentPaths": 2,
    "canParallelize": true,
    "estimatedSpeedup": "3x (theoretical maximum)"
  }
}
```

---

## 📋 Data Merging Rules

When a step has multiple inputs, data is merged automatically:

### Arrays - Concatenated
```javascript
// Input 1: {products: [A, B]}
// Input 2: {products: [C, D]}
// Merged:  {products: [A, B, C, D]}
```

### Objects - Merged
```javascript
// Input 1: {config: {a: 1, b: 2}}
// Input 2: {config: {b: 3, c: 4}}
// Merged:  {config: {a: 1, b: 3, c: 4}}
```

### Primitives - First Non-Null
```javascript
// Input 1: {status: "ok"}
// Input 2: {status: "error"}
// Merged:  {status: "ok"}  // First one wins
```

### Metadata Added
```javascript
{
  // ... your merged data ...
  _sources: ["step1", "step2"],      // Where data came from
  _allResults: [result1, result2]    // Original results
}
```

---

## 🎨 Workflow Patterns

### Pattern 1: Fan-Out (One → Many)
```
[Source] → [Process1]
        → [Process2]
        → [Process3]
```
**Use:** Parallel processing of same data

### Pattern 2: Fan-In (Many → One)
```
[Source1] ┐
[Source2] ├→ [Merge]
[Source3] ┘
```
**Use:** Combining multiple data sources

### Pattern 3: Pipeline
```
[Step1] → [Step2] → [Step3]
```
**Use:** Sequential processing (no parallelism)

### Pattern 4: Diamond
```
    [Source]
   /    |    \
[A]    [B]    [C]
   \    |    /
    [Merge]
```
**Use:** Parallel branches that rejoin

---

## ⚡ Performance Benefits

### Sequential Execution:
```
[Step1: 2s] → [Step2: 3s] → [Step3: 2s] = 7 seconds total
```

### Parallel Execution:
```
[Step1: 2s] ┐
[Step2: 3s] ├→ [Step3: 2s] = 5 seconds total
[Step3: 2s] ┘
```

**Speedup = 7s / 5s = 1.4x faster!**

---

## 🔍 Execution Algorithm

The parallel executor uses a **topological sort** with dependency tracking:

1. **Identify ready steps** (all dependencies satisfied)
2. **Execute all ready steps in parallel** (Promise.all)
3. **Update completed set**
4. **Repeat** until all steps complete

### Deadlock Detection
If no steps are ready and some are still pending → **deadlock detected**

---

## 💡 Best Practices

### 1. Minimize Dependencies
```javascript
// ❌ Bad - creates unnecessary dependency
{"dependsOn": ["step1"]}  // when you don't actually need step1's data

// ✅ Good - only depend on what you need
{"dependsOn": []}  // independent step
```

### 2. Group Independent Operations
```javascript
// Run these in parallel:
- Data scraping
- Chatbot interactions
- Email campaigns

// Then merge for analysis
```

### 3. Balance Parallel Branches
```javascript
// ❌ Bad - unbalanced
Branch 1: 10 seconds
Branch 2: 1 second
// Total: 10 seconds (waiting for Branch 1)

// ✅ Good - balanced
Branch 1: 5 seconds
Branch 2: 5 seconds
// Total: 5 seconds
```

### 4. Use Analysis Endpoint First
```bash
# Check parallelism before executing
GET /api/workflows/:id/analyze

# If maxParallelism > 1, use parallel execution!
POST /api/workflows/:id/execute-parallel
```

---

## 🧪 Testing Examples

### Test 1: Verify Parallel Execution

```javascript
// Create workflow with 2 independent steps
const workflow = {
  steps: [
    {instanceId: "a", moduleId: "ecommerce-scraper"},
    {instanceId: "b", moduleId: "web-chatbot"}
  ]
};

// Execute
const result = await executeParallel(workflow);

// Check: both should run in parallel
console.log(result.parallelism.maxParallelism);  // Should be 2
```

### Test 2: Verify Data Merging

```javascript
const workflow = {
  steps: [
    {instanceId: "products", moduleId: "ecommerce-scraper"},
    {instanceId: "customers", moduleId: "web-chatbot"},
    {instanceId: "merge", moduleId: "sales-analysis",
     dependsOn: ["products", "customers"]}
  ]
};

const result = await executeParallel(workflow);

// Check merged data
const mergeInput = result.results.merge;
console.log(mergeInput._sources);  // ["products", "customers"]
console.log(mergeInput.products);  // From products step
console.log(mergeInput.customers); // From customers step
```

---

## 📊 Monitoring & Debugging

### Check Execution Stats
```javascript
{
  "stats": {
    "total": 10,
    "completed": 10,
    "running": 0,
    "pending": 0
  }
}
```

### View Parallelism Levels
```javascript
{
  "levels": [
    ["step1", "step2"],      // Level 0: 2 parallel
    ["step3"],               // Level 1: 1 step
    ["step4", "step5", "step6"]  // Level 2: 3 parallel
  ]
}
```

### Server Logs
```
Executing 3 steps in parallel: [step1, step2, step3]
✓ Completed: step1
✓ Completed: step2
✓ Completed: step3
Executing 1 steps in parallel: [step4]
✓ Completed: step4
```

---

## 🚨 Common Pitfalls

### 1. Circular Dependencies
```javascript
// ❌ DEADLOCK!
step1.dependsOn = ["step2"]
step2.dependsOn = ["step1"]
```

### 2. Missing Dependencies
```javascript
// ❌ Step3 runs before step1/step2 complete
{instanceId: "step3", moduleId: "analysis"}
// Missing: dependsOn: ["step1", "step2"]
```

### 3. Over-Parallelization
```javascript
// ❌ Too many parallel API calls → rate limiting
// Better: batch or limit parallelism
```

---

## 📚 Summary

✅ **Parallel Execution:** Steps run simultaneously when independent
✅ **Multiple Inputs:** Data automatically merged from dependencies
✅ **Dependency Graph:** Use `dependsOn` to control execution order
✅ **Performance:** Up to Nx speedup (N = max parallel steps)
✅ **Analysis API:** Check parallelism before execution
✅ **Automatic Merging:** Arrays concatenated, objects merged

**Try it now!** Use the `/execute-parallel` endpoint for faster workflows!

---

## 🔗 Related Documentation

- [API Endpoints](./README.md#api-endpoints)
- [Module Configuration](./IMPLEMENTATION_STATUS.md)
- [Division Connector](./DIVISION_CONNECTOR_README.md)
