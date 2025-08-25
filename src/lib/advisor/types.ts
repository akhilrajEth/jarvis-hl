import { AllocationResult } from "./advisor";

export type AdvisorRequest = {
  userResponse?: string;
  sessionId?: string;
};

export type AdvisorConversationResponse = {
  question: string;
  isComplete: false;
  sessionId: string;
};

export type AdvisorAllocationResponse = {
  allocation: AllocationResult;
  isComplete: true;
  sessionId: string;
};

export type AdvisorApiResponse =
  | AdvisorConversationResponse
  | AdvisorAllocationResponse;
