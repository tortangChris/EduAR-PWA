import React from "react";
import { Navigate } from "react-router-dom";
import IntroductionToAlgorithms from "../modules/IntroductionToAlgorithms";
import SearchingAlgorithms from "../modules/SearchingAlgorithms";
import SortingAlgorithms from "../modules/SortingAlgorithms";
import IntroductionToDataStructures from "../modules/IntroductionToDataStructures";
import AdvancedDataStructures from "../modules/AdvancedDataStructures";
import GraphAlgorithms from "../modules/GraphAlgorithms";
import DynamicProgramming from "../modules/DynamicProgramming";
import FinalAssessment from "../modules/FinalAssessment";
import LogIn from "../auth/LogIn";

const Home = React.lazy(() => import("../pages/Home"));
const Modules = React.lazy(() => import("../pages/Modules"));
const Notification = React.lazy(() => import("../pages/Notification"));
const Personal = React.lazy(() => import("../pages/Personal"));
const Settings = React.lazy(() => import("../pages/Settings"));

const EduarRoutes = {
  path: "/",
  children: [
    { index: true, element: <Navigate to="/auth/login" replace /> }, // <- Updated
    { path: "auth/login", element: <LogIn /> }, // <- Added
    { path: "home", element: <Home /> },
    { path: "modules", element: <Modules /> },
    { path: "notification", element: <Notification /> },
    { path: "personal", element: <Personal /> },
    { path: "settings", element: <Settings /> },
    {
      path: "modules/intro-to-algorithms",
      element: <IntroductionToAlgorithms />,
    },
    { path: "/modules/searching-algorithms", element: <SearchingAlgorithms /> },
    { path: "/modules/sorting-algorithms", element: <SortingAlgorithms /> },
    {
      path: "/modules/data-structures-intro",
      element: <IntroductionToDataStructures />,
    },
    {
      path: "/modules/advanced-data-structures",
      element: <AdvancedDataStructures />,
    },
    { path: "/modules/graph-algorithms", element: <GraphAlgorithms /> },
    { path: "/modules/dynamic-programming", element: <DynamicProgramming /> },
    { path: "/modules/final-assessment", element: <FinalAssessment /> },
  ],
};

export default EduarRoutes;
