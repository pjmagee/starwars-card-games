import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeerConnectionProvider } from './contexts/PeerConnectionContext.tsx'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <PeerConnectionProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </PeerConnectionProvider>
    </FluentProvider>
  </StrictMode>,
)
