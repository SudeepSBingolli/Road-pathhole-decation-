import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '14px',
                background: '#08192B',
                color: '#F4F8FC',
                border: '1px solid rgba(130, 190, 230, 0.25)',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 10px 30px -3px rgba(0, 0, 0, 0.7)',
              },
              success: {
                iconTheme: {
                  primary: '#35D6A0',
                  secondary: '#08192B',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF6474',
                  secondary: '#08192B',
                },
              },
            }}
          />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
