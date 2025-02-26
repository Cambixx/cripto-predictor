import React from 'react'
import { VStack } from '@chakra-ui/react'
import { CryptoChart } from '../../components/CryptoChart'
import { TradingSignals } from '../../components/TradingSignals'
import { TransactionsOverview } from '../../components/TransactionsOverview'

export const DashboardPage = () => {
  return (
    <VStack spacing={8} align="stretch">
      <CryptoChart />
      <TradingSignals />
      <TransactionsOverview />
    </VStack>
  )
} 