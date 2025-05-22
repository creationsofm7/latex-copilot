import { TextProvider } from "./Context";

export default function Layout({
  children,
  Compiler,
  Chat,
}: {
  children: React.ReactNode;
  Compiler: React.ReactNode;
  Chat: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <nav className="fixed top-0 left-0 right-0 bg-background border-b border-foreground/10 z-50">
          {children}
        </nav>
        <div className="pt-16 p-2 h-[calc(100vh-1rem)]">
          <TextProvider>
            <div className="grid grid-cols-3 w-full h-full gap-4">
              <div className="col-span-2 h-full">{Compiler}</div>
              <div className="col-span-1 h-full">{Chat}</div>
            </div>
          </TextProvider>
        </div>
      </div>
    </>
  );
}
