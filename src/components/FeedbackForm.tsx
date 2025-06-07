
"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from './LoadingSpinner';
import { Star } from 'lucide-react';

const feedbackSchema = z.object({
  rating: z.coerce.number().min(1, "Rating is required").max(5, "Rating cannot exceed 5"),
  comment: z.string().optional(),
});

export type FeedbackFormInputs = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormInputs) => Promise<void>;
  isLoading?: boolean;
  eventId: string;
}

export function FeedbackForm({ onSubmit, isLoading = false }: FeedbackFormProps) {
  const { control, register, handleSubmit, formState: { errors } } = useForm<FeedbackFormInputs>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: undefined, // Or a default like 3
      comment: '',
    },
  });

  const onFormSubmit: SubmitHandler<FeedbackFormInputs> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rating">Your Rating</Label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
              defaultValue={field.value?.toString()}
              className="flex space-x-2"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex items-center space-x-1">
                  <RadioGroupItem value={value.toString()} id={`rating-${value}`} />
                  <Label htmlFor={`rating-${value}`} className="flex">
                    {Array.from({ length: value }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - value }).map((_, i) => (
                      <Star key={i + value} className="h-5 w-5 text-yellow-400" />
                    ))}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comments (Optional)</Label>
        <Textarea id="comment" rows={4} {...register("comment")} placeholder="Tell us more about your experience..." />
        {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingSpinner size={20} /> : 'Submit Feedback'}
      </Button>
    </form>
  );
}
