import { Suspense, useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import EduarRoutes from './EduarRoutes'
import LinearIndeterminate from '../components/LinearIndeterminate'

const Routes = () => {
  const router = useMemo(() => createBrowserRouter([EduarRoutes]), []) // ✅ Added return and deps

  return (
    <Suspense fallback={<LinearIndeterminate />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default Routes
