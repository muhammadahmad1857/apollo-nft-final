import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi';
import { createUser, getUserByWallet } from '@/actions/users';
import Loader from '@/components/loader';
import { Loader2 } from 'lucide-react';

export const CustomConnectButton = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ universalResolverAddress: address });

  useEffect(() => {
    const registerUser = async () => {
      if (!address) return;

      try {
        // 1️⃣ Check if user already exists
        const existingUser = await getUserByWallet(address);
        console.log('Existing user:', existingUser);
        if (existingUser) return; // already exists, do nothing

        // 2️⃣ Create user with ENS info
        await createUser({
          walletAddress: address,
          name: ensName || 'Unnamed',
          avatarUrl: ensAvatar || null,
        });
      } catch (err) {
        console.error('Failed to create user', err);
      }
    };

    if (isConnected) registerUser();
  }, [isConnected, address, ensName, ensAvatar]);

  // Show loader when connecting or reconnecting
  if (isConnecting || isReconnecting) {
    return <p className="flex gap-1"><Loader2 className='animate-spin'/> Connecting to your wallet...</p>;
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {!connected ? (
              <button onClick={openConnectModal} type="button">
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button onClick={openChainModal} type="button">
                Wrong network
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={openChainModal} style={{ display: 'flex', alignItems: 'center' }} type="button">
                  {chain.hasIcon && (
                    <div
                      style={{
                        background: chain.iconBackground,
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginRight: 4,
                      }}
                    >
                      {chain.iconUrl && <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 12, height: 12 }} />}
                    </div>
                  )}
                  {chain.name}
                </button>
                <button onClick={openAccountModal} type="button">
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
