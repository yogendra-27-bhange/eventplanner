
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventForm, type EventFormInputs } from '@/components/EventForm';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CreateEventPage() {
  const router = useRouter();
  const { addEvent } = useEvents();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/events/create');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (data: EventFormInputs) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to create an event.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newEvent = await addEvent({
        ...data,
        date: data.date.toISOString(), // Convert Date object to ISO string
      }, currentUser.id);
      toast({
        title: "Event Created",
        description: `"${newEvent.title}" has been successfully created.`,
      });
      router.push(`/events/${newEvent.id}`);
    } catch (error) {
      toast({
        title: "Error Creating Event",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><LoadingSpinner size={48} /></div>;
  }

  if (!isAuthenticated && !authLoading) { // Added !authLoading here to prevent brief flash of this message
     // This will be handled by redirect, but as a fallback:
    return <div className="text-center py-10">Please <Link href="/login?redirect=/events/create" className="underline">login</Link> to create an event.</div>;
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <PlusCircle size={32} />
          </div>
          <CardTitle className="text-3xl font-headline">Create a New Event</CardTitle>
          <CardDescription>Fill in the details below to share your event with the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}
