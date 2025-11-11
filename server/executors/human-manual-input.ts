interface HumanManualInputConfig {
  inputType?: string;
  instruction?: string;
  requiredFields?: string;
  assignee?: string;
}

export async function executeHumanManualInput(config: HumanManualInputConfig, inputData: any): Promise<any> {
  try {
    const inputType = config.inputType || 'Customer details, Product specifications, etc.';
    const instruction = config.instruction || 'Please enter the required information';
    const assignee = config.assignee || 'sales@company.com';
    const requiredFields = config.requiredFields
      ? config.requiredFields.split(',').map(f => f.trim())
      : ['name', 'email', 'phone', 'notes'];

    console.log(`Manual data entry required: ${inputType} from ${assignee}`);

    // In a real implementation, this would:
    // 1. Create a form/interface for data entry
    // 2. Send notification to assignee
    // 3. Pause workflow until data is entered
    // 4. Validate entered data
    // 5. Continue workflow with the new data

    const inputRequest = {
      status: 'awaiting_data_entry',
      inputType: inputType,
      assignee: assignee,
      instruction: instruction,
      requiredFields: requiredFields,
      dataEntered: false,
      assignedAt: new Date().toISOString(),
      completedAt: null,
      enteredData: null
    };

    // Generate context summary for the person entering data
    let contextSummary = 'Manual data entry required for workflow:\n\n';
    contextSummary += `Input Type: ${inputType}\n`;
    contextSummary += `Required Fields: ${requiredFields.join(', ')}\n\n`;

    if (inputData) {
      contextSummary += 'Previous Workflow Context:\n';
      if (inputData.products) {
        contextSummary += `- ${inputData.products.length} products in workflow\n`;
      }
      if (inputData.customers) {
        contextSummary += `- ${inputData.customers.length} customers identified\n`;
      }
      if (inputData.quotes) {
        contextSummary += `- ${inputData.quotes.length} quotes generated\n`;
      }
    }

    // Create a form template
    const formTemplate = {
      title: `Manual Input Required: ${inputType}`,
      instructions: instruction,
      fields: requiredFields.map(field => ({
        name: field,
        label: field.charAt(0).toUpperCase() + field.slice(1),
        type: inferFieldType(field),
        required: true,
        value: null
      }))
    };

    return {
      status: 'awaiting_data_entry',
      inputRequest: inputRequest,
      contextSummary: contextSummary,
      formTemplate: formTemplate,
      assignee: assignee,
      inputType: inputType,
      requiredFields: requiredFields,
      message: `Workflow paused for manual data entry by ${assignee}. In production, the assignee would receive a notification and can enter data through a form interface.`,
      nextSteps: [
        'Assignee receives notification',
        'Assignee reviews context and instructions',
        'Assignee fills out required fields',
        'Data is validated',
        'Workflow continues with entered data'
      ],
      // In production, this would include:
      // formUrl: 'https://yourapp.com/forms/12345',
      // notificationSent: true,
      assignedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Human manual input error:', error.message);

    return {
      status: 'error',
      error: error.message,
      message: 'Failed to create manual input request. ' + error.message
    };
  }
}

function inferFieldType(fieldName: string): string {
  const lowerField = fieldName.toLowerCase();

  if (lowerField.includes('email')) return 'email';
  if (lowerField.includes('phone') || lowerField.includes('tel')) return 'tel';
  if (lowerField.includes('date')) return 'date';
  if (lowerField.includes('price') || lowerField.includes('amount') || lowerField.includes('cost')) return 'number';
  if (lowerField.includes('url') || lowerField.includes('website')) return 'url';
  if (lowerField.includes('notes') || lowerField.includes('description') || lowerField.includes('comment')) return 'textarea';

  return 'text';
}
