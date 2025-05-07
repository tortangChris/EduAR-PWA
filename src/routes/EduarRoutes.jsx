import React from "react";
import { Navigate } from "react-router-dom";
import IntroductionToAlgorithms from "../modules/IntroductionToAlgorithms";

const Home = React.lazy(() => import("../pages/Home"));
const Modules = React.lazy(() => import("../pages/Modules"));
const Notification = React.lazy(() => import("../pages/Notification"));
const Personal = React.lazy(() => import("../pages/Personal"));
const Settings = React.lazy(() => import("../pages/Settings"));

const EduarRoutes = {
  path: "/",
  children: [
    { index: true, element: <Navigate to="/home" replace /> },
    { path: "home", element: <Home /> },
    { path: "modules", element: <Modules /> },
    { path: "notification", element: <Notification /> },
    { path: "personal", element: <Personal /> },
    { path: "settings", element: <Settings /> },
    {
      path: "modules/intro-to-algorithms",
      element: <IntroductionToAlgorithms />,
    },
  ],
};

export default EduarRoutes;
