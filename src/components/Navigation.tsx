"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, BarChart3, BookOpen, Settings, LogOut, User } from "lucide-react";

export default function Navigation() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white font-bold text-xl">
              Danbing
            </Link>
            
            {status === "authenticated" && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/decks"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Decks
                </Link>
                <Link
                  href="/analytics"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" && (
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-gray-700 rounded"></div>
              </div>
            )}
            
            {status === "authenticated" && session?.user && (
              <>
                <Link
                  href="/settings"
                  className="text-gray-300 hover:text-white p-2 rounded-md"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-3 text-gray-300 hover:text-white">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm font-medium">
                      {session.user.name || session.user.email}
                    </span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {status === "unauthenticated" && (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}