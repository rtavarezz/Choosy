import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface WinnerCardProps {
  event: {
    id: string;
    name: string;
    votes: number;
    image_url: string;
    hours: string;
    contact: { phone: string };
  };
  onCall: (phone: string) => void;
  onReserve: () => void;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ event, onCall, onReserve }) => (
  <Card className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 w-full">
    <CardHeader className="flex flex-col md:flex-row items-center gap-6">
      <img
        src={event.image_url}
        alt={event.name}
        className="w-full md:w-32 h-32 rounded-xl object-cover shadow-lg"
      />
      <div className="flex-1 text-center md:text-left">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{event.name}</CardTitle>
        <div className="text-gray-600 dark:text-gray-300 mb-1">{event.hours}</div>
        <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{event.votes} votes</div>
        <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
          <span className="text-lg">📞</span>
          <span className="text-gray-700 dark:text-gray-300">{event.contact.phone}</span>
        </div>
      </div>
    </CardHeader>
    <CardFooter className="flex flex-col sm:flex-row gap-4 mt-6">
      <button
        onClick={() => onCall(event.contact.phone)}
        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        <span className="text-lg">📞</span>
        <span>Call Now</span>
      </button>
      <button
        onClick={onReserve}
        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        <span className="text-lg">📅</span>
        <span>Reserve</span>
      </button>
    </CardFooter>
  </Card>
);
