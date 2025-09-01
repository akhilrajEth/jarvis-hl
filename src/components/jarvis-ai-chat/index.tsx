"use client";

import React, { useState, useEffect, useRef } from "react";
import { Typography, IconButton, Box, Drawer } from "@mui/material";
import AgentMessage from "@/components/agent-message";
import PromptBar from "@/components/prompt-bar";
import UserMessage from "@/components/user-message";
import { AdvisorApiResponse } from "@/lib/advisor/types";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { AllocationType } from "@/constants";
import { PortfolioState } from "@/types";
import { usePrivy } from "@privy-io/react-auth";
import { updateAdvisorAssessment } from "@/utils/updateAdvisorAssessment";
import { Message } from "@/components/jarvis-ai-chat/types";
import CloseIcon from "@mui/icons-material/Close";

interface JarvisSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function JarvisSidebar({ open, onClose }: JarvisSidebarProps) {
  const { dispatch } = usePortfolio();
  const { user } = usePrivy();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const startConversation = async () => {
        try {
          const response = await fetch("/api/advisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!response.ok) throw new Error(`API Error: ${response.status}`);
          const data: AdvisorApiResponse = await response.json();
          if (!data.isComplete && data.question) {
            setMessages([{ type: "agent", text: data.question }]);
            setSessionId(data.sessionId);
          }
        } catch (error) {
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
    }
  }, [open, messages.length]);

  const handleSendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;
    setMessages((prev) => [...prev, { type: "user", text: trimmedMessage }]);
    setIsLoading(true);
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userResponse: trimmedMessage, sessionId }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
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
      if (user?.wallet?.address) {
        const advisorAssessment = {
          risk_profile: allocation.risk_profile,
          reasoning: allocation.reasoning,
        };
        await updateAdvisorAssessment(user.wallet.address, advisorAssessment);
      }
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
      dispatch({ type: "SET_PORTFOLIO_PERCENTAGES", payload: portfolioState });
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          text: `Here’s the portfolio I designed for you...\nYour portfolio is based on a ${allocation.risk_profile} risk profile. Start adding assets you prefer for each category.`,
        },
        { type: "agent", text: `Reasoning: ${allocation.reasoning}` },
      ]);
    } catch (error) {
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          border: "none",
          fontFamily: "Inter, sans-serif",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        },
      }}
    >
      <div className="flex items-center justify-between bg-white text-[#232326] px-4 py-2 min-h-[56px] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 550, fontSize: 20, letterSpacing: 0.2 }}
        >
          Jarvis
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#232326",
            borderRadius: 2,
            transition: "background 0.2s",
            "&:hover": { background: "#F5F5F5" },
          }}
        >
          <CloseIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto bg-white flex flex-col gap-2 justify-end">
        <div className="px-4 pt-4 pb-2 flex-1 flex flex-col gap-2 min-h-0">
          {messages.map((msg, index) =>
            msg.type === "agent" ? (
              <AgentMessage key={index} message={msg.text} />
            ) : (
              <div key={index} className="flex justify-end">
                <UserMessage message={msg.text} />
              </div>
            )
          )}
          {isLoading && <AgentMessage message="..." />}
          <div ref={conversationEndRef} />
        </div>
      </div>
      <div className="px-4 py-3 bg-white shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
        <PromptBar onSubmit={handleSendMessage} />
      </div>
    </Drawer>
  );
}
