"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentTuningForm } from "@/components/agents/AgentTuningForm";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [microservices, setMicroservices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agentsData = await api.agentsStatus();
        setAgents(agentsData);

        // Check microservices health if HTTP agents enabled
        if (process.env.NEXT_PUBLIC_USE_HTTP_AGENTS === "true") {
          const services = [
            { name: "Market Structure", port: 5001 },
            { name: "Order Flow", port: 5002 },
            { name: "Momentum", port: 5003 },
            { name: "Volatility Regime", port: 5004 },
            { name: "News Sentiment", port: 5005 },
            { name: "Multi-Timeframe", port: 5006 },
            { name: "Pattern Recognition", port: 5007 },
            { name: "Statistical Edge", port: 5008 },
            { name: "Risk Manager", port: 5009 },
          ];

          const healthChecks = await Promise.all(
            services.map(async (service) => {
              try {
                const start = Date.now();
                const res = await fetch(`http://localhost:${service.port}/health`);
                const data = await res.json();
                return {
                  ...service,
                  status: data.status,
                  latency: Date.now() - start,
                };
              } catch {
                return {
                  ...service,
                  status: "down",
                  latency: -1,
                };
              }
            })
          );

          setMicroservices(healthChecks);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  const agentsByGroup = agents.reduce((acc: any, agent: any) => {
    const group = agent.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(agent);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Agent Management</h1>
        <p className="mt-2 text-slate-400">
          Configure and monitor your AI trading agents
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tuning">Tuning</TabsTrigger>
          <TabsTrigger value="microservices">Microservices Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <p className="text-slate-400">Loading agents...</p>
          ) : (
            Object.entries(agentsByGroup).map(([group, groupAgents]: [string, any]) => (
              <div key={group}>
                <h2 className="mb-4 text-xl font-semibold text-slate-200">
                  {group}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupAgents.map((agent: any) => (
                    <AgentCard key={agent.name} agent={agent} />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="tuning" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-200">
              Agent Configuration
            </h2>
            <AgentTuningForm agents={agents} />
          </Card>
        </TabsContent>

        <TabsContent value="microservices" className="space-y-6">
          {process.env.NEXT_PUBLIC_USE_HTTP_AGENTS === "true" ? (
            <Card className="border-slate-800 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-200">
                Microservices Status
              </h2>
              <div className="space-y-3">
                {microservices.map((service) => (
                  <div
                    key={service.port}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      {service.status === "ok" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : service.status === "down" ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-200">
                          {service.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          http://localhost:{service.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.latency > 0 && (
                        <span className="text-sm text-slate-400">
                          {service.latency}ms
                        </span>
                      )}
                      <Badge
                        variant={service.status === "ok" ? "default" : "destructive"}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900/50 p-6">
              <p className="text-slate-400">
                Microservices mode is not enabled. Set NEXT_PUBLIC_USE_HTTP_AGENTS=true
                to enable microservices.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
