import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "./Components/utils/helper";
import ProtectedRoute from './Components/ProtectedRoute';
import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import Home from "./Components/User/Home";
import AboutUs from "./Components/User/AboutUs";
import Contacts from "./Components/User/Contacts";
import EditProfile from "./Components/User/EditProfile";
import AdminDashboard from "./Components/Admin/Dashboard";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import ResetPassword from "./Components/Auth/ResetPassword";
import ChangePassword from "./Components/User/ChangePassword";
import Dashboard from "./Components/Farmer/Dashboard";

const App = () => {
  const token = isAuthenticated();
  const user = getUser();

  const getDefaultRoute = () => {
    if (!token) return "/login";
    if (user && user.role === "admin") return "/admin/dashboard";
    if (user && user.role === "farmer") return "/farmer/dashboard";
    return "/home";
  };

  return (
    <Router>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* User Protected Routes */}
        <Route path="/home" element={<ProtectedRoute requiredRole="user"><Home /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute requiredRole="user"><AboutUs /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute requiredRole="user"><Contacts /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute requiredRole="user"><EditProfile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute requiredRole="user"><ChangePassword /></ProtectedRoute>} />

        {/* Farmer Protected Routes */}
        <Route path="/farmer/dashboard" element={<ProtectedRoute requiredRole="farmer"><Dashboard /></ProtectedRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
};

export default App;