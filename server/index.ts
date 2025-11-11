import express from 'express';
import cors from 'cors';
import { workflowRoutes } from './routes/workflows.js';
import { moduleRoutes } from './routes/modules.js';
import { executionRoutes } from './routes/executions.js';
import { inspectorRoutes } from './routes/inspector.js';
import { initializeEnhancedModules } from './utils/enhanced-modules.js';

const app = express();
const PORT = process.env.PORT || 5273;

app.use(cors());
app.use(express.json());

app.use('/api/workflows', workflowRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/inspector', inspectorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function startServer() {
  await initializeEnhancedModules();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);