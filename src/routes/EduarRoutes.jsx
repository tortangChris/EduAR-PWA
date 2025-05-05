import React from 'react';
import { Navigate } from 'react-router-dom';

const Home = React.lazy(() => import('../pages/Home'));
const Modules = React.lazy(() => import('../pages/Modules'));
const Notification = React.lazy(() => import('../pages/Notification'));
const Personal = React.lazy(() => import('../pages/Personal'));

const EduarRoutes = {
  path: '/',
  children: [
    { index: true, element: <Navigate to="/home" replace /> }, 
    { path: 'home', element: <Home /> },
    { path: 'modules', element: <Modules /> },
    { path: 'notification', element: <Notification /> },
    { path: 'personal', element: <Personal /> },
  ],
};

export default EduarRoutes;
