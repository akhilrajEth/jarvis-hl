import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { FinancialAdvisor } from "@/lib/advisor/advisor";
import type OpenAI from "openai";
import { AdvisorApiResponse, AdvisorRequest } from "@/lib/advisor/types";

type AdvisorState = {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  questionsAsked: number;
};

const advisorSessions = new Map<string, AdvisorState>();

export async function POST(request: Request) {
  try {
    const body: AdvisorRequest = await request.json();
    let { sessionId, userResponse } = body;

    let advisor: FinancialAdvisor;

    if (sessionId && advisorSessions.has(sessionId)) {
      const state = advisorSessions.get(sessionId)!;
      advisor = new FinancialAdvisor(state.messages, state.questionsAsked);
    } else {
      sessionId = uuidv4();
      advisor = new FinancialAdvisor();
    }

    const currentState = await advisor.askNextQuestion(userResponse);

    let response: AdvisorApiResponse;

    if (currentState.is_complete) {
      // Conversation is done, get the final allocation
      const finalAllocation = await advisor.getFinalAllocation(
        userResponse ||
          "Based on our discussion, please provide my final portfolio allocation."
      );

      // Clean up the completed session
      advisorSessions.delete(sessionId);

      response = {
        allocation: finalAllocation,
        isComplete: true,
        sessionId,
      };
    } else {
      // Conversation is ongoing
      advisorSessions.set(sessionId, advisor.getState());

      response = {
        question: currentState.question,
        isComplete: false,
        sessionId,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/advisor:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
