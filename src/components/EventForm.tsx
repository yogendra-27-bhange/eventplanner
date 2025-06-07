
"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import type { Event, EventStatus } from '@/lib/types';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { LoadingSpinner } from './LoadingSpinner';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { generateEventDescription } from '@/ai/flows/generate-event-description-flow';
import { generateEventImage } from '@/ai/flows/generate-event-image-flow';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  maxRegistrants: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  imageUrl: z.string().optional().or(z.literal("")), // Accepts URL or data URI
  status: z.enum(['active', 'cancelled', 'featured', 'past']).optional(), // For admin edit
});

export type EventFormInputs = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: EventFormInputs) => Promise<void>;
  initialData?: Event;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function EventForm({ onSubmit, initialData, isLoading = false, isAdmin = false }: EventFormProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false); // Mock verification
  const [descriptionVerified, setDescriptionVerified] = useState(!!initialData); // Assume verified if editing
  const [previewImageUrl, setPreviewImageUrl] = useState(initialData?.imageUrl || '');
  const [isSuggestingDescription, setIsSuggestingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<EventFormInputs>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: new Date(initialData.date),
      maxRegistrants: initialData.maxRegistrants || undefined,
      imageUrl: initialData.imageUrl || '',
    } : {
      date: undefined,
      time: '10:00 AM',
      category: EVENT_CATEGORIES[0],
      status: 'active',
      imageUrl: '',
    },
  });

  const watchedImageUrl = watch("imageUrl");
  useEffect(() => {
    if (watchedImageUrl && (watchedImageUrl.startsWith('http') || watchedImageUrl.startsWith('data:image'))) {
      setPreviewImageUrl(watchedImageUrl);
    } else {
      setPreviewImageUrl(''); // Clear preview if URL is invalid or empty
    }
  }, [watchedImageUrl]);

  const handleMockDescriptionVerification = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDescriptionVerified(true);
    setIsVerifying(false);
    toast({
      title: "Content Verified (Mock)",
      description: "Description meets community guidelines.",
    });
  };

  const handleSuggestDescription = async () => {
    const title = getValues("title");
    const category = getValues("category");

    if (!title || !category) {
      toast({
        title: "Title and Category Required",
        description: "Please fill in the event title and category before suggesting a description.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestingDescription(true);
    try {
      const result = await generateEventDescription({ title, category });
      if (result.suggestedDescription) {
        setValue("description", result.suggestedDescription, { shouldValidate: true });
        toast({
          title: "Description Suggested",
          description: "AI has generated a description for your event.",
        });
      } else {
        throw new Error("AI did not return a description.");
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast({
        title: "Suggestion Failed",
        description: (error as Error).message || "Could not generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingDescription(false);
    }
  };

  const handleGenerateImage = async () => {
    const title = getValues("title");
    const category = getValues("category");

    if (!title || !category) {
      toast({
        title: "Title and Category Required",
        description: "Please fill in the event title and category before generating an image.",
        variant: "destructive",
      });
      return;
    }
    
    // Simple prompt, can be made more sophisticated
    const prompt = `Generate a visually appealing and theme-appropriate image for an event titled "${title}" which is in the category "${category}". The image should be suitable for an event poster or banner.`;

    setIsGeneratingImage(true);
    try {
      const result = await generateEventImage({ prompt });
      if (result.imageDataUri) {
        setValue("imageUrl", result.imageDataUri, { shouldValidate: true });
        toast({
          title: "Image Generated",
          description: "AI has generated an image for your event.",
        });
      } else {
        throw new Error("AI did not return an image.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Image Generation Failed",
        description: (error as Error).message || "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };


  const onFormSubmit: SubmitHandler<EventFormInputs> = async (data) => {
    if (!descriptionVerified && !initialData) { // Only enforce mock verification for new events if not editing
      toast({
        title: "Verification Required",
        description: "Please run the mock content verification for the event description before submitting.",
        variant: "destructive",
      });
      return;
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => <DatePicker date={field.value} setDate={field.onChange} />}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="text" placeholder="e.g., 7:00 PM" {...register("time")} />
          {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="e.g., Central Park or Online" {...register("location")} />
        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="description">Description</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleSuggestDescription} disabled={isSuggestingDescription || isGeneratingImage}>
            {isSuggestingDescription ? <LoadingSpinner size={16} className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest with AI
          </Button>
        </div>
        <Textarea id="description" rows={5} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        
        {!initialData && ( // Only show mock verification for new events
            <div className="mt-2">
            <Button type="button" variant="outline" onClick={handleMockDescriptionVerification} disabled={isVerifying || descriptionVerified || isGeneratingImage}>
                {isVerifying ? <LoadingSpinner size={16} className="mr-2" /> : null}
                {descriptionVerified ? "Content Verified (Mock)" : "Verify Content (Mock AI)"}
            </Button>
            {!descriptionVerified && <p className="text-xs text-muted-foreground mt-1">Please (mock) verify the description content.</p>}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="imageUrl">Image URL or Generate</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateImage} disabled={isGeneratingImage || isSuggestingDescription}>
                    {isGeneratingImage ? <LoadingSpinner size={16} className="mr-2" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    Generate with AI
                </Button>
            </div>
          <Input id="imageUrl" type="text" placeholder="https://example.com/image.png or generate one" {...register("imageUrl")} />
          {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
          {previewImageUrl && (
            <div className="mt-2 rounded-md overflow-hidden border aspect-video relative w-full max-w-xs">
              <Image src={previewImageUrl} alt="Event image preview" layout="fill" objectFit="cover" data-ai-hint="event poster"/>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxRegistrants">Max Registrants (Optional)</Label>
          <Input id="maxRegistrants" type="number" placeholder="e.g., 100" {...register("maxRegistrants")} />
          {errors.maxRegistrants && <p className="text-sm text-destructive">{errors.maxRegistrants.message}</p>}
        </div>
      </div>

      {isAdmin && initialData && (
        <div className="space-y-2">
          <Label htmlFor="status">Event Status</Label>
           <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(['active', 'cancelled', 'featured', 'past'] as EventStatus[]).map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
        </div>
      )}

      <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isVerifying || isSuggestingDescription || isGeneratingImage}>
        {isLoading ? <LoadingSpinner size={20} /> : (initialData ? 'Update Event' : 'Create Event')}
      </Button>
    </form>
  );
}
