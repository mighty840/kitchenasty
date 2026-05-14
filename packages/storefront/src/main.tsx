import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import Layout from './components/Layout.js';
import Home from './pages/Home.js';
import Locations from './pages/Locations.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import Account from './pages/Account.js';
import Menu from './pages/Menu.js';
import Checkout from './pages/Checkout.js';
import OrderConfirmation from './pages/OrderConfirmation.js';
import Reservations from './pages/Reservations.js';
import Gallery from './pages/Gallery.js';
import OrderHistory from './pages/OrderHistory.js';
import OrderStatus from './pages/OrderStatus.js';
import AuthCallback from './pages/AuthCallback.js';
import PrivacyPolicy from './pages/PrivacyPolicy.js';
import Impressum from './pages/Impressum.js';
import NotFound from './pages/NotFound.js';
import './i18n/index.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderConfirmation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<OrderHistory />} />
            <Route path="/orders/:id" element={<OrderStatus />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </CartProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
