import React from "react";
import { Navigate } from "react-router-dom";
import LogIn from "../auth/LogIn";
import SignUp from "../auth/SignUp";
import Arrays from "../modules/Arrays";
import LinkedList from "../modules/LinkedList";
import Queue from "../modules/Queue";
import Trees from "../modules/Trees";
import SetDataStructure from "../modules/SetDataStructure";
import GraphDataStructure from "../modules/GraphDataStructure";
import MapDataStructure from "../modules/MapDataStructure";
import HashTable from "../modules/HashTable";
import Stack from "../modules/Stack";
import WeekArray from "../components/Arrays/WeekArray";
import Sorting from "../modules/Sorting";
import Visualize3d from "../components/Sorting/Visualize3d";
import VisualLinkList from "../components/Linked List/VisualLinkList";

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
    {
      path: "modules/arrays/3dMode",
      element: <WeekArray />,
    },
    {
      path: "modules/sorting/3dVisualSorting",
      element: <Visualize3d />,
    },
    {
      path: "modules/sorting/3dVisualLinkedList",
      element: <VisualLinkList />,
    },
    {
      path: "modules/sorting",
      element: <Sorting />,
    },
    {
      path: "modules/linked-list",
      element: <LinkedList />,
    },
    {
      path: "modules/stack",
      element: <Stack />,
    },
    {
      path: "modules/queue",
      element: <Queue />,
    },
    {
      path: "modules/trees",
      element: <Trees />,
    },
    {
      path: "modules/set-data-structure",
      element: <SetDataStructure />,
    },
    {
      path: "modules/graph-data-structure",
      element: <GraphDataStructure />,
    },
    {
      path: "modules/map-data-structure",
      element: <MapDataStructure />,
    },
    {
      path: "modules/hash-table",
      element: <HashTable />,
    },
  ],
};

export default EduarRoutes;
