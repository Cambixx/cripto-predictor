import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { 
  ChakraProvider, 
  Box, 
  Container, 
  Grid, 
  GridItem, 
  extendTheme,
  ThemeConfig,
  withDefaultColorScheme,
  type ThemeComponents,
  VStack
} from '@chakra-ui/react'
import { Header } from './components/Header'
import { CryptoChart } from './components/CryptoChart'
import { TransactionsOverview } from './components/TransactionsOverview'
import { TradingSignals } from './components/TradingSignals'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { MarketPage } from './pages/market/MarketPage'
import { PortfolioPage } from './pages/portfolio/PortfolioPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { AlertsPage } from './pages/alerts/AlertsPage'

// Configuración del tema
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

// Colores personalizados con tonos más vibrantes
const colors = {
  dark: {
    100: '#1a1b1e',
    200: '#16181d',
    300: '#202226',
    400: '#2d2f34',
    500: '#3a3d42',
  },
  brand: {
    primary: '#2563eb',    // Azul brillante
    secondary: '#3b82f6',  // Azul claro
    accent: '#60a5fa',     // Azul más claro
    success: '#10b981',    // Verde esmeralda
    warning: '#f59e0b',    // Ámbar
    danger: '#ef4444',     // Rojo
    info: '#3b82f6',       // Azul informativo
  },
  gradient: {
    blue: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    red: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  },
}

// Componentes personalizados con diseño moderno
const components: ThemeComponents = {
  Container: {
    baseStyle: {
      maxW: 'container.xl',
      px: { base: 4, md: 6, lg: 8 },
    },
  },
  Card: {
    parts: ['container', 'header', 'body', 'footer'],
    baseStyle: {
      container: {
        bg: 'dark.200',
        borderRadius: 'xl',
        borderWidth: '1px',
        borderColor: 'dark.400',
        backdropFilter: 'blur(10px)',
        boxShadow: 'xl',
        transition: 'all 0.3s ease-in-out',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: '2xl',
          borderColor: 'dark.500',
        },
      },
      header: {
        p: 6,
        borderBottomWidth: '1px',
        borderColor: 'dark.400',
      },
      body: {
        p: 6,
      },
      footer: {
        p: 6,
        borderTopWidth: '1px',
        borderColor: 'dark.400',
      },
    },
  },
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
      transition: 'all 0.2s ease-in-out',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme ? `${props.colorScheme}.500` : 'brand.primary',
        color: 'white',
        _hover: {
          bg: props.colorScheme ? `${props.colorScheme}.600` : 'brand.secondary',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'translateY(0)',
        },
      }),
      outline: {
        borderWidth: '2px',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
      },
      ghost: {
        _hover: {
          bg: 'dark.300',
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  Alert: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        backdropFilter: 'blur(8px)',
      },
    },
    variants: {
      solid: {
        container: {
          bgGradient: 'linear(to-r, brand.primary, brand.secondary)',
        },
      },
      subtle: {
        container: {
          bg: 'dark.300',
          borderWidth: '1px',
          borderColor: 'dark.400',
        },
      },
    },
  },
  Tabs: {
    variants: {
      'soft-rounded': {
        tab: {
          borderRadius: 'lg',
          fontWeight: 'semibold',
          transition: 'all 0.2s ease-in-out',
          _selected: {
            bgGradient: 'linear(to-r, brand.primary, brand.secondary)',
            color: 'white',
          },
          _hover: {
            bg: 'dark.300',
          },
        },
      },
    },
  },
  Progress: {
    baseStyle: {
      track: {
        bg: 'dark.300',
      },
      filledTrack: {
        transition: 'all 0.4s ease-in-out',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'md',
      px: 3,
      py: 1,
      fontWeight: 'semibold',
    },
    variants: {
      solid: {
        bgGradient: 'linear(to-r, brand.primary, brand.secondary)',
      },
    },
  },
  Spinner: {
    baseStyle: {
      color: 'brand.primary',
    },
  },
}

// Estilos globales modernos
const styles = {
  global: {
    'html, body': {
      bg: 'dark.100',
      color: 'white',
      lineHeight: 'tall',
    },
    '*::placeholder': {
      color: 'whiteAlpha.400',
    },
    '*, *::before, *::after': {
      borderColor: 'dark.400',
    },
    '::-webkit-scrollbar': {
      width: '10px',
      height: '10px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'dark.200',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'dark.400',
      borderRadius: '5px',
      '&:hover': {
        bg: 'dark.500',
      },
    },
  },
}

// Crear el tema con todas las personalizaciones
const theme = extendTheme(
  {
    config,
    colors,
    components,
    styles,
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    shadows: {
      outline: '0 0 0 3px rgba(37, 99, 235, 0.6)',
    },
    radii: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '1rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      full: '9999px',
    },
  },
  withDefaultColorScheme({ colorScheme: 'brand' })
)

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box 
          minH="100vh" 
          bgGradient="linear(to-b, dark.100, dark.200)"
          backgroundImage="radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 20%),
                          radial-gradient(circle at 90% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 20%),
                          radial-gradient(circle at 30% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 20%)"
        >
          <Header />
          <Container maxW="container.xl" py={8}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App 