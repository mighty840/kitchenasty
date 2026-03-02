import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import AdminLayout from './components/AdminLayout.js';
import RequireRole from './components/RequireRole.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import LocationList from './pages/LocationList.js';
import LocationForm from './pages/LocationForm.js';
import CategoryList from './pages/CategoryList.js';
import CategoryForm from './pages/CategoryForm.js';
import MenuItemList from './pages/MenuItemList.js';
import MenuItemForm from './pages/MenuItemForm.js';
import TableList from './pages/TableList.js';
import OrderList from './pages/OrderList.js';
import OrderDetailPage from './pages/OrderDetail.js';
import ReservationList from './pages/ReservationList.js';
import ReservationDetail from './pages/ReservationDetail.js';
import CouponList from './pages/CouponList.js';
import CouponForm from './pages/CouponForm.js';
import ReviewList from './pages/ReviewList.js';
import KitchenDisplay from './pages/KitchenDisplay.js';
import AutomationRuleList from './pages/AutomationRuleList.js';
import AutomationRuleForm from './pages/AutomationRuleForm.js';
import DeliveryZoneList from './pages/DeliveryZoneList.js';
import CustomerLoyalty from './pages/CustomerLoyalty.js';
import LegalPageList from './pages/LegalPageList.js';
import LegalPageForm from './pages/LegalPageForm.js';
import CookieCategoryList from './pages/CookieCategoryList.js';
import ConsentLog from './pages/ConsentLog.js';
import DesignLanding from './pages/DesignLanding.js';
import DesignBranding from './pages/DesignBranding.js';
import DesignTheme from './pages/DesignTheme.js';
import DesignTemplates from './pages/DesignTemplates.js';
import StaffList from './pages/StaffList.js';
import StaffInvite from './pages/StaffInvite.js';
import StaffEdit from './pages/StaffEdit.js';
import AcceptInvite from './pages/AcceptInvite.js';
import Settings from './pages/Settings.js';
import SettingsGeneral from './pages/SettingsGeneral.js';
import SettingsOrder from './pages/SettingsOrder.js';
import SettingsReservation from './pages/SettingsReservation.js';
import SettingsMail from './pages/SettingsMail.js';
import SettingsPayments from './pages/SettingsPayments.js';
import SettingsReviews from './pages/SettingsReviews.js';
import SettingsAdvanced from './pages/SettingsAdvanced.js';
import './index.css';

function AppRoutes() {
  const { token, user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="*" element={<Login onLogin={login} />} />
      </Routes>
    );
  }

  return (
    <AdminLayout onLogout={logout}>
      <Routes>
        {/* All roles */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/reservations" element={<ReservationList />} />
        <Route path="/reservations/:id" element={<ReservationDetail />} />
        <Route path="/reviews" element={<ReviewList />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />

        {/* MANAGER+ */}
        <Route path="/locations" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><LocationList /></RequireRole>} />
        <Route path="/locations/new" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><LocationForm /></RequireRole>} />
        <Route path="/locations/:id" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><LocationForm /></RequireRole>} />
        <Route path="/locations/:locationId/tables" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><TableList /></RequireRole>} />
        <Route path="/locations/:locationId/delivery-zones" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><DeliveryZoneList /></RequireRole>} />
        <Route path="/menu" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><Navigate to="/menu/items" replace /></RequireRole>} />
        <Route path="/menu/categories" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CategoryList /></RequireRole>} />
        <Route path="/menu/categories/new" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CategoryForm /></RequireRole>} />
        <Route path="/menu/categories/:id" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CategoryForm /></RequireRole>} />
        <Route path="/menu/items" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><MenuItemList /></RequireRole>} />
        <Route path="/menu/items/new" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><MenuItemForm /></RequireRole>} />
        <Route path="/menu/items/:id" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><MenuItemForm /></RequireRole>} />
        <Route path="/coupons" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CouponList /></RequireRole>} />
        <Route path="/coupons/new" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CouponForm /></RequireRole>} />
        <Route path="/coupons/:id" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CouponForm /></RequireRole>} />
        <Route path="/automation" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><AutomationRuleList /></RequireRole>} />
        <Route path="/automation/new" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><AutomationRuleForm /></RequireRole>} />
        <Route path="/automation/:id" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><AutomationRuleForm /></RequireRole>} />
        <Route path="/loyalty" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CustomerLoyalty /></RequireRole>} />
        <Route path="/design" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><Navigate to="/design/landing" replace /></RequireRole>} />
        <Route path="/design/landing" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><DesignLanding /></RequireRole>} />
        <Route path="/design/branding" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><DesignBranding /></RequireRole>} />
        <Route path="/design/theme" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><DesignTheme /></RequireRole>} />
        <Route path="/design/templates" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><DesignTemplates /></RequireRole>} />
        <Route path="/legal" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><Navigate to="/legal/pages" replace /></RequireRole>} />
        <Route path="/legal/pages" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><LegalPageList /></RequireRole>} />
        <Route path="/legal/pages/:slug" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><LegalPageForm /></RequireRole>} />
        <Route path="/legal/cookies" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><CookieCategoryList /></RequireRole>} />
        <Route path="/legal/consent" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><ConsentLog /></RequireRole>} />

        {/* Settings — MANAGER+ (sub-pages have their own role checks) */}
        <Route path="/settings" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><Settings /></RequireRole>} />
        <Route path="/settings/general" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><SettingsGeneral /></RequireRole>} />
        <Route path="/settings/order" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><SettingsOrder /></RequireRole>} />
        <Route path="/settings/reservation" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><SettingsReservation /></RequireRole>} />
        <Route path="/settings/mail" element={<RequireRole roles={['SUPER_ADMIN']}><SettingsMail /></RequireRole>} />
        <Route path="/settings/payment" element={<RequireRole roles={['SUPER_ADMIN']}><SettingsPayments /></RequireRole>} />
        <Route path="/settings/review" element={<RequireRole roles={['SUPER_ADMIN', 'MANAGER']}><SettingsReviews /></RequireRole>} />
        <Route path="/settings/advanced" element={<RequireRole roles={['SUPER_ADMIN']}><SettingsAdvanced /></RequireRole>} />

        {/* SUPER_ADMIN only */}
        <Route path="/staff" element={<RequireRole roles={['SUPER_ADMIN']}><StaffList /></RequireRole>} />
        <Route path="/staff/invite" element={<RequireRole roles={['SUPER_ADMIN']}><StaffInvite /></RequireRole>} />
        <Route path="/staff/:id" element={<RequireRole roles={['SUPER_ADMIN']}><StaffEdit /></RequireRole>} />
      </Routes>
    </AdminLayout>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
