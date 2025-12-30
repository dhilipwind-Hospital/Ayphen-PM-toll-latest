import { faker } from '@faker-js/faker';

/**
 * Test Data Generators using Faker.js
 */

/**
 * Generate a random test user
 */
export const createTestUser = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12, memorable: false }),
});

/**
 * Generate a random project
 */
export const createTestProject = () => {
  const name = faker.company.name() + ' Project';
  const key = faker.string.alpha({ length: 3, casing: 'upper' }) + faker.string.numeric(1);
  return {
    name,
    key,
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['scrum', 'kanban'] as const),
  };
};

/**
 * Generate a random epic
 */
export const createTestEpic = () => ({
  type: 'Epic' as const,
  summary: `Epic: ${faker.lorem.sentence({ min: 3, max: 8 })}`,
  description: faker.lorem.paragraphs(2),
  color: faker.helpers.arrayElement(['#0052CC', '#00A3BF', '#006644', '#FF5630', '#6554C0']),
});

/**
 * Generate a random story
 */
export const createTestStory = () => ({
  type: 'Story' as const,
  summary: `As a user, ${faker.lorem.sentence({ min: 5, max: 10 })}`,
  description: faker.lorem.paragraphs(2),
  storyPoints: faker.helpers.arrayElement([1, 2, 3, 5, 8, 13]),
  priority: faker.helpers.arrayElement(['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const),
});

/**
 * Generate a random task
 */
export const createTestTask = () => ({
  type: 'Task' as const,
  summary: faker.lorem.sentence({ min: 4, max: 8 }),
  description: faker.lorem.paragraph(),
  priority: faker.helpers.arrayElement(['High', 'Medium', 'Low'] as const),
});

/**
 * Generate a random bug
 */
export const createTestBug = () => ({
  type: 'Bug' as const,
  summary: `Bug: ${faker.lorem.sentence({ min: 4, max: 8 })}`,
  description: `
## Steps to Reproduce
1. ${faker.lorem.sentence()}
2. ${faker.lorem.sentence()}
3. ${faker.lorem.sentence()}

## Expected Behavior
${faker.lorem.paragraph()}

## Actual Behavior
${faker.lorem.paragraph()}
  `.trim(),
  priority: faker.helpers.arrayElement(['Highest', 'High', 'Medium'] as const),
});

/**
 * Generate a random subtask
 */
export const createTestSubtask = () => ({
  type: 'Subtask' as const,
  summary: faker.lorem.sentence({ min: 3, max: 6 }),
  description: faker.lorem.paragraph(),
});

/**
 * Generate a random sprint
 */
export const createTestSprint = (projectKey: string, number: number = 1) => ({
  name: `${projectKey} Sprint ${number}`,
  goal: faker.lorem.sentence(),
  duration: faker.helpers.arrayElement([7, 14, 21, 28]),
});

/**
 * Generate a random comment
 */
export const createTestComment = () => ({
  body: faker.lorem.paragraph(),
});

/**
 * Generate test credentials for login
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    name: 'Test Admin',
  },
  user1: {
    email: 'user1@test.com',
    password: 'UserPassword123!',
    name: 'Test User 1',
  },
  user2: {
    email: 'user2@test.com',
    password: 'UserPassword123!',
    name: 'Test User 2',
  },
};

/**
 * Generate unique identifier for test data
 */
export const uniqueId = () => faker.string.alphanumeric(8);

/**
 * Generate timestamp string
 */
export const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');
