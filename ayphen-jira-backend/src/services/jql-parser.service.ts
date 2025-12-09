export class JQLParserService {
  /**
   * Parse JQL query string into structured query object
   * Supports: =, !=, >, <, >=, <=, IN, NOT IN, IS, IS NOT, WAS, CHANGED, ~, !~
   * Logical: AND, OR, NOT
   * ORDER BY with ASC/DESC
   */
  public parseJQL(jql: string): any {
    const tokens = this.tokenize(jql);
    return this.buildQuery(tokens);
  }

  private tokenize(jql: string): string[] {
    // Tokenize JQL string
    const regex = /([()]|AND|OR|NOT|ORDER BY|ASC|DESC|IN|NOT IN|IS NOT|IS|WAS|CHANGED|>=|<=|!=|=|>|<|~|!~|"[^"]*"|\S+)/gi;
    return jql.match(regex) || [];
  }

  private buildQuery(tokens: string[]): any {
    const query: any = {
      where: [],
      orderBy: [],
    };

    let i = 0;
    let currentCondition: any = null;
    let logicalOperator = 'AND';

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.toUpperCase() === 'ORDER') {
        i += 2; // Skip 'ORDER BY'
        while (i < tokens.length) {
          const field = tokens[i];
          const direction = tokens[i + 1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
          query.orderBy.push({ field, direction });
          i += tokens[i + 1]?.toUpperCase() === 'DESC' || tokens[i + 1]?.toUpperCase() === 'ASC' ? 2 : 1;
          if (tokens[i] === ',') i++;
        }
        break;
      }

      if (token.toUpperCase() === 'AND' || token.toUpperCase() === 'OR') {
        logicalOperator = token.toUpperCase();
        i++;
        continue;
      }

      if (token === '(') {
        // Handle parentheses
        let depth = 1;
        let subTokens = [];
        i++;
        while (i < tokens.length && depth > 0) {
          if (tokens[i] === '(') depth++;
          if (tokens[i] === ')') depth--;
          if (depth > 0) subTokens.push(tokens[i]);
          i++;
        }
        const subQuery = this.buildQuery(subTokens);
        query.where.push({ operator: logicalOperator, condition: subQuery });
        continue;
      }

      // Parse field operator value
      const field = token;
      const operator = tokens[i + 1];
      let value = tokens[i + 2];

      if (operator && value) {
        // Handle IN operator
        if (operator.toUpperCase() === 'IN' || operator.toUpperCase().includes('NOT IN')) {
          const values = [];
          i += 2;
          if (tokens[i] === '(') {
            i++;
            while (tokens[i] !== ')') {
              if (tokens[i] !== ',') {
                values.push(this.parseValue(tokens[i]));
              }
              i++;
            }
            i++; // Skip closing parenthesis
          }
          currentCondition = {
            field,
            operator: operator.toUpperCase(),
            value: values,
            logical: logicalOperator,
          };
        } else {
          currentCondition = {
            field,
            operator: operator.toUpperCase(),
            value: this.parseValue(value),
            logical: logicalOperator,
          };
          i += 3;
        }

        query.where.push(currentCondition);
      } else {
        i++;
      }
    }

    return query;
  }

  private parseValue(value: string): any {
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Parse numbers
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Parse functions
    if (value.includes('(')) {
      return this.parseFunction(value);
    }

    // Parse relative dates
    if (value.match(/^-?\d+[dwmy]$/)) {
      return this.parseRelativeDate(value);
    }

    return value;
  }

  private parseFunction(func: string): any {
    const match = func.match(/(\w+)\((.*)\)/);
    if (!match) return func;

    const [, name, args] = match;
    return {
      function: name,
      args: args ? args.split(',').map(a => a.trim()) : [],
    };
  }

  private parseRelativeDate(relative: string): Date {
    const match = relative.match(/^(-?\d+)([dwmy])$/);
    if (!match) return new Date();

    const [, amount, unit] = match;
    const num = parseInt(amount);
    const date = new Date();

    switch (unit) {
      case 'd':
        date.setDate(date.getDate() + num);
        break;
      case 'w':
        date.setDate(date.getDate() + num * 7);
        break;
      case 'm':
        date.setMonth(date.getMonth() + num);
        break;
      case 'y':
        date.setFullYear(date.getFullYear() + num);
        break;
    }

    return date;
  }

  /**
   * Validate JQL syntax
   */
  public validateJQL(jql: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const tokens = this.tokenize(jql);
      
      // Check for balanced parentheses
      let depth = 0;
      for (const token of tokens) {
        if (token === '(') depth++;
        if (token === ')') depth--;
        if (depth < 0) {
          errors.push('Unbalanced parentheses');
          break;
        }
      }
      if (depth !== 0) {
        errors.push('Unbalanced parentheses');
      }

      // Check for valid operators
      const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'IS', 'IS NOT', 'WAS', 'CHANGED', '~', '!~'];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].toUpperCase();
        if (i % 3 === 1 && !validOperators.includes(token) && token !== 'AND' && token !== 'OR' && token !== 'NOT') {
          // Operator position
          if (!token.includes('ORDER') && token !== '(' && token !== ')') {
            errors.push(`Invalid operator: ${tokens[i]}`);
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { valid: false, errors: ['Syntax error in JQL query'] };
    }
  }

  /**
   * Get autocomplete suggestions for JQL
   */
  public getAutocompleteSuggestions(jql: string, cursorPosition: number): string[] {
    const beforeCursor = jql.substring(0, cursorPosition);
    const lastToken = beforeCursor.split(/\s+/).pop() || '';

    const fields = [
      'project', 'type', 'status', 'priority', 'assignee', 'reporter',
      'created', 'updated', 'resolved', 'due', 'summary', 'description',
      'labels', 'component', 'fixVersion', 'sprint', 'storyPoints',
      'key', 'parent', 'epic', 'watchers', 'attachments',
    ];

    const operators = [
      '=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN',
      'IS', 'IS NOT', 'WAS', 'CHANGED', '~', '!~',
    ];

    const functions = [
      'currentUser()', 'membersOf()', 'now()', 'startOfDay()',
      'endOfDay()', 'startOfWeek()', 'endOfWeek()',
      'startOfMonth()', 'endOfMonth()',
    ];

    const keywords = ['AND', 'OR', 'NOT', 'ORDER BY', 'ASC', 'DESC'];

    const allSuggestions = [...fields, ...operators, ...functions, ...keywords];

    return allSuggestions.filter(s =>
      s.toLowerCase().startsWith(lastToken.toLowerCase())
    );
  }
}

export const jqlParserService = new JQLParserService();
