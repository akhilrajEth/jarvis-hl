"use client";

import AgentMessage from "@/components/agent-message";
import PromptBar from "@/components/prompt-bar";
import UserMessage from "@/components/user-message";
import { Typography, IconButton, Box, Paper } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { AdvisorApiResponse } from "@/lib/advisor/types";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { AllocationType } from "@/constants";
import { PortfolioState } from "@/types";
import { usePrivy } from "@privy-io/react-auth";
import { updateAdvisorAssessment } from "@/utils/updateAdvisorAssessment";
import { Message } from "@/components/jarvis-ai-chat/types";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";

export default function JarvisAIChat() {
  const { dispatch } = usePortfolio();
  const { user } = usePrivy();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
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
          { type: "agent", text: "Sorry, I'm having trouble connecting. Please try refreshing the page." },
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
        setMessages((prev) => [...prev, { type: "agent", text: data.question }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "agent", text: "Sorry, an error occurred. Please try sending your message again." },
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
        const advisorAllocation = allocation.allocations.find((a: any) => a.category === category);
        return {
          category,
          allocations: [],
          percentage: advisorAllocation?.percentage || 0,
        };
      });
      dispatch({ type: "SET_PORTFOLIO_PERCENTAGES", payload: portfolioState });
      // Display assessment results and reasoning in chat
      setMessages((prev) => [
        ...prev,
        { type: "agent", text: `Here’s the portfolio I designed for you...\nYour portfolio is based on a ${allocation.risk_profile} risk profile. Start adding assets you prefer for each category.` },
        { type: "agent", text: `Reasoning: ${allocation.reasoning}` }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "agent", text: "Assessment complete, but there was an error saving your profile. Please try again." },
      ]);
    }
  };

  return (
    <React.Fragment>
      {!closed ? (
        <Box sx={{
          position: "fixed",
          top: 0,
          right: 0,
          height: '100vh',
          width: 420,
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          bgcolor: '#fff',
          borderLeft: '1px solid #E0E0E0',
          fontFamily: 'Inter, sans-serif',
        }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: '#fff',
            color: "#232326",
            px: 4,
            py: 2,
            borderBottom: '1px solid #E0E0E0',
            minHeight: 56,
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.2 }}>Jarvis AI Chat</Typography>
            <IconButton size="small" onClick={() => setClosed(true)} sx={{ color: "#232326", borderRadius: 2, transition: 'background 0.2s', '&:hover': { background: '#F5F5F5' } }}>
              <CloseIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
          <Box sx={{
            flex: 1,
            px: 0,
            py: 0,
            overflowY: "auto",
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            justifyContent: 'flex-end',
            height: '100%',
            minHeight: 0,
          }}>
            <Box sx={{ px: 4, pt: 4, pb: 32, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
              {messages.map((msg, index) =>
                msg.type === "agent" ? (
                  <AgentMessage key={index} message={msg.text} />
                ) : (
                  <Box key={index} display="flex" justifyContent="flex-end">
                    <UserMessage message={msg.text} />
                  </Box>
                )
              )}
              {isLoading && <AgentMessage message="..." />}
              <div ref={conversationEndRef} />
            </Box>
          </Box>
          <Box sx={{
            px: 4,
            py: 3,
            borderTop: '1px solid #E0E0E0',
            bgcolor: '#fff',
            boxShadow: '0 -1px 0 rgba(0,0,0,0.04)',
          }}>
            <PromptBar onSubmit={handleSendMessage} />
          </Box>
        </Box>
      ) : (
        <IconButton
          color="primary"
          onClick={() => setClosed(false)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1301,
            boxShadow: 3,
            bgcolor: "#232326",
            color: '#fff',
            borderRadius: 2,
            fontSize: 18,
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: 'auto',
            height: 56,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: 0.2 }}>Jarvis Copilot</span>
          <ChatIcon sx={{ fontSize: 28, ml: 1 }} />
        </IconButton>
      )}
    </React.Fragment>
  );
}
