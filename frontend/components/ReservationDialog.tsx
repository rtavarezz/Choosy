import * as React from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import PhoneInput from "react-phone-input-2/lib/lib";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationName: string;
  setReservationName: (name: string) => void;
  reservationPhone: string;
  setReservationPhone: (phone: string) => void;
  reservationGroupSize: string;
  setReservationGroupSize: (size: string) => void;
  nameError: string;
  phoneError: string;
  onSubmit: () => void;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  open,
  onOpenChange,
  reservationName,
  setReservationName,
  reservationPhone,
  setReservationPhone,
  reservationGroupSize,
  setReservationGroupSize,
  nameError,
  phoneError,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md w-full">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Make a Reservation</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={reservationName}
            onChange={e => setReservationName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Your name"
          />
          {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <PhoneInput
            country={'us'}
            value={reservationPhone}
            onChange={setReservationPhone}
            inputStyle={{ backgroundColor: '#ffffff', color: '#111827' }}
            containerClass="w-full"
          />
          {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
          <select
            value={reservationGroupSize}
            onChange={e => setReservationGroupSize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
          >
            <option value="myself">Myself</option>
            <option value="2">2 people</option>
            <option value="3+">3+ people</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <DialogClose asChild>
          <button
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </DialogClose>
        <button
          onClick={onSubmit}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:scale-105 transition-all duration-200"
        >
          Submit
        </button>
      </div>
    </DialogContent>
  </Dialog>
);
