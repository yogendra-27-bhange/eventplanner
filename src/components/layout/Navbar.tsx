
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, PlusCircle, UserCircle, Settings, CalendarDays } from 'lucide-react';

export function Navbar() {
  const { isAuthenticated, currentUser, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold font-headline text-primary">
            Event Planner MVP
          </Link>
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold font-headline text-primary">
          Event Planner MVP
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/events">
              <CalendarDays className="mr-2 h-4 w-4" /> Events
            </Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/events/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                </Link>
              </Button>
              {currentUser?.role === 'admin' && (
                <Button variant="ghost" asChild>
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" /> Admin
                  </Link>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" /> Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  Register
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
