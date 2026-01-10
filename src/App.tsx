
import { Outlet } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'

import { Toaster } from 'react-hot-toast'
import Chatbot from '@components/Chatbot'

function App() {
  return (
    <>
      <Header />
      <Toaster position="top-center" reverseOrder={false} />
      <main className='min-h-[78vh]' >
        <Outlet />
      </main>
      <Chatbot />
      <Footer />
    </>
  )
}

export default App
