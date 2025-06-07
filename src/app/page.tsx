
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8">
      <div className="relative w-full max-w-3xl h-64 md:h-96 rounded-lg overflow-hidden shadow-xl">
        <Image
          src="/images/homepage-banner.png" 
          alt="Community Event Banner" // Updated alt text
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-white mb-4">
            Welcome to Event Planner MVP
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Discover, create, and manage events with ease.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Explore Events</CardTitle>
            <CardDescription>Find exciting events happening near you or online.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Browse a diverse range of events, from music festivals to tech conferences and local workshops.
            </p>
            <Button asChild className="w-full">
              <Link href="/events">View Upcoming Events</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Host Your Own</CardTitle>
            <CardDescription>Create and manage your own events effortlessly.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our platform makes it simple to list your event, manage registrations, and reach your audience.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/events/create">Create an Event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl text-left p-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-headline mb-4 text-primary">Why Choose Us?</h2>
        <ul className="list-disc list-inside space-y-2 text-card-foreground">
          <li>User-friendly interface for seamless event management.</li>
          <li>Secure (mock) registration and login.</li>
          <li>Simple event creation with AI-powered (mock) content verification.</li>
          <li>Easy event discovery with search and filtering options.</li>
          <li>(Mock) Admin tools for comprehensive event oversight.</li>
        </ul>
      </div>
    </div>
  );
}
