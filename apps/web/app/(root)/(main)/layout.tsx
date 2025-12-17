import NavBar from "@/app/components/navBar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>
    <NavBar />
    {children}
  </>
}
