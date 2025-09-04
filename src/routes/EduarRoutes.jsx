import React from "react";
import { Navigate } from "react-router-dom";
import LogIn from "../auth/LogIn";
import SignUp from "../auth/SignUp";

import ModuleWrapper from "../modules/ModuleWrapper";

const Home = React.lazy(() => import("../pages/Home"));
const Modules = React.lazy(() => import("../pages/Modules"));
const AR = React.lazy(() => import("../pages/AR"));
const Personal = React.lazy(() => import("../pages/Personal"));
const Settings = React.lazy(() => import("../pages/Settings"));

const EduarRoutes = {
  path: "/",
  children: [
    { index: true, element: <Navigate to="/auth/login" replace /> },
    { path: "auth/login", element: <LogIn /> },
    { path: "auth/signup", element: <SignUp /> },
    { path: "home", element: <Home /> },
    { path: "modules", element: <Modules /> },
    { path: "ar-assessment", element: <AR /> },
    { path: "personal", element: <Personal /> },
    { path: "settings", element: <Settings /> },

    // Dynamic Modules
    {
      path: "modules/:module/:page?",
      element: <ModuleWrapper />,
    },
  ],
};

export default EduarRoutes;
