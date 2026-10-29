/**
 * Template Registry
 * Central export of all available project architectural templates.
 */

import { TemplateDefinition } from './types.js';
import { mvcTemplate } from './mvc.js';
import { modularTemplate } from './modular.js';
import { streamingTemplate } from './streaming.js';
import { websocketTemplate } from './websocket.js';
import { openapiTemplate } from './openapi.js';
import { fullstackTemplate } from './fullstack.js';
import { minimalTemplate } from './minimal.js';

export * from './types.js';

export const TEMPLATES: Record<string, TemplateDefinition> = {
  mvc: mvcTemplate,
  modular: modularTemplate,
  streaming: streamingTemplate,
  websocket: websocketTemplate,
  openapi: openapiTemplate,
  fullstack: fullstackTemplate,
  minimal: minimalTemplate,
};

export const TEMPLATE_LIST: TemplateDefinition[] = Object.values(TEMPLATES);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES[id.toLowerCase()];
}
