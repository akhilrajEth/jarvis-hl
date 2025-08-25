// Note: Run this script with "npx ts-node --project tsconfig.scripts.json scripts/advisor.ts"

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

const AllocationSchema = z.object({
  allocations: z.array(AllocationItemSchema),
  risk_profile: z.enum(["conservative", "moderate", "aggressive"]),
  reasoning: z.string(),
});

const ConversationStateSchema = z.object({
  question: z.string(),
  is_complete: z.boolean(),
  questions_asked: z.number(),
});

type AllocationResult = z.infer<typeof AllocationSchema>;
type ConversationState = z.infer<typeof ConversationStateSchema>;

class FinancialAdvisor {
  private messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  private questionsAsked = 0;
  private readonly maxQuestions = 5;

  constructor() {
    this.messages.push({
      role: "system",
      content: `You are an expert onchain financial advisor. Your goal is to assess a user's risk profile and provide a portfolio allocation.

RULES:
1. Ask a maximum of 5 strategic questions to understand their risk profile
2. Questions should cover: investment experience, risk tolerance, time horizon, financial goals, and current crypto knowledge
3. After 5 questions (or when you have enough info), provide the final allocation
4. Always respond with the structured format specified

Categories explained:
- spot: Direct cryptocurrency holdings
- vault: Hyperliquid yield vault
- lp: Liquidity provision in DEXs
- lending: DeFi lending protocols

Risk profiles:
- conservative: Lower risk, stable returns (more lending/vault)
- moderate: Balanced approach
- aggressive: Higher risk, higher potential returns (more spot/lp)`,
    });
  }

  async askNextQuestion(userResponse?: string): Promise<ConversationState> {
    if (userResponse) {
      this.messages.push({
        role: "user",
        content: userResponse,
      });
    }

    if (this.questionsAsked >= this.maxQuestions) {
      return {
        question: "Ready for allocation",
        is_complete: true,
        questions_asked: this.questionsAsked,
      };
    }

    this.messages.push({
      role: "system",
      content: `Ask question ${this.questionsAsked + 1} of ${
        this.maxQuestions
      } to assess the user's risk profile. Keep it focused and relevant for DeFi portfolio allocation.`,
    });

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: this.messages,
      response_format: zodResponseFormat(
        ConversationStateSchema,
        "conversation_state"
      ),
    });

    if (completion.choices[0].message.refusal) {
      throw new Error(
        `AI refused to respond: ${completion.choices[0].message.refusal}`
      );
    }

    const state = completion.choices[0].message.parsed as ConversationState;

    this.questionsAsked = state.questions_asked;

    this.messages.push({
      role: "assistant",
      content: state.question,
    });

    return state;
  }

  async getFinalAllocation(userResponse: string): Promise<AllocationResult> {
    this.messages.push({
      role: "user",
      content: userResponse,
    });

    this.messages.push({
      role: "system",
      content: `Based on all the information gathered, provide the final portfolio allocation. Ensure percentages add up to 100%.`,
    });

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: this.messages,
      response_format: zodResponseFormat(AllocationSchema, "allocation"),
    });

    if (completion.choices[0].message.refusal) {
      throw new Error(
        `AI refused to respond: ${completion.choices[0].message.refusal}`
      );
    }

    return completion.choices[0].message.parsed as AllocationResult;
  }

  isComplete(): boolean {
    return this.questionsAsked >= this.maxQuestions;
  }
}

async function runFinancialAdvisor() {
  const advisor = new FinancialAdvisor();

  try {
    let state = await advisor.askNextQuestion();

    // Note: This is just for testing
    const userResponses = [
      "I'm new to crypto but have been investing in stocks for 3 years",
      "I'm comfortable with moderate risk, similar to growth stocks",
      "I'm looking at a 2-3 year investment horizon",
      "My goal is to earn better yields than traditional finance",
      "I understand basic DeFi concepts like staking and liquidity pools",
    ];

    let responseIndex = 0;

    while (!state.is_complete && responseIndex < userResponses.length) {
      if (state.question) {
        console.log(
          `❓ Question ${state.questions_asked + 1}: ${state.question}`
        );
        console.log(`💬 User: ${userResponses[responseIndex]}\n`);

        state = await advisor.askNextQuestion(userResponses[responseIndex]);
        responseIndex++;
      }
    }

    console.log("📊 Generating your personalized allocation...\n");

    const allocation = await advisor.getFinalAllocation(
      "Please provide my final portfolio allocation based on our discussion."
    );

    console.log("🎯 Your Recommended DeFi Portfolio:");
    console.log("=====================================");
    console.log(`Risk Profile: ${allocation.risk_profile.toUpperCase()}`);
    console.log(`\nAllocation:`);

    allocation.allocations.forEach((item) => {
      console.log(`  ${item.category.toUpperCase()}: ${item.percentage}%`);
    });

    console.log(`\nReasoning: ${allocation.reasoning}`);
    console.log("\n📋 JSON Output:");
    console.log(JSON.stringify(allocation.allocations, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

export class FinancialAdvisorAPI {
  private advisor: FinancialAdvisor;

  constructor() {
    this.advisor = new FinancialAdvisor();
  }

  async getNextQuestion(userResponse?: string): Promise<{
    question?: string;
    isComplete: boolean;
    questionsRemaining: number;
  }> {
    const state = await this.advisor.askNextQuestion(userResponse);

    return {
      question: state.is_complete ? undefined : state.question,
      isComplete: state.is_complete,
      questionsRemaining: Math.max(0, 5 - state.questions_asked),
    };
  }

  async getAllocation(
    finalResponse: string
  ): Promise<AllocationResult["allocations"]> {
    const allocation = await this.advisor.getFinalAllocation(finalResponse);
    return allocation.allocations;
  }
}

if (require.main === module) {
  runFinancialAdvisor().catch(console.error);
}
