import NavBar from './components/navBar';
import SecondaryHero from './components/secondaryHero';
import Hero from './components/hero';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <Hero />
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <SecondaryHero title="Lightning Fast" description="Experience blazing fast performance that keeps you ahead of the competition." type="ZAP" />
          <SecondaryHero title="Secure & Reliable" description="Your data is protected with enterprise-grade security measures." type="SHIELD" />
          <SecondaryHero title="Built for Teams" description="Collaborate seamlessly with your team members in real-time." type="USERS" />
        </div>
      </main >
    </div >
  );
}
