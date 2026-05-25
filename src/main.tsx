import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1E2A',
            border: '1px solid #1F2535',
            color: '#F0F4FF',
          },
          className: 'font-body text-sm',
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
