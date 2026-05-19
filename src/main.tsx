
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom' 
import { ToastContainer } from 'react-toastify'
import router from './routes'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <>
    <ToastContainer />
    <RouterProvider router={router} />
  </>
)