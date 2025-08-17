import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    description: string;
    image: string;
    venue: string;
    address: string;
    price: string;
    external_url: string;
    source_type: string;
    reviews?: { count: number; stars: number };
    topic: string;
    contact?: { phone: string };
  };
  children?: React.ReactNode;
}

export const EventCard: React.FC<EventCardProps> = ({ event, children }) => {
  return (
    <Card className="w-full max-w-sm h-96 flex flex-col justify-between shadow-xl bg-white/90 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="truncate text-lg font-bold">{event.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            priority
          />
        </div>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">{event.description}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{event.venue} &bull; {event.address}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{event.price}</div>
        {event.reviews && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400">
            ⭐ {event.reviews.stars} ({event.reviews.count} reviews)
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <a
          href={event.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
        >
          More Info
        </a>
        {children}
      </CardFooter>
    </Card>
  );
};
