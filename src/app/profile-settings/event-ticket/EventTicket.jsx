"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";
import {
  FaArrowLeft,
  FaTicketAlt,
  FaDownload,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaChevronRight,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUserBookingsQuery,
  useGetETicketQuery,
} from "../../../../store/eventsApi";
import Image from "next/image";

const EventTicket = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const ticketRef = useRef(null);

  // Fetch user bookings
  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch,
  } = useGetUserBookingsQuery(user?._id, {
    skip: !user?._id,
  });

  const bookings = bookingsData?.bookings || [];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // For multi-day events: compute which day index (1-based) the attendanceDate
  // falls on and the total number of days. Returns null for single-day events.
  const getDayBadge = (event, attendanceDate) => {
    if (!event?.startDate || !event?.endDate || !attendanceDate) return null;
    const start = new Date(event.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(event.endDate);
    end.setHours(0, 0, 0, 0);
    const attend = new Date(attendanceDate);
    attend.setHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((end - start) / msPerDay) + 1;
    if (totalDays <= 1) return null;

    const dayIndex = Math.round((attend - start) / msPerDay) + 1;
    if (dayIndex < 1 || dayIndex > totalDays) return null;

    return { dayIndex, totalDays };
  };

  // For a "pass" booking, build a per-day scan status array so we can render
  // each day with its own "Scanned / Not Scanned" indicator.
  const getPassDays = (event, eTicket) => {
    if (!event?.startDate) return [];
    const start = new Date(event.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    end.setUTCHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const days = [];
    const cursor = new Date(start);
    let guard = 0;
    while (cursor.getTime() <= end.getTime() && guard < 60) {
      const dayKey = new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
        ),
      );
      const usage = (eTicket?.passUsageHistory || []).find((u) => {
        const d = new Date(u.dayDate);
        return (
          d.getUTCFullYear() === dayKey.getUTCFullYear() &&
          d.getUTCMonth() === dayKey.getUTCMonth() &&
          d.getUTCDate() === dayKey.getUTCDate()
        );
      });
      days.push({
        date: dayKey,
        index: days.length + 1,
        scanned: !!usage,
        scannedAt: usage?.scannedAt || null,
      });
      cursor.setTime(cursor.getTime() + msPerDay);
      guard += 1;
    }
    return days;
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return {
          bg: "bg-green-500/20",
          text: "text-green-400",
          icon: FaCheckCircle,
        };
      case "pending":
        return {
          bg: "bg-yellow-500/20",
          text: "text-yellow-400",
          icon: FaHourglassHalf,
        };
      case "cancelled":
      case "failed":
        return {
          bg: "bg-red-500/20",
          text: "text-red-400",
          icon: FaTimesCircle,
        };
      default:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-400",
          icon: FaInfoCircle,
        };
    }
  };

  // Download ticket as image
  const downloadTicket = async () => {
    if (!ticketRef.current) return;

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `event-ticket-${selectedBooking?.bookingReference || "ticket"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading ticket:", error);
      // Fallback - download QR code
      if (selectedBooking?.eTicket?.qrCodeImageUrl) {
        const link = document.createElement("a");
        link.download = `ticket-qr-${selectedBooking?.bookingReference}.png`;
        link.href = selectedBooking.eTicket.qrCodeImageUrl;
        link.click();
      }
    }
  };

  // Handle view ticket
  const handleViewTicket = (booking) => {
    setSelectedBooking(booking);
    setShowTicketModal(true);
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <section className="min-h-screen  py-8">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center py-20">
            <FaTicketAlt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Login Required
            </h2>
            <p className="text-gray-400 mb-6">
              Please login to view your tickets
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              Login Now
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen  py-6">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
            onClick={() => router.push("/profile-settings")}
          >
            <FaArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">My Event Tickets</h1>
            <p className="text-gray-400 text-sm">
              {bookings.length} ticket(s) found
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your tickets...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
              <FaTicketAlt className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              No Tickets Found
            </h2>
            <p className="text-gray-400 mb-6">
              You haven't booked any event tickets yet
            </p>
            <Button
              onClick={() => router.push("/events")}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              Explore Events
            </Button>
          </div>
        )}

        {/* Bookings List */}
        {!isLoading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const event = booking.eventId;
              const status = getStatusStyle(booking.paymentStatus);
              const StatusIcon = status.icon;
              const isPass = booking.bookingType === "pass";
              const isMultiDayEvent =
                event?.startDate &&
                event?.endDate &&
                new Date(event.endDate).toDateString() !==
                  new Date(event.startDate).toDateString();
              const passPerks = booking?.passPerks || {};

              return (
                <div
                  key={booking._id}
                  className="bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all cursor-pointer"
                  onClick={() => handleViewTicket(booking)}
                >
                  <div className="flex gap-4 p-4">
                    {/* Event Image */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                      {event?.posterImage ? (
                        <Image
                          src={event.posterImage}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 flex items-center justify-center">
                          <FaTicketAlt className="text-white/50 w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold text-base line-clamp-1">
                          {event?.title || "Event"}
                        </h3>
                        {isPass && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-pink-500/30 to-purple-600/30 border border-pink-400/50 text-pink-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                            Pass
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                        <FaCalendarAlt className="text-pink-400" />
                        {isPass && isMultiDayEvent ? (
                          <span>
                            {formatDate(event?.startDate)} →{" "}
                            {formatDate(event?.endDate)}
                          </span>
                        ) : (
                          <>
                            <span>
                              {formatDate(
                                booking.attendanceDate || event?.startDate
                              )}
                            </span>
                            {(() => {
                              const dayBadge = getDayBadge(
                                event,
                                booking.attendanceDate
                              );
                              if (!dayBadge) return null;
                              return (
                                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-semibold">
                                  Day {dayBadge.dayIndex} of{" "}
                                  {dayBadge.totalDays}
                                </span>
                              );
                            })()}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                        <FaMapMarkerAlt className="text-pink-400" />
                        <span className="line-clamp-1">
                          {event?.location?.venueName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg}`}
                        >
                          <StatusIcon className={`w-3 h-3 ${status.text}`} />
                          <span
                            className={`text-xs font-medium ${status.text} capitalize`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </div>
                        <span className="text-white font-semibold">
                          {booking.quantity}{" "}
                          {isPass
                            ? `pass${booking.quantity > 1 ? "es" : ""}`
                            : `ticket${booking.quantity > 1 ? "s" : ""}`}
                        </span>
                      </div>

                      {/* Pass perk badges */}
                      {isPass &&
                        (passPerks.foodIncluded ||
                          passPerks.parkingAvailable) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {passPerks.foodIncluded && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                                🍽️ Food
                              </span>
                            )}
                            {passPerks.parkingAvailable && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-semibold">
                                🅿️ Parking
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <FaChevronRight className="text-gray-500" />
                    </div>
                  </div>

                  {/* Booking Reference */}
                  <div className="px-4 py-2 bg-black/20 border-t border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">
                        Ref: {booking.bookingReference}
                      </span>
                      <span className="text-green-400 text-xs font-medium">
                        ₹{booking.finalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* E-Ticket Modal */}
        {showTicketModal && selectedBooking && (
          <ETicketModal
            booking={selectedBooking}
            onClose={() => {
              setShowTicketModal(false);
              setSelectedBooking(null);
            }}
            onDownload={downloadTicket}
            ticketRef={ticketRef}
            formatDate={formatDate}
            formatTime={formatTime}
            getDayBadge={getDayBadge}
            getPassDays={getPassDays}
          />
        )}
      </div>
    </section>
  );
};

