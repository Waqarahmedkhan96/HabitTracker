import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/ui/ui.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import ToastProvider from './components/ui/ToastProvider.tsx'
import ConfirmProvider from './components/ui/ConfirmProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
