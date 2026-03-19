import NavBarShell from "@/app/components/navBarShell";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NavBarShell>
      {children}
    </NavBarShell>
  );
}
