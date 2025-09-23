import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { CloudflareStore } from '@mastra/cloudflare';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

import { mapAgent } from './agents/map-agent';
import { weatherAgent } from './agents/weather-agent';
import { weatherWorkflow } from './workflows/weather-workflow';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, mapAgent },
  storage: new CloudflareStore({
    // Use REST API in Workers; bind via secrets on Cloudflare Dashboard
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    namespacePrefix: 'lesson2_',
    keyPrefix: 'prod_',
  }),
  deployer: new CloudflareDeployer({
    projectName: 'lesson2',
    env: { NODE_ENV: 'production' },
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
