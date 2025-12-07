"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface PipelineRunTableProps {
  pipelineRun: {
    agent_results?: Array<{
      agent_name: string;
      score?: number;
      confidence?: number;
      duration_ms?: number;
      status?: string;
      signal?: {
        direction?: string;
        confidence?: number;
      };
    }>;
  };
}

export function PipelineRunTable({ pipelineRun }: PipelineRunTableProps) {
  const results = pipelineRun.agent_results || [];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  if (results.length === 0) {
    return (
      <p className="text-sm text-slate-500">No agent results available</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
            <th className="pb-3 font-medium">Agent</th>
            <th className="pb-3 font-medium">Signal</th>
            <th className="pb-3 font-medium">Score</th>
            <th className="pb-3 font-medium">Confidence</th>
            <th className="pb-3 font-medium">Duration</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr
              key={`${result.agent_name}-${index}`}
              className="border-b border-slate-800/50 text-sm transition-colors hover:bg-slate-950/50"
            >
              <td className="py-3 font-medium text-slate-200">
                {result.agent_name}
              </td>
              <td className="py-3">
                {result.signal?.direction ? (
                  <Badge
                    variant={result.signal.direction === "buy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {result.signal.direction.toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
              <td className="py-3 text-slate-300">
                {result.score !== undefined ? result.score.toFixed(2) : "-"}
              </td>
              <td className="py-3 text-slate-300">
                {result.confidence !== undefined
                  ? `${(result.confidence * 100).toFixed(0)}%`
                  : result.signal?.confidence !== undefined
                  ? `${(result.signal.confidence * 100).toFixed(0)}%`
                  : "-"}
              </td>
              <td className="py-3 text-slate-400">
                {result.duration_ms ? `${result.duration_ms}ms` : "-"}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