// Barcode Generator Component - generates Code128 style barcode using canvas
const BarcodeGenerator = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const text = value.toString();

    // Canvas settings
    const barWidth = 2;
    const height = 60;
    const padding = 10;

    // Generate a simple barcode pattern from the text
    let pattern = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // Create a unique pattern for each character
      const binary = charCode.toString(2).padStart(8, "0");
      pattern += binary + "0"; // Add separator
    }

    // Add start and stop patterns
    pattern = "110" + pattern + "1100011101011";

    const totalWidth = pattern.length * barWidth + padding * 2;
    canvas.width = totalWidth;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, height);

    // Draw barcode
    ctx.fillStyle = "#000000";
    let x = padding;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "1") {
        ctx.fillRect(x, 5, barWidth, height - 10);
      }
      x += barWidth;
    }
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "60px",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
};

// E-Ticket Modal Component
const ETicketModal = ({
  booking,
  onClose,
  onDownload,
  ticketRef,
  formatDate,
  formatTime,
  getDayBadge,
  getPassDays,
}) => {
  const event = booking.eventId;
  const eTicket = booking.eTicket;
  const isPass = booking.bookingType === "pass";
  const isMultiDayEvent =
    event?.startDate &&
    event?.endDate &&
    new Date(event.endDate).toDateString() !==
      new Date(event.startDate).toDateString();
  const dayBadge =
    !isPass && getDayBadge
      ? getDayBadge(event, booking.attendanceDate)
      : null;
  const passPerks = booking?.passPerks || {};
  const passDays = isPass && getPassDays ? getPassDays(event, eTicket) : [];
  const passDaysScanned = passDays.filter((d) => d.scanned).length;
  const passTotalDays = passDays.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <FaTimes className="text-white" />
          </button>
        </div>

        {/* E-Ticket - Using inline styles with emoji for html2canvas compatibility */}
        <div
          ref={ticketRef}
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Header with event photo background */}
          <div
            style={{
              position: "relative",
              minHeight: "140px",
              overflow: "hidden",
            }}
          >
            {/* Event Photo Background */}
            {event?.posterImage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${event.posterImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(0px)",
                }}
              ></div>
            )}
            {/* Gradient Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: event?.posterImage
                  ? "linear-gradient(135deg, rgba(236, 72, 153, 0.85) 0%, rgba(168, 85, 247, 0.85) 50%, rgba(99, 102, 241, 0.85) 100%)"
                  : "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
              }}
            ></div>

            <div style={{ position: "relative", zIndex: 10, padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.95)",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    {isPass ? "EVENT PASS" : "E-TICKET"}
                  </span>
                  <h2
                    style={{
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: "18px",
                      lineHeight: "1.3",
                      margin: 0,
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {event?.title}
                  </h2>
                </div>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "0 14px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "32px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      lineHeight: "32px",
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginTop: "-2px",
                    }}
                  >
                    {isPass
                      ? booking.eventPass || booking.seatType
                      : booking.seatType}
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                bottom: "-16px",
                left: "24px",
                width: "32px",
                height: "32px",
                backgroundColor: "#1a1a2e",
                borderRadius: "50%",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                bottom: "-16px",
                right: "24px",
                width: "32px",
                height: "32px",
                backgroundColor: "#1a1a2e",
                borderRadius: "50%",
              }}
            ></div>
          </div>

          {/* Dashed line */}
          <div
            style={{
              padding: "0 40px",
              marginTop: "-8px",
              position: "relative",
            }}
          >
            <div style={{ borderTop: "2px dashed #4b5563" }}></div>
          </div>

          {/* Event Details */}
          <div style={{ padding: "20px" }}>
            {/* Date & Time Row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "#f472b6",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                    }}
                  >
                    📅 {isPass && isMultiDayEvent ? "VALID" : "DATE"}
                  </span>
                </div>
                {isPass && isMultiDayEvent ? (
                  <>
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "13px",
                        margin: 0,
                        lineHeight: "1.3",
                      }}
                    >
                      {formatDate(event?.startDate)}
                    </p>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "11px",
                        margin: "2px 0",
                      }}
                    >
                      to
                    </p>
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "13px",
                        margin: 0,
                        lineHeight: "1.3",
                      }}
                    >
                      {formatDate(event?.endDate)}
                    </p>
                    <p
                      style={{
                        color: "#4ade80",
                        fontWeight: "700",
                        fontSize: "10px",
                        margin: "4px 0 0 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      ALL DAYS ACCESS
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "14px",
                        margin: 0,
                      }}
                    >
                      {formatDate(
                        booking.attendanceDate || event?.startDate
                      )}
                    </p>
                    {dayBadge && (
                      <p
                        style={{
                          color: "#f472b6",
                          fontWeight: "600",
                          fontSize: "10px",
                          margin: "4px 0 0 0",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Day {dayBadge.dayIndex} of {dayBadge.totalDays}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "#f472b6",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                    }}
                  >
                    🕐 TIME
                  </span>
                </div>
                <p
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  {formatTime(event?.startTime)}
                </p>
              </div>
            </div>

            {/* Venue */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    color: "#f472b6",
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                  }}
                >
                  📍 VENUE
                </span>
              </div>
              <p
                style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  margin: "0 0 4px 0",
                }}
              >
                {event?.location?.venueName}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
                {event?.location?.address}, {event?.location?.city}
              </p>
            </div>

            {/* Pass Perks (food / parking) */}
            {isPass &&
              (passPerks.foodIncluded || passPerks.parkingAvailable) && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        color: "#f472b6",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                      }}
                    >
                      ✨ PASS PERKS
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {passPerks.foodIncluded && (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          color: "#6ee7b7",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        🍽️ Food included
                      </span>
                    )}
                    {passPerks.parkingAvailable && (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(59, 130, 246, 0.2)",
                          border: "1px solid rgba(59, 130, 246, 0.4)",
                          color: "#93c5fd",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        🅿️ Parking available
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Per-day scan status (passes only) */}
            {isPass && passDays.length > 0 && (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "#f472b6",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                    }}
                  >
                    🎯 SCAN STATUS
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    {passDaysScanned} / {passTotalDays} days
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {passDays.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      style={{
                        backgroundColor: day.scanned
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(255, 255, 255, 0.04)",
                        border: day.scanned
                          ? "1px solid rgba(34, 197, 94, 0.4)"
                          : "1px dashed rgba(156, 163, 175, 0.3)",
                        borderRadius: "10px",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          margin: 0,
                          letterSpacing: "0.5px",
                        }}
                      >
                        Day {day.index}
                      </p>
                      <p
                        style={{
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "600",
                          margin: "2px 0",
                        }}
                      >
                        {formatDate(day.date)}
                      </p>
                      <p
                        style={{
                          color: day.scanned ? "#4ade80" : "#9ca3af",
                          fontSize: "10px",
                          fontWeight: "700",
                          margin: 0,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {day.scanned ? "✓ Used" : "Unused"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Details Row */}
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, padding: "12px", textAlign: "center" }}>
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    margin: "0 0 4px 0",
                    fontWeight: "600",
                  }}
                >
                  {isPass ? "PASSES" : "TICKETS"}
                </p>
                <p
                  style={{
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "20px",
                    margin: 0,
                  }}
                >
                  {booking.quantity}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  textAlign: "center",
                  borderLeft: "1px solid #374151",
                }}
              >
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    margin: "0 0 4px 0",
                    fontWeight: "600",
                  }}
                >
                  CATEGORY
                </p>
                <p
                  style={{
                    color: "#f472b6",
                    fontWeight: "bold",
                    fontSize: "12px",
                    margin: 0,
                    lineHeight: "1.3",
                  }}
                >
                  {booking.eventCategory || booking.seatType}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  textAlign: "center",
                  borderLeft: "1px solid #374151",
                }}
              >
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    margin: "0 0 4px 0",
                    fontWeight: "600",
                  }}
                >
                  AMOUNT
                </p>
                <p
                  style={{
                    color: "#4ade80",
                    fontWeight: "bold",
                    fontSize: "18px",
                    margin: 0,
                  }}
                >
                  ₹{booking.finalAmount}
                </p>
              </div>
            </div>

            {/* Attendee */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    color: "#f472b6",
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                  }}
                >
                  {" "}
                  ATTENDEE
                </span>
              </div>
              <p
                style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  margin: "0 0 2px 0",
                }}
              >
                {booking.customerDetails?.name}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
                {booking.customerDetails?.email}
              </p>
            </div>

            {/* Booking Reference */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
                borderRadius: "12px",
                padding: "12px",
                border: "1px solid rgba(236, 72, 153, 0.3)",
              }}
            >
              <p
                style={{
                  color: "#f472b6",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                  fontWeight: "600",
                  letterSpacing: "1px",
                }}
              >
                BOOKING REFERENCE
              </p>
              <p
                style={{
                  color: "#ffffff",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  fontSize: "16px",
                  letterSpacing: "1px",
                  margin: 0,
                }}
              >
                {booking.bookingReference}
              </p>
            </div>
          </div>

          {/* Barcode Section */}
          <div style={{ padding: "0 20px 20px", position: "relative" }}>
            {/* Dashed separator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ flex: 1, borderTop: "1px dashed #4b5563" }}></div>
              <span style={{ color: "#6b7280", fontSize: "16px" }}>⊞</span>
              <div style={{ flex: 1, borderTop: "1px dashed #4b5563" }}></div>
            </div>

            {/* Modern Barcode */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "20px 16px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  width: "100%",
                  maxWidth: "320px",
                }}
              >
                {/* Barcode Canvas */}
                <BarcodeGenerator value={booking.bookingReference} />
                {/* Barcode Number */}
                <p
                  style={{
                    color: "#1f2937",
                    fontSize: "12px",
                    marginTop: "10px",
                    textAlign: "center",
                    fontFamily: "monospace",
                    letterSpacing: "2px",
                    fontWeight: "600",
                  }}
                >
                  {booking.bookingReference}
                </p>
              </div>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  marginTop: "12px",
                  textAlign: "center",
                }}
              >
                Scan this barcode at the venue entrance
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              padding: "14px 20px",
            }}
          >
            <p
              style={{
                color: "#6b7280",
                fontSize: "11px",
                textAlign: "center",
                margin: 0,
              }}
            >
              {isPass
                ? "Keep this pass safe. Present it at the venue for entry on any event day."
                : "Keep this ticket safe. Present it at the venue for entry."}
            </p>
          </div>
        </div>

        {/* Download Button */}
        <Button
          onClick={onDownload}
          className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <FaDownload />
          {isPass ? "Download Event Pass" : "Download E-Ticket"}
        </Button>

        {/* Instructions */}
        <div className="mt-4 bg-white/5 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
            <FaInfoCircle className="text-pink-400" />
            Instructions
          </h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Arrive at least 30 minutes before the event starts</li>
            <li>• Show this QR code at the venue entrance</li>
            <li>• Carry a valid ID proof for verification</li>
            <li>• This ticket is non-transferable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventTicket;
