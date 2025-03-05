import React from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
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
  useBreakpointValue,
  Link
} from '@chakra-ui/react'
import { SearchIcon, BellIcon, HamburgerIcon } from '@chakra-ui/icons'

export const Header = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/market', label: 'Market' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/reports', label: 'Reports' },
    { path: '/alerts', label: 'Alertas' }
  ]

  const MenuItems = () => (
    <>
      {menuItems.map((item) => (
        <Link 
          key={item.path} 
          as={RouterLink} 
          to={item.path}
        >
          <Button 
            variant="ghost"
            isActive={location.pathname === item.path}
            _active={{
              bg: 'brand.primary',
              color: 'white'
            }}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  )

  return (
    <Box bg={bgColor} px={4} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Link as={RouterLink} to="/">
            <Image h="32px" src="/chainx-logo.png" alt="ChainX" />
          </Link>
          {!isMobile && (
            <HStack spacing={2} ml={8}>
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
          <Link as={RouterLink} to="/alerts">
            <IconButton
              aria-label="Alertas"
              icon={<BellIcon />}
              variant="ghost"
              mr={4}
              color={location.pathname === '/alerts' ? 'brand.primary' : undefined}
              _hover={{ color: 'brand.primary' }}
            />
          </Link>
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