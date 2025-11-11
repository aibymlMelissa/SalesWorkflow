# AI Sales Workflow Builder

An interactive full-stack application to design and visualize custom AI-powered sales and e-commerce workflows by connecting various functional modules. This application allows users to build sequences of operations, configure each step, execute workflows, and simulate the entire sales process.

## Features

- **Full-Stack Architecture:** Complete frontend and backend with RESTful API
- **Modular Design:** Choose from a variety of pre-built modules to construct your ideal sales process
- **Easy Workflow Creation:** Simply click on modules to add them sequentially to your workflow
- **Step Configuration:** Customize individual steps with specific parameters (e.g., target URLs, customer segments, discount percentages)
- **LLM Integration:** Select your preferred Large Language Model (like Gemini 2.5 Flash) for AI-powered modules
- **Workflow Execution:** Run workflows step-by-step with simulation and real-time results
- **Data Persistence:** Save and manage multiple workflows with JSON-based storage
- **Interactive Inspection:** A visual "inspector" tool allows you to step through and review your completed workflow
- **Responsive UI:** The interface is designed to work seamlessly across different screen sizes

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd SalesWorkflow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm run server
   ```

4. **In a new terminal, start the frontend:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## How to Use

### Building Workflows

1. **Choose Modules:** On the left panel, you will find a list of available modules. Each card includes the module's name, icon, and a brief description of its function.

2. **Build Your Workflow:** Click on any module card to add it to the "Your Workflow" panel on the right. You can add modules in any order you wish. The "Human Decision" module can be added multiple times to represent various approval stages.

3. **Configure Steps:** Modules with a gear icon (⚙️) are configurable. Click the icon on a step in your workflow to open a modal where you can input specific settings.

4. **Select AI Model:** For modules that are AI-powered, a dropdown menu will appear on the workflow step. You can use this to select the Large Language Model you want to use for that task.

5. **Save Workflows:** Your workflows are automatically saved and can be retrieved later.

### Executing Workflows

1. **Inspect the Process:** Once your workflow is assembled, click the "Inspect Workflow" button. This activates an animation and a scrubber. Use the slider to navigate through each step of your process, highlighting the active module.

2. **Execute Steps:** Run individual workflow steps and see simulated results including performance metrics, data processing outcomes, and AI-generated insights.

3. **Monitor Progress:** Track workflow execution status, view step-by-step results, and analyze the overall performance.

4. **Reset:** To start over, click the "Reset" button. This will clear all steps from the workflow panel.

## Available Modules

| Module Name                   | Type | Description                                                                                  |
| ----------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| **E-commerce Scrapper** 🛍️   | Data | Scrape product data, images, and prices from your website to build a product database        |
| **Product Information** 📦   | Data | Review, select, and standardize product information for use in the automation process        |
| **WhatsApp Sales Assistant** 💬 | AI | Automate customer chats and sales follow-ups on WhatsApp                                    |
| **Web Sales Chatbot** 🤖     | AI   | Engage website visitors 24/7 to answer questions and capture leads                          |
| **New and Revised Quotation** 💰 | AI | Generate, revise, and send sales quotes to customers personally                             |
| **Email Interact with Customer** 📧 | AI | Automate personalized email quotations, re-quotes, and follow-ups                          |
| **Sales Analysis** 📊        | AI   | Analyze sales data and generate performance reports for each step in the workflow           |
| **Business Intelligence** 📈 | AI   | Generate comparison reports on similar products and find actionable business insights       |
| **Connector to Divisions** 🔗 | Integration | Connect and sync workflow data with other business divisions (e.g., logistics, marketing)   |
| **Human Decision** 👤        | Manual | Pause the automation for manual review, approval, or input from a team member               |
| **Discount & Pricing Strategy** 💸 | AI | Automatically apply dynamic discounts and strategic pricing models for different customers |

## API Endpoints

### Modules
- `GET /api/modules` - Get all available modules
- `GET /api/modules/:id` - Get specific module details

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get specific workflow
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update existing workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Start workflow execution
- `GET /api/workflows/:id/executions` - Get workflow execution history

### Executions
- `GET /api/executions` - Get all executions
- `GET /api/executions/:id` - Get specific execution
- `POST /api/executions/:id/step` - Execute next step in workflow

### Health Check
- `GET /health` - Server health status

## Project Structure

```
SalesWorkflow/
├── server/                 # Backend API server
│   ├── index.ts           # Main server file
│   ├── types.ts           # TypeScript type definitions
│   ├── routes/            # API route handlers
│   │   ├── workflows.ts   # Workflow CRUD operations
│   │   ├── modules.ts     # Module management
│   │   └── executions.ts  # Workflow execution
│   └── utils/             # Utility functions
│       ├── storage.ts     # Data persistence layer
│       └── init-modules.ts # Module initialization
├── data/                  # JSON data storage (auto-created)
│   ├── workflows.json     # Saved workflows
│   ├── executions.json    # Execution history
│   └── modules.json       # Module definitions
├── components/            # React components
├── types.ts              # Frontend type definitions
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Available Scripts

### Development
- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend with hot reload

### Production
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server

## Tech Stack

### Frontend
- **React** 19.1.1 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (implied from original)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation
- **TSX** - TypeScript execution

### Data Storage
- **JSON Files** - Simple file-based persistence
- **File System API** - Data management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please check the API health endpoint at `http://localhost:3001/health` to ensure the backend is running properly.