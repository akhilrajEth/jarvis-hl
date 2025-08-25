'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { sepolia, Chain } from 'viem/chains';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets'; 

const hyperEVM: Chain = {
  id: 999, 
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://hyperevmscan.io/',
    },
  },
};
interface Props {
  children: React.ReactNode;
}

export function PrivyAuthProvider({ children }: Props) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Required</h2>
          <p className="text-gray-700 mb-4">
            Please set up your environment variables to use this application:
          </p>
          <ol className="text-sm text-gray-600 space-y-2 mb-4">
            <li>1. Copy <code className="bg-gray-100 px-1 rounded">env.template</code> to <code className="bg-gray-100 px-1 rounded">.env.local</code></li>
            <li>2. Get your Privy App ID from <a href="https://dashboard.privy.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">dashboard.privy.io</a></li>
            <li>3. Get your Pimlico API key from <a href="https://dashboard.pimlico.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">dashboard.pimlico.io</a></li>
            <li>4. Restart your development server</li>
          </ol>
          <div className="bg-gray-100 p-3 rounded text-xs">
            <strong>Missing:</strong> NEXT_PUBLIC_PRIVY_APP_ID
          </div>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Configure Privy to create embedded wallets for all users wallets
        embeddedWallets: {
          createOnLogin: 'all-users',
          // Turn off confirmation modals so we can use our own UIs
          showWalletUIs: false,
        },
        loginMethods: ['email', 'wallet', 'google', 'github'],
        // Enable external wallets like Rabby, MetaMask, etc.
        externalWallets: {
          metamask: true,
          coinbase_wallet: true,
          wallet_connect: true, // This allows other injected wallets like Rabby
        },
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://img.icons8.com/?size=100&id=63439&format=png&color=000000', //Update to Jarvis logo
        },
        supportedChains: [hyperEVM], 
        defaultChain: hyperEVM,
      }}
    ><SmartWalletsProvider>
      {children}
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
