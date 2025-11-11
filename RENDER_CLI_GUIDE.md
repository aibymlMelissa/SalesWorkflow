# Render CLI Usage Guide

The Render CLI has been installed on your system and is ready to use for managing your AI Sales Workflow deployment.

**Version**: 2.5.0
**Account**: aibyml.com@gmail.com
**Repository**: https://github.com/aibymlMelissa/SalesWorkflow

---

## 🚀 Quick Start

### 1. Login to Render

First, authenticate with your Render account:

```bash
render login
```

This will:
- Open your browser to authorize
- Generate and save an authentication token
- Prompt you to select your active workspace

### 2. Set Your Workspace

If you have multiple workspaces, select the correct one:

```bash
render workspace set
```

---

## 📋 Essential Commands

### Check Deployment Status

List all your services:

```bash
render services
```

View recent deploys for your service:

```bash
render deploys list
```

### View Live Logs

Stream logs from your service in real-time:

```bash
render logs
```

With filters:

```bash
render logs --tail 100              # Last 100 lines
render logs --follow                # Stream live logs
render logs --output json           # JSON format
```

### Trigger a Manual Deploy

Force a new deployment:

```bash
render deploys create
```

This will prompt you to select which service to deploy.

### Restart Your Service

Restart without triggering a new build:

```bash
render restart
```

### Check Who's Logged In

Verify your authentication:

```bash
render whoami
```

---

## 🔍 Advanced Commands

### SSH Into Your Service

Access your running service instance:

```bash
render ssh
```

This is useful for:
- Debugging production issues
- Checking file system
- Running commands directly

### View Environment Variables

List all services with their details:

```bash
render services --output json
```

### Check Service Health

View detailed service information:

```bash
render services list --output yaml
```

### View Deploy History

See all past deployments:

```bash
render deploys list --output json
```

---

## 🤖 Non-Interactive Mode (CI/CD)

For scripts and automation, use non-interactive mode:

### Set API Key

Instead of `render login`, set an environment variable:

```bash
export RENDER_API_KEY=your_api_key_here
```

Get your API key from: https://dashboard.render.com/u/settings/api-keys

### Use Flags for Automation

```bash
# List services in JSON format
render services --output json --confirm

# Trigger deploy without prompts
render deploys create SERVICE_ID --confirm

# Stream logs to file
render logs SERVICE_ID --follow --output json > logs.json
```

---

## 🛠️ Common Workflows

### Workflow 1: Check Deployment Status

```bash
# Step 1: List services
render services

# Step 2: Check recent deploys
render deploys list

# Step 3: View logs if there's an issue
render logs --tail 200
```

### Workflow 2: Force Redeploy

```bash
# Option 1: Trigger new deploy (rebuilds from GitHub)
render deploys create

# Option 2: Just restart (no rebuild)
render restart
```

### Workflow 3: Debug Production Issue

```bash
# Step 1: View live logs
render logs --follow

# Step 2: SSH into service if needed
render ssh

# Step 3: Check environment and files
# (inside SSH session)
echo $NODE_ENV
ls -la
cat data/modules.json
```

### Workflow 4: Monitor Real-time Execution

```bash
# Stream logs and filter for errors
render logs --follow | grep -i "error\|failed\|exception"

# Or save to file for analysis
render logs --follow > deployment.log
```

---

## 📊 Service Information

To get details about your AI Sales Workflow service:

```bash
# Interactive selection
render services

# JSON output for scripting
render services --output json

# Find your service ID
render services --output json | grep -i "ai-sales-workflow-builder"
```

---

## 🔐 Environment Variable Management

While the CLI can view environment variables, to modify them:

1. **Via Dashboard** (Recommended):
   - Go to https://dashboard.render.com
   - Select your service
   - Navigate to "Environment" tab
   - Add/Edit/Remove variables

2. **Via render.yaml** (For new services):
   - Update `render.yaml` in your repository
   - Push to GitHub
   - Render will auto-deploy with new config

---

## 📝 Useful Command Combinations

### Check if Deployment Succeeded

```bash
render deploys list | head -10
```

Look for status: "live" or "build_failed"

### Get Service URL

```bash
render services --output json | grep -i "serviceUrl"
```

### Monitor Build Progress

```bash
render logs --follow
```

Watch for:
- `==> Building...`
- `✓ built in XXXms`
- `==> Deploying...`
- `==> Your service is live 🎉`

### Quick Health Check

```bash
# Check service status
render services | grep -A 5 "ai-sales-workflow"

# Verify it's running
curl https://your-service-url.onrender.com/health
```

---

## 🚨 Troubleshooting

### Error: "Not logged in"

```bash
render login
```

### Error: "No workspace selected"

```bash
render workspace set
```

### Can't Find Your Service

```bash
# List all services
render services

# Or check all workspaces
render workspace list
render workspace set
```

### Deploy Failed

```bash
# View build logs
render logs --tail 500

# Check for specific errors
render logs | grep -i "error\|failed"
```

### Service Won't Start

```bash
# Check current status
render services

# View startup logs
render logs --tail 100

# Try restarting
render restart
```

---

## 📚 Additional Resources

- **Official Docs**: https://render.com/docs/cli
- **GitHub**: https://github.com/render-oss/cli
- **API Keys**: https://dashboard.render.com/u/settings/api-keys
- **Support**: https://render.com/docs/support

---

## 🎯 Your Service Details

**Service Name**: `ai-sales-workflow-builder`
**GitHub Repo**: `aibymlMelissa/SalesWorkflow`
**Branch**: `main`
**Auto-Deploy**: Enabled

### Expected Endpoints

Once deployed, your service should respond at:

- **Health Check**: `/health`
- **API Base**: `/api`
- **Frontend**: `/` (served from `/dist`)

### Test Your Deployment

```bash
# Get your service URL first
SERVICE_URL=$(render services --output json | grep -o 'https://[^"]*')

# Test health endpoint
curl $SERVICE_URL/health

# Should return:
# {"status":"OK","timestamp":"..."}
```

---

## 💡 Pro Tips

1. **Alias for Quick Access**:
   ```bash
   echo 'alias rlogs="render logs --follow"' >> ~/.zshrc
   echo 'alias rdeploy="render deploys create"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Monitor Multiple Services**:
   ```bash
   watch -n 5 'render services | grep -i status'
   ```

3. **Export Logs**:
   ```bash
   render logs --tail 1000 > logs-$(date +%Y%m%d-%H%M%S).txt
   ```

4. **Quick Status Check**:
   ```bash
   render services && render deploys list | head -5
   ```

---

## 🎉 Ready to Use!

The Render CLI is now installed and ready. Start with:

```bash
render login
```

Then explore your services:

```bash
render services
render logs --follow
```

Happy deploying! 🚀
