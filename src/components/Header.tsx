import React from 'react'
import {
  Box,
  Flex,
  Button,
  useColorModeValue,
  Image,
  HStack,
  IconButton,
  useDisclosure,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue
} from '@chakra-ui/react'
import { SearchIcon, BellIcon, HamburgerIcon } from '@chakra-ui/icons'

export const Header = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const MenuItems = () => (
    <>
      <Button variant="ghost">Dashboard</Button>
      <Button variant="ghost">Market</Button>
      <Button variant="ghost">Portfolio</Button>
      <Button variant="ghost">Analytics</Button>
      <Button variant="ghost">Reports</Button>
    </>
  )

  return (
    <Box bg={bgColor} px={4} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Image h="32px" src="/chainx-logo.png" alt="ChainX" />
          {!isMobile && (
            <HStack spacing={8} ml={8}>
              <MenuItems />
            </HStack>
          )}
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
          {isMobile && (
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
            />
          )}
        </Flex>
      </Flex>

      {/* Menú móvil */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <MenuItems />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
} 