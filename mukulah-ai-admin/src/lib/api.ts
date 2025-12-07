const API_BASE = process.env.NEXT_PUBLIC_TRADING_API_BASE ?? "http://localhost:4000";

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async health() {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return handleRes<{ status: string; message: string }>(res);
  },

  async agentsStatus() {
    const res = await fetch(`${API_BASE}/agents/status`, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  async account(id: string) {
    const res = await fetch(`${API_BASE}/accounts/${id}`, { cache: "no-store" });
    return handleRes<any>(res);
  },

  async accountTradeSignals(id: string, limit = 20) {
    const res = await fetch(
      `${API_BASE}/accounts/${id}/trade-signals?limit=${limit}`,
      { cache: "no-store" }
    );
    return handleRes<any[]>(res);
  },

  async accountAgentSignals(id: string, limit = 50) {
    const res = await fetch(
      `${API_BASE}/accounts/${id}/agent-signals?limit=${limit}`,
      { cache: "no-store" }
    );
    return handleRes<any[]>(res);
  },

  // Get all accounts
  async getAccounts() {
    const res = await fetch(`${API_BASE}/accounts`, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  // Get all trade signals (across all accounts)
  async getTradeSignals(limit = 50) {
    const res = await fetch(`${API_BASE}/trade-signals?limit=${limit}`, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  // Get all pipeline runs (across all accounts)
  async getPipelineRuns(limit = 20) {
    const res = await fetch(`${API_BASE}/pipeline/runs?limit=${limit}`, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  // Pipeline runs (we'll add backend later)
  async pipelineRuns(accountId?: string) {
    const url = accountId
      ? `${API_BASE}/pipeline/runs?accountId=${accountId}`
      : `${API_BASE}/pipeline/runs`;
    const res = await fetch(url, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  async triggerPipelineRun(params: { 
    accountId: string; 
    symbol?: string; 
    timeframe?: string;
    useHttpAgents?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return handleRes<{ runId: string; status: string; mode?: string }>(res);
  },

  // Future endpoints (stubs)
  async updateAgentConfig(name: string, payload: any) {
    console.log("updateAgentConfig stub:", name, payload);
    return { success: true };
  },

  async chatBrain(params: {
    message: string;
    target: string;
    accountId?: string;
    symbol?: string;
    timeframe?: string;
    context?: any;
  }) {
    const res = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: params.message,
        accountId: params.accountId
      })
    });
    return handleRes<{ response: string; timestamp: string }>(res);
  },

  async getBrainStatus() {
    const res = await fetch(`${API_BASE}/api/brain/brain-status`, { cache: "no-store" });
    return handleRes<any>(res);
  },

  async controlBrain(action: "start" | "stop", config?: any) {
    const res = await fetch(`${API_BASE}/api/brain/brain-control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, config })
    });
    return handleRes<any>(res);
  },

  async getBrainDecisions(limit = 20) {
    const res = await fetch(`${API_BASE}/api/brain/brain-decisions?limit=${limit}`, { cache: "no-store" });
    return handleRes<any[]>(res);
  },

  async analyzeMarket(symbol: string, accountId: string) {
    const res = await fetch(`${API_BASE}/api/brain/analyze-market`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, accountId })
    });
    return handleRes<any>(res);
  },

  async chatWithAI(message: string, accountId?: string) {
    const res = await fetch(`${API_BASE}/api/brain/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, accountId })
    });
    return handleRes<{ response: string; timestamp: string }>(res);
  },

  // Professional Trading Performance Tracking
  async getPerformanceMetrics(accountId: string, days = 30) {
    const res = await fetch(
      `${API_BASE}/api/brain/performance/${accountId}?days=${days}`,
      { cache: "no-store" }
    );
    return handleRes<any>(res);
  },

  async getPerformanceInsights(accountId: string) {
    const res = await fetch(
      `${API_BASE}/api/brain/insights/${accountId}`,
      { cache: "no-store" }
    );
    return handleRes<any[]>(res);
  },

  async getTradingJournal(accountId: string, days = 7) {
    const res = await fetch(
      `${API_BASE}/api/brain/journal/${accountId}?days=${days}`,
      { cache: "no-store" }
    );
    return handleRes<any>(res);
  },

  async analyzeLosingTrades(accountId: string, limit = 20) {
    const res = await fetch(
      `${API_BASE}/api/brain/analyze-losses/${accountId}?limit=${limit}`,
      { cache: "no-store" }
    );
    return handleRes<any>(res);
  },

  async activateProfile(profileName: string) {
    console.log("activateProfile stub:", profileName);
    return { success: true, profile: profileName };
  },
};
