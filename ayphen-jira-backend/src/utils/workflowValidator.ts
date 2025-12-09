// Workflow validation utilities

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(workflow: any): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if workflow has name
  if (!workflow.name || workflow.name.trim() === '') {
    errors.push('Workflow must have a name');
  }
  
  // Check if workflow has at least one status
  if (!workflow.statuses || workflow.statuses.length === 0) {
    errors.push('Workflow must have at least one status');
  }
  
  // Check for duplicate status IDs
  if (workflow.statuses) {
    const statusIds = workflow.statuses.map((s: any) => s.id);
    const duplicates = statusIds.filter((id: string, index: number) => statusIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate status IDs found: ${duplicates.join(', ')}`);
    }
  }
  
  // Check if transitions reference valid statuses
  if (workflow.transitions && workflow.statuses) {
    const validStatusIds = workflow.statuses.map((s: any) => s.id);
    
    workflow.transitions.forEach((transition: any, index: number) => {
      if (!validStatusIds.includes(transition.from)) {
        errors.push(`Transition ${index + 1}: Invalid 'from' status: ${transition.from}`);
      }
      if (!validStatusIds.includes(transition.to)) {
        errors.push(`Transition ${index + 1}: Invalid 'to' status: ${transition.to}`);
      }
      if (transition.from === transition.to) {
        warnings.push(`Transition ${index + 1}: Self-transition from ${transition.from} to ${transition.to}`);
      }
    });
  }
  
  // Check for unreachable statuses
  if (workflow.statuses && workflow.transitions) {
    const reachableStatuses = new Set<string>();
    const startStatus = workflow.statuses[0]?.id;
    
    if (startStatus) {
      reachableStatuses.add(startStatus);
      
      // Find all reachable statuses
      let changed = true;
      while (changed) {
        changed = false;
        workflow.transitions.forEach((t: any) => {
          if (reachableStatuses.has(t.from) && !reachableStatuses.has(t.to)) {
            reachableStatuses.add(t.to);
            changed = true;
          }
        });
      }
      
      // Check for unreachable statuses
      workflow.statuses.forEach((status: any) => {
        if (!reachableStatuses.has(status.id) && status.id !== startStatus) {
          warnings.push(`Status '${status.name}' (${status.id}) is unreachable`);
        }
      });
    }
  }
  
  // Check for terminal statuses (no outgoing transitions)
  if (workflow.statuses && workflow.transitions) {
    const statusesWithOutgoing = new Set(workflow.transitions.map((t: any) => t.from));
    workflow.statuses.forEach((status: any) => {
      if (!statusesWithOutgoing.has(status.id)) {
        warnings.push(`Status '${status.name}' (${status.id}) has no outgoing transitions (terminal status)`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateTransition(transition: any, workflow: any): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!transition.name || transition.name.trim() === '') {
    errors.push('Transition must have a name');
  }
  
  if (!transition.from) {
    errors.push('Transition must have a source status');
  }
  
  if (!transition.to) {
    errors.push('Transition must have a target status');
  }
  
  if (transition.from === transition.to) {
    warnings.push('Self-transition detected');
  }
  
  // Check if transition already exists
  if (workflow.transitions) {
    const duplicate = workflow.transitions.find((t: any) => 
      t.from === transition.from && 
      t.to === transition.to && 
      t.id !== transition.id
    );
    if (duplicate) {
      warnings.push(`A transition from ${transition.from} to ${transition.to} already exists`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
