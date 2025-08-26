"use client";

import AgentMessage from "@/components/agent-message";
import Navbar from "@/components/navbar";
import PromptBar from "@/components/prompt-bar";
import UserMessage from "@/components/user-message";
import { Typography } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdvisorApiResponse } from "@/lib/advisor/types";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { AllocationType } from "@/constants";
import { PortfolioState } from "@/types";
import { usePrivy } from "@privy-io/react-auth";
import { updateAdvisorAssessment } from "@/utils/updateAdvisorAssessment";
import { Message } from "./types";

export default function RiskProfilePage() {
  const router = useRouter();
  const { dispatch } = usePortfolio();
  const { user } = usePrivy();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Initialize conversation on component mount
  useEffect(() => {
    const startConversation = async () => {
      try {
        const response = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data: AdvisorApiResponse = await response.json();

        if (!data.isComplete && data.question) {
          setMessages([{ type: "agent", text: data.question }]);
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
        setMessages([
          {
            type: "agent",
            text: "Sorry, I'm having trouble connecting. Please try refreshing the page.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
  }, []);

  const handleSendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    // Add user message immediately
    setMessages((prev) => [...prev, { type: "user", text: trimmedMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userResponse: trimmedMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: AdvisorApiResponse = await response.json();

      if (data.isComplete) {
        await handleCompletedAssessment(data.allocation);
      } else if (data.question) {
        setMessages((prev) => [
          ...prev,
          { type: "agent", text: data.question },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          text: "Sorry, an error occurred. Please try sending your message again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletedAssessment = async (allocation: any) => {
    try {
      // Save advisor assessment if user is authenticated
      if (user?.wallet?.address) {
        const advisorAssessment = {
          risk_profile: allocation.risk_profile,
          reasoning: allocation.reasoning,
        };

        await updateAdvisorAssessment(user.wallet.address, advisorAssessment);
      } else {
        console.warn("User not authenticated - cannot save advisor assessment");
      }

      // Update portfolio state
      const portfolioState: PortfolioState = [
        AllocationType.SPOT,
        AllocationType.VAULT,
        AllocationType.LP,
        AllocationType.LENDING,
      ].map((category) => {
        const advisorAllocation = allocation.allocations.find(
          (a: any) => a.category === category
        );
        return {
          category,
          allocations: [],
          percentage: advisorAllocation?.percentage || 0,
        };
      });

      console.log("PORTFOLIO STATE:", portfolioState);

      dispatch({
        type: "SET_PORTFOLIO_PERCENTAGES",
        payload: portfolioState,
      });

      router.push("/allocation");
    } catch (error) {
      console.error("Failed to handle completed assessment:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          text: "Assessment complete, but there was an error saving your profile. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="w-full">
          <div className="flex flex-col gap-1 mb-8">
            <Typography variant="h6" fontWeight={550}>
              Let's first understand your goals and risk profile...
            </Typography>
            <Typography variant="body1">
              Feel free to ask me follow up questions -- here to help!
            </Typography>
          </div>

          <div className="space-y-6">
            {messages.map((msg, index) => {
              if (msg.type === "agent") {
                return <AgentMessage key={index} message={msg.text} />;
              } else {
                return (
                  <div key={index} className="flex justify-end">
                    <UserMessage message={msg.text} />
                  </div>
                );
              }
            })}
            {isLoading && <AgentMessage message="..." />}
            <div ref={conversationEndRef} />
          </div>
        </div>
      </main>

      <div className="flex-shrink-0 p-8 pt-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
          <PromptBar onSubmit={handleSendMessage} />
          <button
            className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 font-semibold"
            onClick={() => router.push("/allocation")}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
