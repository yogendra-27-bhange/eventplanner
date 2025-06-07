
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CalendarDays, MapPin, Users, AlertTriangle, CheckCircle, Edit, Ticket, MessageSquarePlus, MessagesSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Event } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FeedbackForm, type FeedbackFormInputs } from '@/components/FeedbackForm';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const { 
    fetchEventById, 
    registerForEvent, 
    isUserRegistered: checkUserRegistered, 
    isLoading: eventsLoading, 
    getEventById,
    submitFeedback,
    hasUserSubmittedFeedback
  } = useEvents();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userIsRegistered, setUserIsRegistered] = useState(false);
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (eventId) {
        const fetchedEvent = await fetchEventById(eventId);
        if (fetchedEvent) {
            setEvent(fetchedEvent);
        } else {
            const cachedEvent = getEventById(eventId);
            setEvent(cachedEvent || null); 
        }
      }
    };
    loadEvent();
  }, [eventId, fetchEventById, getEventById]);

  useEffect(() => {
    const checkInitialStates = async () => {
      if (event && currentUser && !authLoading && isAuthenticated) {
        const registered = await checkUserRegistered(event.id, currentUser.id);
        setUserIsRegistered(registered);

        const alreadySubmitted = await hasUserSubmittedFeedback(event.id, currentUser.id);
        setHasSubmittedFeedback(alreadySubmitted);
        
        if (event.status === 'past' && registered && !alreadySubmitted) {
          setCanLeaveFeedback(true);
        } else {
          setCanLeaveFeedback(false);
        }
      } else if (!isAuthenticated && !authLoading && event && event.status === 'past') {
        // User not logged in, can't leave feedback
        setCanLeaveFeedback(false);
      }
    };
    checkInitialStates();
  }, [event, currentUser, authLoading, isAuthenticated, checkUserRegistered, hasUserSubmittedFeedback]);

  const handleRegister = async () => {
    if (!isAuthenticated || !currentUser || !event) {
      toast({ title: "Login Required", description: "Please login to register for events.", variant: "default" });
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }
    setIsRegistering(true);
    try {
        const success = await registerForEvent(event.id, currentUser.id);
        if (success) {
        toast({ title: "Registration Successful!", description: `You are registered for ${event.title}.` });
        setUserIsRegistered(true);
        setEvent(prev => prev ? {...prev, registeredCount: prev.registeredCount + 1} : null);
        // Re-evaluate feedback possibility if event is past (though unlikely to register for past event)
        if (event.status === 'past' && !hasSubmittedFeedback) {
            setCanLeaveFeedback(true);
        }
        } else {
        toast({ title: "Registration Failed", description: "Could not register for the event. It might be full, already past, or an error occurred.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Registration Error", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsRegistering(false);
  };

  const handleFeedbackSubmit = async (data: FeedbackFormInputs) => {
    if (!currentUser || !event) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        eventId: event.id,
        userId: currentUser.id,
        rating: data.rating,
        comment: data.comment,
      });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setHasSubmittedFeedback(true);
      setCanLeaveFeedback(false);
      setShowFeedbackDialog(false);
    } catch (error) {
      toast({
        title: "Feedback Submission Failed",
        description: (error as Error).message || "Could not submit feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  
  const isLoadingPage = eventsLoading || authLoading || event === undefined;

  if (isLoadingPage) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><LoadingSpinner size={48} /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">The event you are looking for does not exist or may have been removed.</p>
        <Button asChild><Link href="/events">Back to Events</Link></Button>
      </div>
    );
  }

  const canRegisterForEvent = event.status === 'active' || event.status === 'featured';
  const isFull = event.maxRegistrants ? event.registeredCount >= event.maxRegistrants : false;

  return (
    <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden">
      <CardHeader className="p-0 relative">
        <Image
          src={event.imageUrl || `https://placehold.co/1200x500.png?text=${encodeURIComponent(event.title)}`}
          alt={event.title}
          width={1200}
          height={500}
          className="w-full h-64 md:h-96 object-cover"
          data-ai-hint="event theme"
          priority 
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <CardTitle className="font-headline text-4xl md:text-5xl text-white mb-2">{event.title}</CardTitle>
          <Badge variant={event.status === 'featured' ? 'default' : 'secondary'} className="capitalize text-sm">{event.status}</Badge>
        </div>
        {(currentUser?.role === 'admin' || currentUser?.id === event.createdBy) && (
          <Button asChild variant="outline" size="sm" className="absolute top-4 right-4 bg-background/80 hover:bg-background">
            <Link href={`/admin/events/${event.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Event</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-start space-x-3">
            <CalendarDays className="h-8 w-8 text-primary mt-1 shrink-0" />
            <div>
              <p className="font-semibold">Date & Time</p>
              <p className="text-muted-foreground">{format(new Date(event.date), "EEEE, MMMM d, yyyy")} at {event.time}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-8 w-8 text-primary mt-1 shrink-0" />
            <div>
              <p className="font-semibold">Location</p>
              <p className="text-muted-foreground">{event.location}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold font-headline mb-2 text-primary">About this Event</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Ticket className="h-8 w-8 text-primary shrink-0" />
                <div>
                    <p className="font-semibold">Category</p>
                    <p className="text-muted-foreground">{event.category}</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 text-primary shrink-0" />
                <div>
                    <p className="font-semibold">Registrations</p>
                    <p className="text-muted-foreground">
                    {event.registeredCount} {event.maxRegistrants ? `/ ${event.maxRegistrants} registered` : 'registered'}
                    </p>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 md:p-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
        {canRegisterForEvent ? (
          userIsRegistered ? (
            <Button variant="outline" disabled className="w-full sm:w-auto text-green-600 border-green-600">
              <CheckCircle className="mr-2 h-5 w-5" /> You are registered!
            </Button>
          ) : isFull ? (
            <Button variant="outline" disabled className="w-full sm:w-auto">
              <AlertTriangle className="mr-2 h-5 w-5" /> Event Full
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={isRegistering} className="w-full sm:w-auto">
              {isRegistering ? <LoadingSpinner size={20} className="mr-2" /> : <Ticket className="mr-2 h-5 w-5" />}
              Register for this Event
            </Button>
          )
        ) : (
          <p className="text-destructive font-semibold">
            Registrations are currently closed for this event (Status: {event.status}).
          </p>
        )}
        </div>
        
        <div className="mt-4 sm:mt-0">
        {event.status === 'past' && isAuthenticated && (
            hasSubmittedFeedback ? (
                <Button variant="outline" disabled className="w-full sm:w-auto">
                    <MessagesSquare className="mr-2 h-5 w-5" /> Feedback Submitted
                </Button>
            ) : canLeaveFeedback ? (
                <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                    <DialogTrigger asChild>
                        <Button variant="default" className="w-full sm:w-auto">
                            <MessageSquarePlus className="mr-2 h-5 w-5" /> Leave Feedback
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Leave Feedback for {event.title}</DialogTitle>
                        <DialogDescription>
                            Share your experience to help us and others.
                        </DialogDescription>
                        </DialogHeader>
                        <FeedbackForm 
                            onSubmit={handleFeedbackSubmit} 
                            isLoading={isSubmittingFeedback} 
                            eventId={event.id} 
                        />
                    </DialogContent>
                </Dialog>
            ) : userIsRegistered ? (
                 <p className="text-sm text-muted-foreground">You'll be able to leave feedback once the event has passed and if you were registered.</p>
            ) : (
                 <p className="text-sm text-muted-foreground">Only registered attendees can leave feedback for past events.</p>
            )
        )}
        </div>
      </CardFooter>
    </Card>
  );
}
