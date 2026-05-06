"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Ticket, Users, AlertCircle, Tag, Calendar } from "lucide-react";
import Button from "@/app/components/Button";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setBookingEvent,
  setQuantity,
  setSeatType,
  setEventCategory,
  setAttendanceDate,
  selectCurrentBooking,
  closeDrawer,
} from "../../../store/eventBookingSlice";

const BookTicketDrawer = ({ event, onClose }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentBooking = useSelector(selectCurrentBooking);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [selectedSeatType, setSelectedSeatType] = useState(null);
  const [selectedEventCategory, setSelectedEventCategory] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // ISO string for the chosen attendance day

  // Compute the list of event days between startDate and endDate (inclusive).
  // Days are normalized to UTC midnight so the ISO string represents the same
  // calendar day on both the client and the server regardless of timezone.
  const eventDays = useMemo(() => {
    if (!event?.startDate) return [];
    const toUtcDayStart = (d) => {
      const date = new Date(d);
      return new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0,
          0
        )
      );
    };

    const start = toUtcDayStart(event.startDate);
    const end = event.endDate
      ? toUtcDayStart(event.endDate)
      : toUtcDayStart(event.startDate);

    const days = [];
    const cursor = new Date(start);
    // Safety cap at 60 days to avoid runaway loops
    let guard = 0;
    while (cursor.getTime() <= end.getTime() && guard < 60) {
      days.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      guard += 1;
    }
    return days;
  }, [event?.startDate, event?.endDate]);

  const isMultiDay = eventDays.length > 1;

  useEffect(() => {
    if (event) {
      setTimeout(() => setIsVisible(true), 10);
      dispatch(setBookingEvent(event));

      // Auto-select the single participation type category
      const category =
        event.eventCategories && event.eventCategories.length > 0
          ? event.eventCategories[0]
          : null;
      if (category) {
        setSelectedEventCategory(category);
        dispatch(setEventCategory(category));
      }

      // Default attendance day = event start date (first day), normalized to UTC
      if (event.startDate) {
        const d = new Date(event.startDate);
        const firstDay = new Date(
          Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );
        const iso = firstDay.toISOString();
        setSelectedDay(iso);
        dispatch(setAttendanceDate(iso));
      }

      // Set default seat type
      if (event.seatTypes && event.seatTypes.length > 0) {
        setSelectedSeatType(event.seatTypes[0]);
        dispatch(
          setSeatType({
            seatType: event.seatTypes[0].name,
            price: event.seatTypes[0].price,
          }),
        );
      } else {
        setSelectedSeatType({
          name: "Standard",
          price: event.ticketPrice,
          availableSeats: event.availableSeats,
        });
      }
    }
  }, [event, dispatch]);

  if (!event) return null;

  const handleClose = () => {
    setIsVisible(false);
    dispatch(closeDrawer());
    setTimeout(onClose, 300);
  };

  const handleSeatCountChange = (count) => {
    if (
      selectedSeatType &&
      count <= selectedSeatType.availableSeats &&
      count <= event.maxTicketsPerPerson
    ) {
      setSelectedSeats(count);
      dispatch(setQuantity(count));
    }
  };

  const handleSeatTypeChange = (seatType) => {
    setSelectedSeatType(seatType);
    dispatch(setSeatType({ seatType: seatType.name, price: seatType.price }));

    // Reset quantity if exceeds available
    if (selectedSeats > seatType.availableSeats) {
      setSelectedSeats(Math.min(selectedSeats, seatType.availableSeats));
      dispatch(setQuantity(Math.min(selectedSeats, seatType.availableSeats)));
    }
  };

  const handleEventCategoryChange = (category) => {
    setSelectedEventCategory(category);
    dispatch(setEventCategory(category));
  };

  const handleDayChange = (isoDate) => {
    setSelectedDay(isoDate);
    dispatch(setAttendanceDate(isoDate));
  };

  const handleProceedToCheckout = () => {
    // Store booking details in localStorage for checkout page
    const bookingDetails = {
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.startDate,
      eventEndDate: event.endDate || event.startDate,
      attendanceDate: selectedDay || event.startDate,
      eventTime: event.startTime,
      venue: event.location?.venueName,
      quantity: selectedSeats,
      seatType: selectedSeatType?.name || "Standard",
      eventCategory: selectedEventCategory,
      unitPrice: selectedSeatType?.price || event.ticketPrice,
      totalAmount: currentBooking.totalAmount,
      bookingFee: currentBooking.bookingFee,
      taxAmount: currentBooking.taxAmount,
      finalAmount: currentBooking.finalAmount,
      posterImage: event.posterImage,
    };

    localStorage.setItem("pendingEventBooking", JSON.stringify(bookingDetails));
    router.push(`/events/checkout?eventId=${event._id}`);
  };

  // Get seat types or create default
  const seatTypes =
    event.seatTypes && event.seatTypes.length > 0
      ? event.seatTypes
      : [
          {
            name: "Standard",
            price: event.ticketPrice,
            availableSeats: event.availableSeats,
            totalSeats: event.totalSeats,
          },
        ];

  // Get single event category (participation type)
  const eventCategory =
    event.eventCategories && event.eventCategories.length > 0
      ? event.eventCategories[0]
      : null;

  const maxTickets = Math.min(
    event.maxTicketsPerPerson || 10,
    selectedSeatType?.availableSeats || event.availableSeats,
  );

  const isEventAvailable =
    event.availableSeats > 0 && ["upcoming", "ongoing"].includes(event.status);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[450px]
                bg-gradient-to-b from-[#0a0a29] to-[#0B1730] rounded-l-3xl shadow-2xl z-50 
                transform transition-transform duration-300 flex flex-col
                ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700/50">
          <div>
            <h2 className="text-xl font-bold text-white">
              {eventCategory ? `Book ${eventCategory}` : "Book Ticket"}
            </h2>
            <p className="text-gray-400 text-sm mt-1 line-clamp-1">
              {event.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!isEventAvailable ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Sold Out
              </h3>
              <p className="text-gray-400">
                This event is no longer available for booking.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Ticket Quantity */}
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-pink-400" />
                  <label className="text-white font-medium">
                    How many {eventCategory ? `${eventCategory}s` : "tickets"}?
                  </label>
                  <span className="text-gray-400 text-sm ml-auto">
                    Max {maxTickets}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {[...Array(Math.min(10, maxTickets))].map((_, i) => {
                    const count = i + 1;
                    return (
                      <button
                        key={count}
                        onClick={() => handleSeatCountChange(count)}
                        disabled={count > maxTickets}
                        className={`w-10 cursor-pointer h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                          selectedSeats === count
                            ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-110"
                            : count > maxTickets
                              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                              : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Selector - only shown for multi-day events */}
              {isMultiDay && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-pink-400" />
                    <label className="text-white font-medium">
                      Which day are you attending?
                    </label>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    This event runs across {eventDays.length} days. Pick the day you want to attend.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eventDays.map((day, idx) => {
                      const iso = day.toISOString();
                      const isSelected = selectedDay === iso;
                      const weekday = day.toLocaleDateString("en-IN", {
                        weekday: "short",
                        timeZone: "UTC",
                      });
                      const dayNum = day.getUTCDate();
                      const month = day.toLocaleDateString("en-IN", {
                        month: "short",
                        timeZone: "UTC",
                      });
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => handleDayChange(iso)}
                          className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500 text-white"
                              : "bg-white/5 border-transparent text-gray-300 hover:border-pink-500/50"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider text-gray-400">
                            Day {idx + 1}
                          </div>
                          <div className="text-lg font-bold leading-none mt-1">
                            {dayNum}
                          </div>
                          <div className="text-xs mt-1">{month}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {weekday}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seat Types */}
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-pink-400" />
                  <label className="text-white font-medium">
                    Select {eventCategory ? `${eventCategory} Type` : "Ticket Type"}
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {seatTypes.map((seat) => (
                    <div
                      key={seat.name}
                      onClick={() =>
                        seat.availableSeats > 0 && handleSeatTypeChange(seat)
                      }
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        selectedSeatType?.name === seat.name
                          ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500"
                          : seat.availableSeats > 0
                            ? "bg-white/5 border-transparent hover:border-pink-500/50"
                            : "bg-gray-700/30 border-transparent cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">
                            {seat.name}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {seat.availableSeats} seats available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-pink-400">
                            ₹{seat.price}
                          </p>
                          <p className="text-gray-500 text-xs">per ticket</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Category - Display only (auto-selected) */}
              {eventCategory && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-pink-400" />
                    <label className="text-white font-medium">Participation Type</label>
                  </div>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-2 border-pink-500 rounded-xl p-3">
                    <div className="w-4 h-4 rounded-full border-2 border-pink-500 bg-pink-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <p className="font-medium text-white text-sm">{eventCategory}</p>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 rounded-2xl p-4 border border-pink-500/30">
                <h3 className="text-white font-semibold mb-3">Price Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>
                      {selectedSeats} x {selectedSeatType?.name || "Standard"}{" "}
                      Ticket
                    </span>
                    <span>₹{currentBooking.totalAmount}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Total</span>
                      <span className="text-pink-400">
                        ₹{currentBooking.finalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-700/50 bg-[#0a0a29]/80 backdrop-blur-lg">
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleProceedToCheckout}
                disabled={
                  !selectedSeatType ||
                  selectedSeats < 1 ||
                  !selectedEventCategory ||
                  (isMultiDay && !selectedDay)
                }
              >
                Proceed to Checkout • ₹{currentBooking.finalAmount}
              </Button>
              <p className="text-gray-500 text-xs text-center mt-3">
                Secure payment via Razorpay
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default BookTicketDrawer;
