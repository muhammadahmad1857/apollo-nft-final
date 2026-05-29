'use client'

import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useEnsName,
  useEnsAvatar,
  useBalance,
} from 'wagmi'
import { marketplaceApi } from '@/lib/marketplaceApi'
import { Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'

export const CustomConnectButton = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const [musesSession, setMusesSession] = useState<{
    account: string | null
    network: string | null
    isTestnet: boolean
    isEvmAccount: boolean
  } | null>(null)
  console.debug('useAccount hook ->', { address, isConnected, isConnecting, isReconnecting });

  // ✅ Fetch ENS name (only works on Ethereum mainnet)
  const { data: ensName } = useEnsName({
    address,
  })

  // ✅ Fetch ENS avatar using ENS name (NOT wallet address)
  const { data: ensAvatar } = useEnsAvatar({
    name: String(ensName),
  })

  // ✅ Fetch wallet balance
  const { data: balance } = useBalance({
    address,
  })
const formattedBalance =
  balance
    ? Number(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : null

  useEffect(() => {
    const checkMusesAccounts = async () => {
      try {
        const eth = (window as any).ethereum
        const muses = (window as any).muses
        if (!eth?.request) return
        const accounts = await eth.request({ method: 'eth_accounts' })
        const musesAccounts = muses?.getAccounts ? await muses.getAccounts().catch(() => []) : []
        const musesNetwork = muses?.getNetwork ? await muses.getNetwork().catch(() => null) : null

        const allAccounts = Array.isArray(accounts) ? accounts : []
        const evmAccount = allAccounts.find((acc) => typeof acc === 'string' && /^0x[a-fA-F0-9]{40}$/.test(acc)) ?? null
        const musesAccount = Array.isArray(musesAccounts) && musesAccounts.length > 0 ? String(musesAccounts[0]) : null
        const isTestnet = typeof musesNetwork === 'string' ? /testnet|test/i.test(musesNetwork) : false

        if (musesAccount) {
          setMusesSession({
            account: musesAccount,
            network: typeof musesNetwork === 'string' ? musesNetwork : null,
            isTestnet,
            isEvmAccount: !!evmAccount,
          })
        } else {
          setMusesSession(null)
        }
      } catch (e) {
        console.debug('checkMusesAccounts error', e)
      }
    }

    checkMusesAccounts()

    const registerUser = async () => {
      if (!address) return

      try {
        const existingUser = await marketplaceApi.users.getByWallet(address)
        console.log('Existing user:', existingUser)

        if (existingUser) return

        await marketplaceApi.users.create({
          walletAddress: address,
          name: ensName || address.slice(0, 6) + '...' + address.slice(-4),
          avatarUrl: ensAvatar || null,
        })

        console.log('User created successfully')
      } catch (err) {
        console.error('Failed to create user', err)
      }
    }

    if (isConnected && address) {
      registerUser()
    }
  }, [isConnected, address, ensName, ensAvatar])

  // 🔄 Show loader when connecting
  if (isConnecting || isReconnecting) {
    return (
      <p className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        Connecting to your wallet...
      </p>
    )
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        console.debug('ConnectButton.Custom render ->', { account, chain, authenticationStatus, mounted });
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

        const hasMusesTestnetSession = !!musesSession && musesSession.isTestnet && !musesSession.isEvmAccount

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {!connected && !hasMusesTestnetSession ? (
              <button
                onClick={() => {
                  try {
                    console.debug('ConnectButton: openConnectModal clicked', {
                      account,
                      chain,
                      windowEthereum: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
                    })
                  } catch (e) {
                    console.debug('ConnectButton: error inspecting before open', e)
                  }
                  try {
                    openConnectModal()
                  } catch (e) {
                    console.debug('ConnectButton: openConnectModal threw', e)
                  }
                }}
                type="button"
              >
                Connect Wallet
              </button>
            ) : !hasMusesTestnetSession && !!chain?.unsupported ? (
              <button onClick={openChainModal} type="button">
                Wrong network
              </button>
            ) : hasMusesTestnetSession ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button type="button" style={{ display: 'flex', alignItems: 'center' }}>
                  Muses Testnet
                </button>
                <button type="button" onClick={openAccountModal}>
                  {(musesSession.account.slice(0, 6) + '...' + musesSession.account.slice(-4))}
                </button>
                <span style={{ fontSize: 12, color: '#fbbf24' }}>
                  Testnet mode
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Chain Button */}
                <button
                  onClick={openChainModal}
                  style={{ display: 'flex', alignItems: 'center' }}
                  type="button"
                >
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
                      {chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          style={{ width: 12, height: 12 }}
                        />
                      )}
                    </div>
                  )}
                  {chain.name}
                </button>

                {/* Account Button */}
                <button onClick={openAccountModal} type="button">
                  {ensName || account.displayName}
                  {balance
                    ? ` (${Number(formattedBalance)} ${balance.symbol})`
                    : ''}
                </button>
              </div>
            )}
            {hasMusesTestnetSession ? (
              <p style={{ marginTop: 8, fontSize: 12, color: '#fbbf24' }}>
                Muses is connected in testnet mode. EVM actions may still be unavailable here.
              </p>
            ) : null}
            {musesSession && !musesSession.isTestnet && !musesSession.isEvmAccount ? (
              <p style={{ marginTop: 8, fontSize: 12, color: '#fbbf24' }}>
                Muses returned a non-EVM account, so Wagmi cannot mark it as connected.
              </p>
            ) : null}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
