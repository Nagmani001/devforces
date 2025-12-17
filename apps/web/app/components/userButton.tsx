export default function UserButton({ name }: {
  name: string
}) {
  return <div className="flex justify-center">
    <div className="flex flex-col justify-center bg-slate-400 rounded-full h-10 w-10">
      {name[0]}
    </div>
  </div>
}
