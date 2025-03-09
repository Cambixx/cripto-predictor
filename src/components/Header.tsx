import React, { useState } from 'react'
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
  Link,
  Stack
} from '@chakra-ui/react'
import { SearchIcon, BellIcon, HamburgerIcon } from '@chakra-ui/icons'
import { FiMenu, FiX, FiGrid, FiTrendingUp, FiBarChart2, FiPieChart, FiFileText, FiBell, FiActivity } from 'react-icons/fi'

export const Header = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const location = useLocation()

  const menuItems = [
    { name: 'Dashboard', icon: <FiGrid />, path: '/dashboard' },
    { name: 'Mercado', icon: <FiTrendingUp />, path: '/market' },
    { name: 'Analytics', icon: <FiBarChart2 />, path: '/analytics' },
    { name: 'Portfolio', icon: <FiPieChart />, path: '/portfolio' },
    { name: 'Reportes', icon: <FiFileText />, path: '/reports' },
    { name: 'Alertas', icon: <FiBell />, path: '/alerts' },
    { name: 'Análisis Avanzado', icon: <FiActivity />, path: '/advanced' },
  ]

  const activeColor = useColorModeValue('brand.primary', 'white')
  const textColor = useColorModeValue('gray.500', 'gray.400')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')

  // Menú principal
  const DesktopNav = () => {
    return (
      <Stack direction="row" spacing={4}>
        {menuItems.map((item) => (
          <RouterLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="ghost"
              px={2}
              py={1}
              rounded="md"
              fontWeight="medium"
              color={location.pathname === item.path ? activeColor : textColor}
              _hover={{
                bg: hoverBg
              }}
            >
              {item.name}
            </Button>
          </RouterLink>
        ))}
      </Stack>
    );
  };

  // Renderizar menú desplegable móvil 
  const renderMobileMenu = () => {
    return (
      <VStack spacing={0} align="stretch">
        {menuItems.map((item) => (
          <RouterLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: 'none' }}
            onClick={onClose}
          >
            <Button
              variant="ghost"
              justifyContent="flex-start"
              width="100%"
              py={6}
              borderRadius={0}
              fontWeight="medium"
              color={location.pathname === item.path ? 'blue.600' : 'gray.500'}
              _hover={{
                bg: 'gray.100',
                color: 'blue.600'
              }}
              leftIcon={item.icon}
            >
              {item.name}
            </Button>
          </RouterLink>
        ))}
      </VStack>
    );
  };

  return (
    <Box bg={bgColor} px={4} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Link as={RouterLink} to="/">
            <Image h="32px" src="/chainx-logo.png" alt="ChainX" />
          </Link>
          {!isMobile && (
            <HStack spacing={2} ml={8}>
              <DesktopNav />
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
            {renderMobileMenu()}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
} 