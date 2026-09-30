import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <SiteProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <App />
                <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: '999px', background: 'rgb(var(--c-text))', color: 'rgb(var(--c-background))', fontSize: 14 } }} />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </SiteProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
