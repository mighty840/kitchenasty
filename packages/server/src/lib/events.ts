import { EventEmitter } from 'events';
import prisma from './db.js';
import { executeAction } from './actions.js';
import { automationLogger } from './logger.js';

export const appEvents = new EventEmitter();

// When an event fires, load matching automation rules and execute actions
appEvents.on('order.created', (data) => processRules('order.created', data));
appEvents.on('order.statusChanged', (data) => processRules('order.statusChanged', data));
appEvents.on('reservation.created', (data) => processRules('reservation.created', data));
appEvents.on('review.submitted', (data) => processRules('review.submitted', data));

async function processRules(event: string, data: Record<string, unknown>) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { event, isActive: true },
    });

    for (const rule of rules) {
      if (matchesConditions(rule.conditions as Record<string, unknown> | null, data)) {
        const actions = rule.actions as Array<{ type: string; [key: string]: unknown }>;
        for (const action of actions) {
          executeAction(action, data).catch((err) => {
            automationLogger.error({ err, rule: rule.name }, 'Automation rule action failed');
          });
        }
      }
    }
  } catch (err) {
    automationLogger.error({ err, event }, 'Error processing automation rules');
  }
}

function matchesConditions(
  conditions: Record<string, unknown> | null,
  data: Record<string, unknown>
): boolean {
  if (!conditions) return true;

  for (const [key, value] of Object.entries(conditions)) {
    // Support nested keys like "order.status"
    const actual = getNestedValue(data, key);
    if (actual !== value) return false;
  }

  return true;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
