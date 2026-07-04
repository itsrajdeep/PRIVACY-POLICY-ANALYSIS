import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Analyzer from './pages/Analyzer'
import Directory from './pages/Directory'
import CompanyDetail from './pages/CompanyDetail'
import Research from './pages/Research'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/directory/:name" element={<CompanyDetail />} />
        <Route path="/research" element={<Research />} />
      </Routes>
      <Footer />
    </>
  )
}
