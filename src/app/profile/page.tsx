
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import type { Event, Registration } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UserCircle, Mail, CalendarCheck, Edit, Trash2, PlusSquare } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { events, getRegistrationsForUser, isLoading: eventsLoading, fetchEventById, getEventsCreatedByUser, deleteEvent } = useEvents();
  const { toast } = useToast();
  
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [registeredEventsDetails, setRegisteredEventsDetails] = useState<Event[]>([]);
  const [createdEventsDetails, setCreatedEventsDetails] = useState<Event[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const loadProfileData = async () => {
    if (currentUser && !authLoading) {
      setPageLoading(true);
      // Fetch registrations
      const regs = await getRegistrationsForUser(currentUser.id);
      setUserRegistrations(regs);
      
      const attendingEventDetailsPromise = Promise.all(
        regs.map(async (reg) => {
          let eventDetail = events.find(e => e.id === reg.eventId) || await fetchEventById(reg.eventId);
          return eventDetail;
        })
      );
      
      // Fetch created events
      const createdEventsPromise = getEventsCreatedByUser(currentUser.id);

      const [attendingEventResults, createdEventsResults] = await Promise.all([
          attendingEventDetailsPromise,
          createdEventsPromise
      ]);

      setRegisteredEventsDetails(attendingEventResults.filter(Boolean) as Event[]);
      setCreatedEventsDetails(createdEventsResults);
      
      setPageLoading(false);
    } else if (!currentUser && !authLoading) {
      setPageLoading(false);
    }
  };


  // Effect to redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    loadProfileData();
  }, [currentUser, events, authLoading]); // Re-run if currentUser, events list, or authLoading changes.


  const handleDeleteCreatedEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "Event Deleted",
        description: "Your event has been successfully deleted.",
      });
      // Refresh created events list
      if (currentUser) {
        const updatedCreatedEvents = await getEventsCreatedByUser(currentUser.id);
        setCreatedEventsDetails(updatedCreatedEvents);
      }
    } catch (error) {
      toast({
        title: "Error Deleting Event",
        description: (error as Error).message || "Could not delete the event.",
        variant: "destructive",
      });
    }
  };


  if (authLoading || pageLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><LoadingSpinner size={48} /></div>;
  }

  if (!isAuthenticated || !currentUser) {
    return <div className="text-center py-10">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-4">
            <UserCircle className="mx-auto h-24 w-24 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">{currentUser.name || 'User Profile'}</CardTitle>
          <CardDescription>Manage your account information and view your event registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-1"><UserCircle className="mr-2 h-5 w-5 text-primary" /> Name</h3>
              <p className="text-muted-foreground">{currentUser.name}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-1"><Mail className="mr-2 h-5 w-5 text-primary" /> Email</h3>
              <p className="text-muted-foreground">{currentUser.email}</p>
            </div>
             <div>
              <h3 className="text-lg font-semibold flex items-center mb-1">Role</h3>
              <p className="text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><PlusSquare className="mr-3 h-7 w-7 text-primary" /> My Created Events</CardTitle>
          <CardDescription>Events you have created. Manage or view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {createdEventsDetails.length > 0 ? (
            <ul className="space-y-4">
              {createdEventsDetails.map(event => (
                <li key={event.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      <h4 className="text-lg font-semibold text-primary">{event.title}</h4>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "PPP")} - {event.location}
                    </p>
                    <Badge variant={event.status === 'featured' ? 'default' : 'secondary'} className="capitalize text-xs mt-1">{event.status}</Badge>
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/events/${event.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}/edit`}><Edit className="mr-1 h-4 w-4"/>Edit</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4"/>Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your event "{event.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCreatedEvent(event.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-6">You haven't created any events yet. <Link href="/events/create" className="text-primary underline">Create one now!</Link></p>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><CalendarCheck className="mr-3 h-7 w-7 text-primary" /> Your Registered Events</CardTitle>
          <CardDescription>Events you have registered for. Manage your attendance or view event details.</CardDescription>
        </CardHeader>
        <CardContent>
          {registeredEventsDetails.length > 0 ? (
            <ul className="space-y-4">
              {registeredEventsDetails.map(event => (
                <li key={event.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      <h4 className="text-lg font-semibold text-primary">{event.title}</h4>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "PPP")} - {event.location}
                    </p>
                     <p className="text-xs text-muted-foreground mt-1">
                      Registered on: {format(new Date(userRegistrations.find(r => r.eventId === event.id)?.registrationDate || Date.now()), "PPPp")}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}`}>View Event</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-6">You haven't registered for any events yet. <Link href="/events" className="text-primary underline">Explore events now!</Link></p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
