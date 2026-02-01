export default function UserButton({ name }: {
  name: string
}) {
  return <div className="flex justify-center">
    <div className="flex flex-col items-center justify-center bg-muted text-foreground font-medium rounded-full h-10 w-10">
      {name[0]}
    </div>
  </div>
}
