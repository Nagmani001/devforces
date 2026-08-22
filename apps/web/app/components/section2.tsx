import BentoGrid from "./bentoGrid";

export default function SectionBento() {
  return (
    <div className='py-12 text-foreground'>
      <div className='mb-12 flex flex-col items-center px-4'>
        <h2 className='text-3xl md:text-5xl font-semibold tracking-tight text-foreground text-center'>Built from Student's Persepective </h2>
        <h4 className='pt-5 font-normal text-base tracking-tight text-muted-foreground text-center max-w-xl'>This is Codeforces for Developers, Practice real-world development by solving and creating challenges</h4>
      </div>
      <BentoGrid />
    </div>
  )
}
