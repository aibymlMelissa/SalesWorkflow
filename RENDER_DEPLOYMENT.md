# Deploying AI Sales Workflow Builder to Render

This guide will walk you through deploying the application to Render using the account: **aibyml.com@gmail.com**

## Prerequisites

- Render account (aibyml.com@gmail.com)
- GitHub repository: https://github.com/aibymlMelissa/SalesWorkflow
- OpenAI API key
- (Optional) SMTP credentials for email functionality

---

## Deployment Steps

### Method 1: Using Blueprint (Recommended - One-Click Deploy)

1. **Log in to Render**
   - Go to https://render.com
   - Log in with aibyml.com@gmail.com

2. **Create New Service from Blueprint**
   - Click "New +" in the top right
   - Select "Blueprint"
   - Connect your GitHub account if not already connected
   - Select repository: `aibymlMelissa/SalesWorkflow`
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**

   You'll need to set these environment variables:

   **Required:**
   - `OPENAI_API_KEY` - Your OpenAI API key

   **Optional (for email features):**
   - `SMTP_HOST` - Your SMTP server (e.g., smtp.gmail.com)
   - `SMTP_PORT` - SMTP port (default: 587)
   - `SMTP_USER` - SMTP username
   - `SMTP_PASS` - SMTP password
   - `EMAIL_FROM` - Sender email address

4. **Deploy**
   - Click "Apply" to create the service
   - Render will automatically:
     - Install dependencies
     - Build the frontend (Vite)
     - Build the backend (TypeScript to JavaScript)
     - Start the production server
   - Wait for deployment to complete (~5-10 minutes)

5. **Access Your Application**
   - Your app will be available at: `https://ai-sales-workflow-builder.onrender.com`
   - Or a custom URL if you configure one

---

### Method 2: Manual Web Service Setup

If blueprint doesn't work, follow these steps:

1. **Log in to Render**
   - Go to https://render.com
   - Log in with aibyml.com@gmail.com

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `aibymlMelissa/SalesWorkflow`
   - Click "Connect"

3. **Configure Service Settings**

   **Basic Settings:**
   - Name: `ai-sales-workflow-builder`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Runtime: `Node`

   **Build & Deploy Settings:**
   - Build Command: `npm run render-build`
   - Start Command: `npm start`

   **Instance Type:**
   - Free tier (or paid plan based on your needs)

4. **Add Environment Variables**

   Click "Advanced" and add these environment variables:

   ```
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo

   # Optional - for email features
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the initial deployment (~5-10 minutes)

---

## Post-Deployment Configuration

### Setting Up OpenAI API Key

1. **Get OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key or use existing one
   - Copy the key

2. **Add to Render**
   - In your Render service dashboard
   - Go to "Environment" tab
   - Add/Update: `OPENAI_API_KEY=your_key_here`
   - Click "Save Changes"
   - Service will automatically redeploy

### Setting Up Email (Optional)

If using Gmail SMTP:

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to Render Environment Variables**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

---

## Monitoring & Maintenance

### View Logs

1. Go to your service dashboard in Render
2. Click "Logs" tab
3. View real-time logs for debugging

### Check Health

- Health endpoint: `https://your-app.onrender.com/health`
- Should return: `{"status":"OK","timestamp":"..."}`

### Auto-Deploy

The service is configured for auto-deploy:
- Every push to `main` branch triggers a new deployment
- You can disable this in service settings if needed

---

## Troubleshooting

### Build Fails

**Issue:** TypeScript compilation errors

**Solution:**
```bash
# Test build locally first
npm run build:all

# If successful, commit and push
git add .
git commit -m "Fix build issues"
git push
```

### Service Won't Start

**Issue:** `Cannot find module` errors

**Solution:**
- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Verify `package.json` has correct start script: `"start": "node dist-server/index.js"`

### API Errors

**Issue:** OpenAI API errors or 401 Unauthorized

**Solution:**
1. Verify `OPENAI_API_KEY` is set correctly in environment variables
2. Check API key is valid and has credits
3. Restart service after adding/updating env vars

### Slow Cold Starts (Free Tier)

**Issue:** First request takes 30-60 seconds

**Solution:**
- This is normal for Render's free tier (services spin down after 15 min of inactivity)
- Upgrade to paid plan for always-on service
- Or accept the cold start delay

---

## Custom Domain (Optional)

1. **Add Custom Domain**
   - In service settings, go to "Custom Domains"
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `workflow.aibyml.com`)

2. **Configure DNS**
   - Add CNAME record in your DNS provider:
   - Name: `workflow` (or whatever subdomain you want)
   - Value: Your Render URL

3. **SSL Certificate**
   - Render automatically provisions SSL certificates
   - Your site will be available at `https://workflow.aibyml.com`

---

## Cost Estimates

### Free Tier
- ✅ 750 hours/month of service runtime
- ✅ Automatic SSL
- ❌ Services spin down after 15 minutes of inactivity
- ❌ Limited CPU/memory

### Paid Plans (Starter - $7/month)
- ✅ Always-on service
- ✅ More CPU and memory
- ✅ No cold starts
- ✅ Priority support

---

## Testing Deployment

After deployment, test these features:

1. **Load Demo Workflow**
   - Click "Load Demo Workflow" button
   - Verify all 11 modules appear

2. **Execute Workflow**
   - Scroll to "Implement Experiment"
   - Click "Execute Workflow"
   - Check for successful execution

3. **Module Functionality**
   - Test web scraping (may need real URL)
   - Test AI features (requires OpenAI key)
   - Test email sending (requires SMTP config)

---

## Need Help?

- **Render Documentation**: https://render.com/docs
- **GitHub Issues**: https://github.com/aibymlMelissa/SalesWorkflow/issues
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## Summary

Your application is now deployed and ready to use! 🎉

**Live URL**: https://your-service-name.onrender.com

The deployment includes:
- ✅ Full-stack application (React + Express)
- ✅ Parallel workflow execution
- ✅ Real AI integrations (OpenAI)
- ✅ Web scraping capabilities
- ✅ Email automation (if configured)
- ✅ Auto-deploy from GitHub
- ✅ SSL certificate
- ✅ Health monitoring

Enjoy your automated sales workflow system!
