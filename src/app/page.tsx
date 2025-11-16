import { GiNautilusShell } from "react-icons/gi";

export default function Home() {
  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center flex-col">
        <GiNautilusShell size={72}/>
        <h1>Welcome to the Nautilus</h1>
      </div>
    </>
  );
}
