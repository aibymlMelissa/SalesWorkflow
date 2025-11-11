import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { workflowRoutes } from './routes/workflows.js';
import { moduleRoutes } from './routes/modules.js';
import { executionRoutes } from './routes/executions.js';
import { inspectorRoutes } from './routes/inspector.js';
import { initializeEnhancedModules } from './utils/enhanced-modules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5273;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/inspector', inspectorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // Handle SPA routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function startServer() {
  await initializeEnhancedModules();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);