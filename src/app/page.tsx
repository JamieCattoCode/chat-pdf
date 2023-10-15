import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button'
import { UserButton, auth } from '@clerk/nextjs'
import { LogIn } from 'lucide-react';
import Image from 'next/image'
import Link from 'next/link';

export default async function Home() {
  const bgTheme = "bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600";

  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div className={`w-screen min-h-screen ${bgTheme}`}>
      <div // This div places itself in the center, meaning everything within it will be centred.
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="text-5xl text-gray-800 font-semibold mr-3">Chat with any PDF</h1>
            <UserButton afterSignOutUrl="/" />
          </div>

          <div className="flex mt-2">
            {isAuth && <Button>Go to Chats</Button>}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-700">
            Join millions of students, researchers, and professionals to instantly 
            answer questions and understand research with AI
          </p>

          <div className="w-full mt-4">
            {isAuth ? <FileUpload /> : (
              <Link href="/sign-up">
                <Button>
                  Log in
                  <LogIn className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
            {/* Can add an image of the app working to this div */}
          </div>

        </div>
      </div>
    </div>
  )
}
