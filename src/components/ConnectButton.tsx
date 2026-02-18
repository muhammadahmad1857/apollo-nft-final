'use client'

import { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useEnsName,
  useEnsAvatar,
  useBalance,
} from 'wagmi'
import { createUser, getUserByWallet } from '@/actions/users'
import { Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'

export const CustomConnectButton = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()

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

    console.log(balance)

  useEffect(() => {
    const registerUser = async () => {
      if (!address) return

      try {
        const existingUser = await getUserByWallet(address)
        console.log('Existing user:', existingUser)

        if (existingUser) return

        await createUser({
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
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

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
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
