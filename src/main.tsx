import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeerConnectionProvider } from './contexts/PeerConnectionContext.tsx'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <PeerConnectionProvider>
        <App />
      </PeerConnectionProvider>
    </FluentProvider>
  </StrictMode>,
)
