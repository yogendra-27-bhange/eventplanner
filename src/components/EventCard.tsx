
"use client";

import type { Event } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Ticket, Edit, Trash2, Star, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface EventCardProps {
  event: Event;
  onDelete?: (eventId: string) => void;
  isAdminView?: boolean;
}

export function EventCard({ event, onDelete, isAdminView = false }: EventCardProps) {
  const { currentUser } = useAuth();
  const canManage = currentUser?.role === 'admin' || currentUser?.id === event.createdBy;

  const getStatusBadgeVariant = (status: Event["status"]) => {
    switch (status) {
      case 'featured': return 'default';
      case 'cancelled': return 'destructive';
      case 'past': return 'secondary';
      default: return 'outline';
    }
  };
  
  const getStatusIcon = (status: Event["status"]) => {
    switch (status) {
      case 'featured': return <Star className="h-3 w-3 mr-1" />;
      case 'cancelled': return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };


  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader className="p-0 relative">
        <Image
          src={event.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(event.title)}`}
          alt={event.title}
          width={600}
          height={300}
          className="w-full h-48 object-cover"
          data-ai-hint="event category"
        />
        {event.status !== 'active' && (
          <Badge variant={getStatusBadgeVariant(event.status)} className="absolute top-2 right-2 capitalize flex items-center">
            {getStatusIcon(event.status)}
            {event.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <Link href={`/events/${event.id}`}>
          <CardTitle className="font-headline text-2xl mb-2 hover:text-primary transition-colors">{event.title}</CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground mb-1 flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 shrink-0" /> {format(new Date(event.date), "PPP")} at {event.time}
        </CardDescription>
        <CardDescription className="text-sm text-muted-foreground mb-3 flex items-center">
          <MapPin className="h-4 w-4 mr-2 shrink-0" /> {event.location}
        </CardDescription>
        <p className="text-sm mb-4 line-clamp-3">{event.description}</p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
           <Badge variant="secondary">{event.category}</Badge>
        </div>
        {(event.maxRegistrants || event.registeredCount > 0) && (
            <div className="text-sm text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                {event.registeredCount} / {event.maxRegistrants ? event.maxRegistrants : '∞'} registered
            </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0 border-t mt-auto">
        <div className="flex w-full justify-between items-center">
          <Button asChild size="sm">
            <Link href={`/events/${event.id}`}>
              <Ticket className="mr-2 h-4 w-4" /> View Details
            </Link>
          </Button>
          {isAdminView && canManage && onDelete && (
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/events/${event.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(event.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
