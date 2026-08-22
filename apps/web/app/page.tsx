import Faq from './components/faq';
import Footer from './components/footer';
import Hero from './components/hero';
import NavHero from './components/navHero'
import SectionBento from './components/section2';
import StackingSection from './components/stackCard/StackingSection';
import { getAuthSession } from './config/session';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getAuthSession();
  if (session) {
    redirect("/contests/1");
  }
  return (
    <div className="min-h-screen bg-background">
      <div className='h-3 bg-background'></div>
      <NavHero />
      <main className="">
        <Hero />
        <SectionBento />
        <StackingSection />
        <Faq />
        <Footer />
        <div className='h-1'></div>
      </main >
    </div >
  );
}
