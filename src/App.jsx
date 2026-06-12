import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar       from './components/Navbar'
import Hero         from './components/Hero'
import Services     from './components/Services'
import WeeklyPromos from './components/WeeklyPromos'
import Destinations from './components/Destinations'
import AboutUs      from './components/AboutUs'
import Testimonials from './components/Testimonials'
import WhatsAppCTA  from './components/WhatsAppCTA'
import FAQ          from './components/FAQ'
import Footer       from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import CookieBanner  from './components/CookieBanner'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse    from './pages/TermsOfUse'
import CRM           from './pages/CRM'
import FunilEuropa   from './pages/FunilEuropa'

function HomePage() {
  return (
    <div className="bg-base text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WeeklyPromos />
        <Destinations />
        <AboutUs />
        <Testimonials />
        <WhatsAppCTA />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppFloat />
      <CookieBanner />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                        element={<HomePage />}      />
        <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
        <Route path="/termos-de-uso"           element={<TermsOfUse />}    />
        <Route path="/crm"                     element={<CRM />}           />
        <Route path="/funil-europa"            element={<FunilEuropa />}   />
      </Routes>
    </BrowserRouter>
  )
}
