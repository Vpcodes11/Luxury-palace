import { Architecture } from './components/Architecture'
import { Enquiry } from './components/Enquiry'
import { Footer } from './components/Footer'
import { HeroSequence } from './components/HeroSequence'
import { InteriorExperience } from './components/InteriorExperience'
import { Introduction } from './components/Introduction'
import { Location } from './components/Location'
import { Navigation } from './components/Navigation'
import { SignatureSpaces } from './components/SignatureSpaces'

export default function App() {
  return (
    <>
      <Navigation />
      <main id="main">
        <HeroSequence />
        <Introduction />
        <Architecture />
        <InteriorExperience />
        <SignatureSpaces />
        <Location />
        <Enquiry />
      </main>
      <Footer />
    </>
  )
}
