import { useState } from "react";
import "./App.css";
import LandingPage from "./components/pages/home";
import ShareRevealPage from "./components/pages/upload";
import RevealPage from "./components/pages/Reveal";
import DashboardPage from "./components/pages/DashboardPage";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1a0f2e",
            color: "#fff",
            borderRadius: "12px",
          },
        }}
      />

      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/share" element={<ShareRevealPage />} />
          <Route path="/reveal/:publicLink" element={<RevealPage />} />
          <Route path="/dashboard/:privateLink" element={<DashboardPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;