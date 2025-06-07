
"use client";

import { useState, useMemo, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { useEvents } from '@/contexts/EventContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/DatePicker';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Event } from '@/lib/types';
import { Search, Filter, XSquare } from 'lucide-react';

const ALL_CATEGORIES_SELECT_VALUE = "__all_categories__";

export default function EventsPage() {
  const { events, isLoading: eventsLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  const [clientLoaded, setClientLoaded] = useState(false);
  useEffect(() => {
    setClientLoaded(true);
  }, []);


  const filteredEvents = useMemo(() => {
    if (!clientLoaded) return []; // Don't filter until client is loaded to avoid hydration issues with dates
    return events
      .filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? event.category === selectedCategory : true;
        const matchesDate = selectedDate ? new Date(event.date).toDateString() === selectedDate.toDateString() : true;
        
        // Show only active, featured, or not yet past events on this page
        const isRelevantStatus = event.status === 'active' || event.status === 'featured' || (event.status !== 'past' && event.status !== 'cancelled');
        
        return matchesSearch && matchesCategory && matchesDate && isRelevantStatus;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by upcoming date
  }, [events, searchTerm, selectedCategory, selectedDate, clientLoaded]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(undefined);
    setSelectedDate(undefined);
  };

  if (eventsLoading || !clientLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-bold font-headline text-primary mb-2">Discover Upcoming Events</h1>
        <p className="text-lg text-muted-foreground">Find your next adventure from our curated list of events.</p>
      </section>

      <div className="p-6 bg-card rounded-lg shadow-md space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="mr-2 h-4 w-4" /> {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {(searchTerm || selectedCategory || selectedDate) && (
            <Button onClick={clearFilters} variant="ghost" className="text-destructive hover:text-destructive">
              <XSquare className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => {
                  if (value === ALL_CATEGORIES_SELECT_VALUE) {
                    setSelectedCategory(undefined);
                  } else {
                    setSelectedCategory(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES_SELECT_VALUE}>All Categories</SelectItem>
                  {EVENT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full" />
            </div>
          </div>
        )}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: Event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Events Found</h2>
          <p className="text-muted-foreground">Try adjusting your search or filters, or check back later for new events.</p>
        </div>
      )}
    </div>
  );
}
