import BentoGrid from "./bentoGrid";

export default function SectionBento() {
  return (
    <div className='py-12 text-gray-800 '>
      <div className='mb-12 flex flex-col items-center'>
        <h2 className='text-5xl font-semibold tracking-tight text-gray-800 '>Built from Student's Persepective </h2>
        <h4 className='pt-5 font-normal text-base tracking-tight text-gray-500' >This is Codeforces for Developers, Practice real-world development by solving and creating challenges</h4>
      </div>
      <BentoGrid />
    </div>
  )
}
