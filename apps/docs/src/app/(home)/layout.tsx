export default function Layout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
