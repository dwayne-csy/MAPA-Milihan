import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "./Components/utils/helper";
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

        {/* User Protected Routes */}
        <Route 
          path="/home" 
          element={token ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/about" 
          element={token ? <AboutUs /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/contact" 
          element={token ? <Contacts /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/edit-profile" 
          element={token ? <EditProfile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<ForgotPassword />} 
        />
        <Route 
          path="/reset-password/:token" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/change-password" 
          element={token ? <ChangePassword /> : <Navigate to="/login" />} 
        />
        {/* Admin Dashboard */}
        <Route 
          path="/admin/dashboard" 
          element={
            token && user?.role === "admin" ? 
            <AdminDashboard /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/farmer/dashboard" 
          element={
            token && user?.role === "farmer" ? 
            <Dashboard /> : 
            <Navigate to="/login" />
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
      </Routes>
    </Router>
  );
};

export default App;