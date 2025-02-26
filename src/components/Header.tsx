import React from 'react'
import { Box, Flex, Button, useColorModeValue, Image, HStack, IconButton } from '@chakra-ui/react'
import { SearchIcon, BellIcon } from '@chakra-ui/icons'

export const Header = () => {
  const bgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box bg={bgColor} px={4} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Image h="32px" src="/chainx-logo.png" alt="ChainX" />
          <HStack spacing={8} ml={8}>
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Market</Button>
            <Button variant="ghost">Portfolio</Button>
            <Button variant="ghost">Analytics</Button>
            <Button variant="ghost">Reports</Button>
          </HStack>
        </Flex>

        <Flex alignItems="center">
          <IconButton
            aria-label="Search"
            icon={<SearchIcon />}
            variant="ghost"
            mr={4}
          />
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            mr={4}
          />
        </Flex>
      </Flex>
    </Box>
  )
} 