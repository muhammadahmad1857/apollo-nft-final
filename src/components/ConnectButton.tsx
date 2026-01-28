import { ConnectButton } from '@rainbow-me/rainbowkit';
import {createUser} from "@/actions/users"
export type Account = {
  address: string;
  balanceDecimals?: string;
  balanceFormatted?: string;
  balanceSymbol?: string;
  displayBalance?: string;
  displayName: string;
  ensAvatar?: string;
  ensName?: string;
  hasPendingTransactions: boolean;
};


export const CustomConnectButton = () => {

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const saveUser = async (account: any) => {
  //   try {
  //     await fetch('/api/users', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         address: account.address,
  //         name: account.displayName || account.ensName || 'Unnamed',
  //         avatar: account?.ensAvatar || null,
  //       }),
  //     });
  //   } catch (err) {
  //     console.error('Failed to save user', err);
  //   }
  // };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        // Perform saving once connected
        if (connected && account) createUser({
          walletAddress:account.address,
          name:account.displayName || account.ensName || 'Unnamed',
          avatarUrl:account?.ensAvatar || null,

        });

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
                    <div style={{ background: chain.iconBackground, width: 12, height: 12, borderRadius: 999, overflow: 'hidden', marginRight: 4 }}>
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
