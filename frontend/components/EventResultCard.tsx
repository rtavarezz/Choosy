import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EventResultCardProps {
  event: {
    id: string;
    name: string;
    votes: number;
    percentage: number;
    image_url: string;
  };
  medal?: string;
}

export const EventResultCard: React.FC<EventResultCardProps> = ({ event, medal }) => (
  <Card className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-md border border-purple-100 dark:border-purple-800/30 hover:scale-[1.02] transition-all duration-200">
    <CardHeader className="flex flex-row items-center gap-4 p-0">
      <img
        src={event.image_url}
        alt={event.name}
        className="w-16 h-16 rounded-lg object-cover border-2 border-purple-200 dark:border-purple-700 shadow-sm"
      />
    </CardHeader>
    <CardContent className="flex-1 p-0">
      <CardTitle className="font-semibold text-gray-900 dark:text-white text-lg">{event.name}</CardTitle>
      <div className="text-purple-600 dark:text-purple-400 font-medium">
        {event.votes} votes ({event.percentage}%)
      </div>
    </CardContent>
    {medal && <span className="text-3xl ml-2">{medal}</span>}
  </Card>
);
