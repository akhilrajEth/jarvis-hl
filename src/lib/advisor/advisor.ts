// lib/advisor.ts

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AllocationItemSchema = z.object({
  category: z.enum(["spot", "vault", "lp", "lending"]),
  percentage: z.number().min(0).max(100),
});

export const AllocationSchema = z.object({
  allocations: z.array(AllocationItemSchema),
  risk_profile: z.enum(["conservative", "moderate", "aggressive"]),
  reasoning: z.string(),
});

export const ConversationStateSchema = z.object({
  question: z.string(),
  is_complete: z.boolean(),
  questions_asked: z.number(),
});

export type AllocationResult = z.infer<typeof AllocationSchema>;
export type ConversationState = z.infer<typeof ConversationStateSchema>;

export class FinancialAdvisor {
  private messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  private questionsAsked = 0;
  private readonly maxQuestions = 5;

  constructor(
    initialMessages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    questionsAsked?: number
  ) {
    if (initialMessages && questionsAsked !== undefined) {
      this.messages = initialMessages;
      this.questionsAsked = questionsAsked;
    } else {
      this.initializeSystemPrompt();
    }
  }

  private initializeSystemPrompt() {
    const systemMessage: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam =
      {
        role: "system",
        content: `You are an expert onchain financial advisor. Your goal is to assess a user's risk profile and provide a portfolio allocation.

RULES:
1. Ask a maximum of 5 strategic questions to understand their risk profile.
2. Questions should cover: investment experience, risk tolerance, time horizon, financial goals, and current crypto knowledge.
3. After 5 questions (or when you have enough info), provide the final allocation.
4. Always respond with the structured format specified.

Categories explained:
- spot: Direct cryptocurrency holdings
- vault: Hyperliquid yield vault
- lp: Liquidity provision in DEXs
- lending: DeFi lending protocols

Risk profiles:
- conservative: Lower risk, stable returns (more lending/vault)
- moderate: Balanced approach
- aggressive: Higher risk, higher potential returns (more spot/lp)`,
      };
    this.messages.push(systemMessage);
  }

  getState() {
    return {
      messages: this.messages,
      questionsAsked: this.questionsAsked,
    };
  }

  async askNextQuestion(userResponse?: string): Promise<ConversationState> {
    if (userResponse) {
      this.messages.push({ role: "user", content: userResponse });
    }

    if (this.questionsAsked >= this.maxQuestions) {
      return {
        question: "Ready for allocation",
        is_complete: true,
        questions_asked: this.questionsAsked,
      };
    }

    const tempMessages = [
      ...this.messages,
      {
        role: "system",
        content: `Ask question ${this.questionsAsked + 1} of ${
          this.maxQuestions
        }. Keep it focused and relevant for DeFi portfolio allocation.`,
      } as OpenAI.Chat.Completions.ChatCompletionSystemMessageParam,
    ];

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o",
      messages: tempMessages,
      response_format: zodResponseFormat(
        ConversationStateSchema,
        "conversation_state"
      ),
    });

    if (completion.choices[0].message.refusal)
      throw new Error(completion.choices[0].message.refusal);

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse conversation state from AI response.");
    }

    const state = parsed as ConversationState;
    this.questionsAsked = state.questions_asked;

    this.messages.push({
      role: "assistant",
      content: state.question,
    });

    return state;
  }

  async getFinalAllocation(userResponse: string): Promise<AllocationResult> {
    this.messages.push({ role: "user", content: userResponse });

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        ...this.messages,
        {
          role: "system",
          content:
            "Based on all the information gathered, provide the final portfolio allocation. Ensure percentages add up to 100%.",
        },
      ],
      response_format: zodResponseFormat(AllocationSchema, "allocation"),
    });

    if (completion.choices[0].message.refusal)
      throw new Error(completion.choices[0].message.refusal);

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse final allocation from AI response.");
    }

    return parsed as AllocationResult;
  }
}
