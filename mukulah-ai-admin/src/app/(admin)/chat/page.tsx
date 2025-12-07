"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { Send, Brain, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  target?: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string>("brain");
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch latest context data
    const fetchContext = async () => {
      try {
        const [runs, signals] = await Promise.all([
          api.getPipelineRuns(),
          api.getTradeSignals(),
        ]);

        setContextData({
          latestRun: runs[0],
          latestSignal: signals[0],
          recentSignals: signals.slice(0, 3),
        });
      } catch (error) {
        console.error("Failed to fetch context:", error);
      }
    };

    fetchContext();
    const interval = setInterval(fetchContext, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      target,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.chatBrain({
        message: input,
        target,
        context: contextData,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Chat Panel */}
      <Card className="flex flex-1 flex-col border-border bg-card shadow-xl">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Trading Brain Chat
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground"
              >
                <option value="brain">Brain (All Agents)</option>
                <option value="market-structure">Market Structure</option>
                <option value="order-flow">Order Flow</option>
                <option value="momentum">Momentum</option>
                <option value="risk-manager">Risk Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-12">
                <div className="text-center">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Start a conversation with the trading brain
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Ask about market conditions, agent insights, or strategy recommendations
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Bot className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                      : "bg-muted/50 border border-border text-foreground"
                  }`}
                >
                  {message.target && message.role === "user" && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      To: {message.target}
                    </Badge>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
                    <span className="text-sm font-medium text-sky-400">You</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <Bot className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask the trading brain..."
              className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Context Sidebar */}
      <Card className="w-80 border-border bg-card p-4 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Current Context
        </h3>

        <div className="space-y-4">
          {contextData?.latestRun && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Latest Pipeline Run</p>
              <p className="mt-1 font-medium text-foreground">
                {contextData.latestRun.symbol} {contextData.latestRun.timeframe}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(contextData.latestRun.created_at).toLocaleString()}
              </p>
              {contextData.latestRun.final_signal && (
                <Badge
                  variant={contextData.latestRun.final_signal.direction === "buy" ? "default" : "destructive"}
                  className="mt-2 text-xs"
                >
                  {contextData.latestRun.final_signal.direction?.toUpperCase()}
                </Badge>
              )}
            </div>
          )}

          {contextData?.latestSignal && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Latest Signal</p>
              <p className="mt-1 font-medium text-foreground">
                {contextData.latestSignal.symbol}
              </p>
              <p className="text-xs text-muted-foreground">
                Confidence: {(contextData.latestSignal.confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}

          {contextData?.recentSignals && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Recent Signals</p>
              <div className="space-y-2">
                {contextData.recentSignals.map((signal: any) => (
                  <div key={signal.id} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{signal.symbol}</span>
                    <Badge
                      variant={signal.direction === "buy" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {signal.direction?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
