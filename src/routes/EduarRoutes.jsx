import React from "react";
import { Navigate } from "react-router-dom";
import LogIn from "../auth/LogIn";
import SignUp from "../auth/SignUp";
import Arrays from "../modules/Arrays";

const Home = React.lazy(() => import("../pages/Home"));
const Modules = React.lazy(() => import("../pages/Modules"));
const AR = React.lazy(() => import("../pages/AR"));
const Personal = React.lazy(() => import("../pages/Personal"));
const Settings = React.lazy(() => import("../pages/Settings"));

const EduarRoutes = {
  path: "/",
  children: [
    { index: true, element: <Navigate to="/auth/login" replace /> }, // <- Updated
    { path: "auth/login", element: <LogIn /> }, // <- Added
    { path: "auth/signup", element: <SignUp /> },
    { path: "home", element: <Home /> },
    { path: "modules", element: <Modules /> },
    { path: "ar-assessment", element: <AR /> },
    { path: "personal", element: <Personal /> },
    { path: "settings", element: <Settings /> },

    {
      path: "modules/arrays",
      element: <Arrays />,
    },
  ],
};

export default EduarRoutes;
