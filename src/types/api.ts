// API response types and interfaces

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  walletAddress?: string;
}

export interface UpdateUserRequest {
  name?: string;
  walletAddress?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationResponse;
}

// Crypto/Web3 types
export interface WalletInfoRequest {
  address: string;
  network?: 'ethereum' | 'polygon';
}

export interface WalletInfoResponse {
  address: string;
  network: string;
  balance: string;
  transactionCount: number;
  isContract: boolean;
}

export interface ContractInteractionRequest {
  contractAddress: string;
  abi: any[];
  method: string;
  params?: any[];
  network?: 'ethereum' | 'polygon';
}

export interface ContractInteractionResponse {
  transactionHash?: string;
  result?: any;
  contractAddress: string;
  method: string;
  params?: any[];
  network: string;
  gasUsed?: string;
}

// External API types
export interface OpenAIRequest {
  message: string;
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxTokens?: number;
}

export interface OpenAIResponse {
  message: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Database types
export interface DatabaseHealthResponse {
  healthy: boolean;
  timestamp: string;
}
