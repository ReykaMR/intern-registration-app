import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import ProgramRegistration from "./pages/ProgramRegistration";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Payment from "./pages/Payment";
import PaymentManagement from "./pages/PaymentManagement";
import SelectionAndPlacementManagement from "./pages/SelectionAndPlacementManagement";
import FinancialReports from "./pages/FinancialReports";
import ProgramManagement from "./pages/ProgramManagement";
import UserManagement from "./pages/UserManagement";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isParticipant, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isParticipant) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes - Bisa diakses semua orang */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/programs"
          element={
            <Layout>
              <Programs />
            </Layout>
          }
        />
        <Route
          path="/program/:id"
          element={
            <Layout>
              <ProgramDetail />
            </Layout>
          }
        />
        <Route
          path="/about-us"
          element={
            <Layout>
              <AboutUs />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />

        {/* Public Routes yang HANYA untuk yang belum login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Layout>
                <Login />
              </Layout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Layout>
                <Register />
              </Layout>
            </PublicRoute>
          }
        />

        {/* Protected User Routes - Hanya untuk participant */}
        <Route
          path="/registration"
          element={
            <ProtectedRoute>
              <Layout>
                <ProgramRegistration />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <UserDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Layout>
                <Payment />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Hanya untuk admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <PaymentManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/selection-and-placement"
          element={
            <AdminRoute>
              <SelectionAndPlacementManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/financial-reports"
          element={
            <AdminRoute>
              <FinancialReports />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/programs"
          element={
            <AdminRoute>
              <ProgramManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;