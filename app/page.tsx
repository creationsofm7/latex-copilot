import Image from "next/image";

import { auth } from "../app/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";
import SignInButton from "./components/signinbutton";
 


export default async function Home() {
  const TODOs = [
    "if i make changes on my own and then ask ai for help it wont keep track of the changes could be fixed by keeping track of those changes.",
    "don't let people make multiple requests at once.",
    "implement an actual text editor",
    "implement a diff based code editor",
    "on sending a request input should be cleared",
    "make the button work"
  ];

  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
})


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center sm:items-start">
        {session?.user ? (
        <div className="flex gap-2 items-center">
          <Image
            className="rounded-full"
            
            src={session?.user?.image || ""}
            alt="User Image"
            width={40}
            height={40}
          />
          <h1>{session.user.name}</h1>
        </div>
          ) : (
          <SignInButton />

        )}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
      </main>
      <ul>
        {TODOs.map((todo, index) => (
          <li key={index} className="flex gap-2 items-center">
            <input type="checkbox" />
            <h1>{todo}</h1>
          </li>
        ))}
      </ul>
      
    </div>
  );
}
