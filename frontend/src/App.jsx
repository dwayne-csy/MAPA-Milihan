import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "./Components/utils/helper";
import ProtectedRoute from './Components/ProtectedRoute';
import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import Home from "./Components/User/Home";
import EditProfile from "./Components/User/EditProfile";
import AdminDashboard from "./Components/Admin/Dashboard";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import ResetPassword from "./Components/Auth/ResetPassword";
import ChangePassword from "./Components/User/ChangePassword";
import Dashboard from "./Components/Farmer/Dashboard";
import ProductList from "./Components/Farmer/products/ProductList";
import CreateProduct from "./Components/Farmer/products/CreateProduct";
import UpdateProduct from "./Components/Farmer/products/UpdateProduct";
import FarmerEditProfile from "./Components/Farmer/FarmerEditProfile";
import Product from "./Components/User/Product";
import ProductDetails from "./Components/User/ProductDetails";
import ViewProduct from "./Components/Farmer/products/ViewProduct";
import Maps from "./Components/User/Maps";
import Forum from "./Components/User/Forum";
import FarmerForum from "./Components/Farmer/FarmerForum";
import Cart from "./Components/User/Cart";
import Checkout from './Components/User/Checkout';
import CheckoutConfirmation from './Components/User/CheckoutConfirmation';
import OrderHistory from './Components/User/OrderHistory';
import OrderDetails from './Components/User/OrderDetails';

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
        <Route path="/edit-profile" element={<ProtectedRoute requiredRole="user"><EditProfile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute requiredRole="user"><ChangePassword /></ProtectedRoute>} />
        <Route path="/product" element={<ProtectedRoute requiredRole="user"><Product /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute requiredRole="user"><ProductDetails /></ProtectedRoute>} />
        <Route path="/maps" element={<ProtectedRoute requiredRole="user"><Maps /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute requiredRole="user"><Forum /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute requiredRole="user"><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/confirmation" element={<CheckoutConfirmation />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        
        
        {/* Farmer Protected Routes */}
        <Route path="/farmer/dashboard" element={<ProtectedRoute requiredRole="farmer"><Dashboard /></ProtectedRoute>} />
        <Route path="/farmer/productlist" element={<ProtectedRoute requiredRole="farmer"><ProductList /></ProtectedRoute>} />
        <Route path="/farmer/create-product" element={<ProtectedRoute requiredRole="farmer"><CreateProduct /></ProtectedRoute>} />
        <Route path="/farmer/update-product/:id" element={<ProtectedRoute requiredRole="farmer"><UpdateProduct /></ProtectedRoute>} />
        <Route path="/farmer/edit-profile" element={<ProtectedRoute requiredRole="farmer"><FarmerEditProfile /></ProtectedRoute>} />
        <Route path="/farmer/view-product/:id" element={<ProtectedRoute requiredRole="farmer"><ViewProduct /></ProtectedRoute>} />
        <Route path="/farmer/forum" element={<ProtectedRoute requiredRole="farmer"><FarmerForum /></ProtectedRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
};

export default App;