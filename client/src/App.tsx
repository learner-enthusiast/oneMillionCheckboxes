import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import OIDC from "./pages/OIDC";
import Login from "./pages/Login";
import Checkbox from "./pages/Checkbox";
import Location from "./pages/Location";
import FreeAPI from "./pages/FreeAPI";
import YTVideoPage from "./pages/FreeAPISubPages/YTVideoPage";
import Header from "./pages/Header";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/oidc/auth" element={<OIDC />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/checkboxes"
          element={
            <ProtectedRoute>
              <Checkbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/freeAPI"
          element={
            <ProtectedRoute>
              <FreeAPI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/freeAPI/yt/:videoId"
          element={
            <ProtectedRoute>
              <YTVideoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/location"
          element={
            <ProtectedRoute>
              <Location />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
