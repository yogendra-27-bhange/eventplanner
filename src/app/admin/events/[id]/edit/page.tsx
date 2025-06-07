
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventForm, type EventFormInputs } from '@/components/EventForm';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Edit } from 'lucide-react';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { fetchEventById, updateEvent, isLoading: eventsLoading } = useEvents();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null | undefined>(undefined); // undefined for loading, null for not found
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | undefined>(undefined); // undefined for loading auth state

  useEffect(() => {
    const authorizeAndLoadEvent = async () => {
      if (authLoading || !eventId) return;

      if (!isAuthenticated) {
        router.replace(`/login?redirect=/admin/events/${eventId}/edit`);
        setIsAuthorized(false);
        return;
      }

      const fetchedEvent = await fetchEventById(eventId);
      setEvent(fetchedEvent || null); // Set to null if not found

      if (!fetchedEvent) {
        toast({ title: "Event Not Found", variant: "destructive" });
        setIsAuthorized(false);
        router.replace(currentUser?.role === 'admin' ? '/admin' : '/');
        return;
      }

      const canEdit = currentUser?.role === 'admin' || fetchedEvent.createdBy === currentUser?.id;
      if (!canEdit) {
        toast({ title: "Access Denied", description: "You do not have permission to edit this event.", variant: "destructive" });
        setIsAuthorized(false);
        router.replace('/');
        return;
      }
      setIsAuthorized(true);
    };

    authorizeAndLoadEvent();
  }, [eventId, authLoading, isAuthenticated, currentUser, fetchEventById, router, toast]);


  const handleSubmit = async (data: EventFormInputs) => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      const updatedEventData: Event = {
        ...event,
        ...data,
        date: data.date.toISOString(),
        maxRegistrants: data.maxRegistrants === undefined || data.maxRegistrants === null ? undefined : Number(data.maxRegistrants),
        // Status can only be changed by admin, EventForm handles showing the field based on isAdmin prop
        status: currentUser?.role === 'admin' ? (data.status || event.status) : event.status, 
      };
      await updateEvent(updatedEventData);
      toast({
        title: "Event Updated",
        description: `"${updatedEventData.title}" has been successfully updated.`,
      });
      // Redirect to admin page if admin, otherwise to profile or event page
      router.push(currentUser?.role === 'admin' ? `/admin` : `/profile`); 
    } catch (error) {
      toast({
        title: "Error Updating Event",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoadingPage = authLoading || eventsLoading || event === undefined || isAuthorized === undefined;

  if (isLoadingPage) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><LoadingSpinner size={48} /></div>;
  }

  if (!isAuthorized || !event) {
     // This case should ideally be handled by the redirect in useEffect,
     // but as a fallback:
    return <div className="text-center py-10">Event not found or you do not have permission to edit this event.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Edit size={32} />
          </div>
          <CardTitle className="text-3xl font-headline">Edit Event</CardTitle>
          <CardDescription>Update the details for "{event.title}".</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm 
            onSubmit={handleSubmit} 
            initialData={event} 
            isLoading={isSubmitting} 
            isAdmin={currentUser?.role === 'admin'} // Pass admin role to show/hide status field
          />
        </CardContent>
      </Card>
    </div>
  );
}
