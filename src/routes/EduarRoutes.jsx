import React from "react";
import { Navigate } from "react-router-dom";
import LogIn from "../auth/LogIn";
import SignUp from "../auth/SignUp";
import ModuleWrapper from "../modules/ModuleWrapper";
import ARDetection from "../pages/ARDetectetion";

const Home = React.lazy(() => import("../pages/Home"));
const Modules = React.lazy(() => import("../pages/Modules"));
const AR = React.lazy(() => import("../pages/AR"));
const Personal = React.lazy(() => import("../pages/Personal"));
const Settings = React.lazy(() => import("../pages/Settings"));

const ARSimulation = React.lazy(() => import("../pages/ARSimulation")); // 👈 new

const ARSimulationArrays = React.lazy(
  () => import("../pages/simulations/ARSimulationArrays"),
);
const ARSimulationLinkedList = React.lazy(
  () => import("../pages/simulations/ARSimulationLinkedList"),
);
const ARSimulationStack = React.lazy(
  () => import("../pages/simulations/ARSimulationStack"),
);
const ARSimulationQueue = React.lazy(
  () => import("../pages/simulations/ARSimulationQueue"),
);

const EduarRoutes = {
  path: "/",
  children: [
    { index: true, element: <Navigate to="/auth/login" replace /> },
    { path: "auth/login", element: <LogIn /> },
    { path: "auth/signup", element: <SignUp /> },
    { path: "home", element: <Home /> },
    { path: "modules", element: <Modules /> },
    { path: "arDetection", element: <ARDetection /> },
    { path: "ar-assessment", element: <AR /> },
    { path: "ar-simulation", element: <ARSimulation /> }, // 👈 new
    { path: "personal", element: <Personal /> },
    { path: "settings", element: <Settings /> },
    { path: "modules/:module/:page?", element: <ModuleWrapper /> },

    { path: "ar-simulation/arrays", element: <ARSimulationArrays /> },
    { path: "ar-simulation/linked-list", element: <ARSimulationLinkedList /> },
    { path: "ar-simulation/stack", element: <ARSimulationStack /> },
    { path: "ar-simulation/queue", element: <ARSimulationQueue /> },
  ],
};

export default EduarRoutes;
