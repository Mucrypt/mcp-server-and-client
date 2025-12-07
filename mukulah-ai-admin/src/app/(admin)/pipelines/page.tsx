"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineRunTable } from "@/components/pipeline/PipelineRunTable";
import { AgentPipelineGraph } from "@/components/pipeline/AgentPipelineGraph";
import { api } from "@/lib/api";
import { Play, Filter } from "lucide-react";

export default function PipelinesPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const data = await api.getPipelineRuns();
        setRuns(data);
        if (data.length > 0 && !selectedRun) {
          setSelectedRun(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch pipeline runs:", error);
      }
    };

    fetchRuns();
    const interval = setInterval(fetchRuns, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRunPipeline = async () => {
    setLoading(true);
    try {
      const defaultAccountId = process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT_ID || "1";
      const result = await api.triggerPipelineRun({
        accountId: defaultAccountId,
        symbol: "BTCUSDT",
        timeframe: "1h",
      });
      console.log("Pipeline triggered:", result);
      
      // Refresh runs after a delay
      setTimeout(async () => {
        const data = await api.getPipelineRuns();
        setRuns(data);
        if (data.length > 0) {
          setSelectedRun(data[0]);
        }
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to trigger pipeline:", error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "running":
        return <Badge variant="secondary">Running</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline Runs</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and analyze agent pipeline executions
          </p>
        </div>
        <Button onClick={handleRunPipeline} disabled={loading}>
          <Play className="mr-2 h-4 w-4" />
          {loading ? "Running..." : "Run Pipeline Now"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left - Run History */}
        <Card className="border-border bg-card p-4 lg:col-span-1 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Recent Runs
            </h2>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className={`cursor-pointer rounded-lg border p-3 transition-all duration-300 hover:shadow-lg ${
                  selectedRun?.id === run.id
                    ? "border-accent bg-accent/10 shadow-accent/20"
                    : "border-border bg-muted/30 hover:border-accent/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">
                    {run.symbol} {run.timeframe}
                  </p>
                  {getStatusBadge(run.status)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleString()}
                </p>
                {run.final_signal && (
                  <div className="mt-2">
                    <Badge
                      variant={run.final_signal.direction === "buy" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {run.final_signal.direction?.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
            {runs.length === 0 && (
              <p className="text-sm text-muted-foreground">No pipeline runs yet</p>
            )}
          </div>
        </Card>

        {/* Right - Selected Run Details */}
        <div className="space-y-6 lg:col-span-2">
          {selectedRun ? (
            <>
              <Card className="border-border bg-card p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Pipeline Execution Flow
                </h2>
                <AgentPipelineGraph latestRun={selectedRun} />
              </Card>

              <Card className="border-border bg-card p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Agent Results
                </h2>
                <PipelineRunTable pipelineRun={selectedRun} />
              </Card>

              {selectedRun.final_signal && (
                <Card className="border-border bg-card p-6 shadow-xl">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Final Signal
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Direction:</span>
                      <Badge
                        variant={selectedRun.final_signal.direction === "buy" ? "default" : "destructive"}
                      >
                        {selectedRun.final_signal.direction?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className="text-foreground">
                        {(selectedRun.final_signal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {selectedRun.final_signal.leverage && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Leverage:</span>
                        <span className="text-foreground">
                          {selectedRun.final_signal.leverage}x
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-border bg-card p-6 shadow-md">
              <p className="text-muted-foreground">
                Select a pipeline run to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
