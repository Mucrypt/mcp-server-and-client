/**
 * Agent Service Base
 * 
 * Base class for creating HTTP-based agent microservices.
 * Each agent runs as a separate Express server.
 */

import express from "express";
import cors from "cors";
import { PipelineContext } from "../core/agentBase.js";

export type AgentServiceResult = {
  score: number;
  confidence: number;
  payload?: any;
};

export abstract class AgentServiceBase {
  protected app: express.Application;
  protected port: number;
  protected agentName: string;

  constructor(agentName: string, port: number) {
    this.agentName = agentName;
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
  }

  private setupRoutes() {
    // Health check
    this.app.get("/health", (_req, res) => {
      res.json({ 
        status: "ok", 
        agent: this.agentName,
        timestamp: new Date().toISOString()
      });
    });

    // Main agent run endpoint
    this.app.post("/run", async (req, res) => {
      const startTime = Date.now();
      
      try {
        const context: PipelineContext = req.body;
        
        if (!context || !context.symbol || !context.accountId) {
          return res.status(400).json({ 
            error: "Invalid context", 
            details: "Missing required fields: symbol, accountId" 
          });
        }

        console.log(`[${this.agentName}] Processing request for ${context.symbol}`);

        const result = await this.processContext(context);
        const duration = Date.now() - startTime;

        console.log(`[${this.agentName}] Completed in ${duration}ms - Score: ${result.score.toFixed(3)}, Confidence: ${result.confidence.toFixed(1)}%`);

        res.json({
          ...result,
          meta: {
            agent: this.agentName,
            duration_ms: duration,
            timestamp: new Date().toISOString()
          }
        });

      } catch (err: any) {
        const duration = Date.now() - startTime;
        console.error(`[${this.agentName}] Error after ${duration}ms:`, err);

        res.status(500).json({
          error: "Agent processing failed",
          details: err?.message ?? String(err),
          agent: this.agentName,
          duration_ms: duration
        });
      }
    });

    // Agent info
    this.app.get("/info", (_req, res) => {
      res.json({
        name: this.agentName,
        version: "1.0.0",
        endpoints: {
          health: "GET /health",
          run: "POST /run",
          info: "GET /info"
        }
      });
    });
  }

  /**
   * Override this in each agent service to implement logic
   */
  protected abstract processContext(context: PipelineContext): Promise<AgentServiceResult>;

  /**
   * Start the service
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🚀 ${this.agentName} service running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}
