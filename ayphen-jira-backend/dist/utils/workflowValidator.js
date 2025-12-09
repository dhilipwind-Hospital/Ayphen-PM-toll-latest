"use strict";
// Workflow validation utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflow = validateWorkflow;
exports.validateTransition = validateTransition;
function validateWorkflow(workflow) {
    const errors = [];
    const warnings = [];
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
        const statusIds = workflow.statuses.map((s) => s.id);
        const duplicates = statusIds.filter((id, index) => statusIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate status IDs found: ${duplicates.join(', ')}`);
        }
    }
    // Check if transitions reference valid statuses
    if (workflow.transitions && workflow.statuses) {
        const validStatusIds = workflow.statuses.map((s) => s.id);
        workflow.transitions.forEach((transition, index) => {
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
        const reachableStatuses = new Set();
        const startStatus = workflow.statuses[0]?.id;
        if (startStatus) {
            reachableStatuses.add(startStatus);
            // Find all reachable statuses
            let changed = true;
            while (changed) {
                changed = false;
                workflow.transitions.forEach((t) => {
                    if (reachableStatuses.has(t.from) && !reachableStatuses.has(t.to)) {
                        reachableStatuses.add(t.to);
                        changed = true;
                    }
                });
            }
            // Check for unreachable statuses
            workflow.statuses.forEach((status) => {
                if (!reachableStatuses.has(status.id) && status.id !== startStatus) {
                    warnings.push(`Status '${status.name}' (${status.id}) is unreachable`);
                }
            });
        }
    }
    // Check for terminal statuses (no outgoing transitions)
    if (workflow.statuses && workflow.transitions) {
        const statusesWithOutgoing = new Set(workflow.transitions.map((t) => t.from));
        workflow.statuses.forEach((status) => {
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
function validateTransition(transition, workflow) {
    const errors = [];
    const warnings = [];
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
        const duplicate = workflow.transitions.find((t) => t.from === transition.from &&
            t.to === transition.to &&
            t.id !== transition.id);
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
