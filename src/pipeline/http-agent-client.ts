/**
 * HTTP Agent Client
 * 
 * Client for calling agent microservices via HTTP
 */

import { PipelineContext } from "../core/agentBase.js";
import { AgentResult } from "../pipeline/pipeline_orchestrator.js";

export type AgentServiceConfig = {
  name: string;
  url: string;
  timeout?: number;
};

export class HttpAgentClient {
  private config: AgentServiceConfig;

  constructor(config: AgentServiceConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config
    };
  }

  /**
   * Call agent service and get result
   */
  async run(context: PipelineContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Agent ${this.config.name} returned ${response.status}: ${error.error ?? error.details}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      console.log(`✅ HTTP Agent ${this.config.name} responded in ${duration}ms`);

      return {
        score: result.score ?? 0,
        confidence: result.confidence ?? 0,
        payload: result.payload ?? {}
      };

    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      if (err.name === 'AbortError') {
        console.error(`❌ HTTP Agent ${this.config.name} timed out after ${duration}ms`);
        throw new Error(`Agent ${this.config.name} timed out`);
      }

      console.error(`❌ HTTP Agent ${this.config.name} failed after ${duration}ms:`, err.message);
      throw err;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Get default agent service configurations
 */
export function getDefaultAgentServices(): Record<string, AgentServiceConfig> {
  const baseUrl = process.env.AGENT_SERVICES_BASE_URL ?? 'http://localhost';

  return {
    'market-structure': {
      name: 'market-structure',
      url: `${baseUrl}:5001`,
    },
    'order-flow': {
      name: 'order-flow',
      url: `${baseUrl}:5002`,
    },
    'momentum': {
      name: 'momentum',
      url: `${baseUrl}:5003`,
    },
    'volatility-regime': {
      name: 'volatility-regime',
      url: `${baseUrl}:5004`,
    },
    'news-sentiment': {
      name: 'news-sentiment',
      url: `${baseUrl}:5005`,
    },
    'multi-timeframe': {
      name: 'multi-timeframe',
      url: `${baseUrl}:5006`,
    },
    'pattern-recognition': {
      name: 'pattern-recognition',
      url: `${baseUrl}:5007`,
    },
    'statistical-edge': {
      name: 'statistical-edge',
      url: `${baseUrl}:5008`,
    },
    'risk-manager': {
      name: 'risk-manager',
      url: `${baseUrl}:5009`,
    },
  };
}
