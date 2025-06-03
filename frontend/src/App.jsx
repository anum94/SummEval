import 'src/global.css';

import { AuthProvider } from './auth/context/jwt/authProvider';
import { defaultSettings, SettingsProvider } from 'src/components/Settings';
import { ThemeProvider } from '/src/theme/themeProvider';
import { MotionLazy } from './components/Animate/motion-lazy';
import { router } from './routes/sections/index.jsx';
import { RouterProvider } from 'react-router-dom';
//import { useScrollToTop } from "./hooks/use-scroll-top";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider settings={defaultSettings}>
        <ThemeProvider>
          <MotionLazy>
            <RouterProvider router={router} />
          </MotionLazy>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

/*
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Home from "./pages/global/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/global/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectCreationForm from "./pages/form/ProjectCreationForm";
import MyWorkspace, { loader as rootLoader } from "./routes/MyWorkspace.jsx";
import AllProjects from "./routes/AllProjects.jsx";
import ExperimentDetail from "./routes/ExperimentDetails.jsx";
import { summaryLoader } from "./DataLoaders.jsx";
import { loader as projectLoader } from "./DataLoaders.jsx";
import { invitationLoader } from "./DataLoaders.jsx";
import SummaryEvaluation from "./components/SummaryEvaluation.jsx";
import ProjectDetails from "./routes/ProjectDetails.jsx";
import SurveyDetails from "./routes/SurveyDetails.jsx";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}


function App() {
  const [theme, colorMode] = useMode();

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
    },
    {
      path: "/newProject",
      element: (
        <ProtectedRoute>
          <ProjectCreationForm />
        </ProtectedRoute>
      ),
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <RegisterAndLogout />,
    },
    {
      path: "/logout",
      element: <Logout />,
    },
    {
      path: "/summaryeval/:survey_id/:invite_id",
      element: <SummaryEvaluation />,
      loader: summaryLoader,
    },
    {
      path: "/my-workspace",
      element: (
        <ProtectedRoute>
          <MyWorkspace />
        </ProtectedRoute>
      ),
      loader: rootLoader,
      children: [
        {
          index: true,
          element: <AllProjects />,
          loader: rootLoader,
        },
        {
          path: "project/:id",
          element: <ProjectDetails />,
          loader: projectLoader,
        },
        {
          path: "experiment/:id",
          element: <ExperimentDetail />,
        },
        {
          path: "survey/:survey_id",
          element: <SurveyDetails />,
          loader: invitationLoader,
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  */

/*
<Routes>
      // All unprotected routes
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/info" element={<InfoPage />} />

      //All protected routes
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/newProject"
        element={
          <ProtectedRoute>
            <ProjectCreationForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-workspace"
        element={
          <ProtectedRoute>
            <MyWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />
      //<Route path="/experiment/:id" element={<ProtectedRoute><ExperimentDetail /></ProtectedRoute>} />
    </Routes>
  */
