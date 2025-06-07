
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import type { Event } from '@/lib/types';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { PlusCircle, Settings, ListFilter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { events, deleteEvent, isLoading: eventsLoading } = useEvents();
  const { toast } = useToast();

  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Event['status'] | 'all'>('all');

  // Effect to redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin');
      } else if (currentUser?.role !== 'admin') {
        toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
        router.replace('/');
      }
    }
  }, [authLoading, isAuthenticated, currentUser, router, toast]);

  useEffect(() => {
    let filtered = events;
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.id.includes(searchTerm) // Allow search by ID
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }
    // Sort by most recent first for admin view
    setAdminEvents(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [events, searchTerm, statusFilter]);


  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error Deleting Event",
        description: (error as Error).message || "Could not delete the event.",
        variant: "destructive",
      });
    }
  };

  const isLoading = authLoading || eventsLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><LoadingSpinner size={48} /></div>;
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <div className="text-center py-10">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center"><Settings className="mr-3 h-8 w-8 text-primary" /> Admin Dashboard</CardTitle>
              <CardDescription>Manage all events on the platform.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/events/create"><PlusCircle className="mr-2 h-4 w-4" /> Create New Event</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by title or ID..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Event['status'] | 'all')}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(['active', 'featured', 'cancelled', 'past'] as Event['status'][]).map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {adminEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminEvents.map(event => (
                <div key={event.id} className="relative">
                  <EventCard 
                    event={event} 
                    isAdminView={true}
                    onDelete={() => {/* Handled by AlertDialog below */}} 
                  />
                  <div className="absolute top-2 right-2 z-10 bg-background/80 p-1 rounded-md">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8 opacity-80 hover:opacity-100">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the event "{event.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No events match your criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Add Trash icon since EventCard was modified not to take onDelete
const Trash = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);
