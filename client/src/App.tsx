import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import OIDC from "./pages/OIDC";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/oidc/auth" element={<OIDC />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
