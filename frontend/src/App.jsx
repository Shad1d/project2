import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SavedProvider } from "./context/SavedContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import OpportunityListPage from "./pages/OpportunityListPage.jsx";
import OpportunityDetailPage from "./pages/OpportunityDetailPage.jsx";
import SavedOpportunitiesPage from "./pages/SavedOpportunitiesPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Toaster position="top-right" />
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/opportunities" element={<OpportunityListPage />} />
                <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
                <Route path="/saved" element={<SavedOpportunitiesPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SavedProvider>
    </AuthProvider>
  );
}