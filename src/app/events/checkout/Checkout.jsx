"use client";

import { useState, useEffect } from "react";
import Button from "@/app/components/Button";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import {
  useCreatePaymentOrderMutation,
  useLazyVerifyPaymentQuery,
} from "../../../../store/eventsApi";
import toast from "react-hot-toast";
import Image from "next/image";
import PaymentSuccessModal from "./PaymentSuccessModal";

const Checkout = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const { user, isAuthenticated } = useAuth();

  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useLazyVerifyPaymentQuery();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load booking details from localStorage
  useEffect(() => {
    const pendingBooking = localStorage.getItem("pendingEventBooking");
    if (pendingBooking) {
      const parsed = JSON.parse(pendingBooking);
      setBookingDetails(parsed);
    } else {
      router.push("/events");
    }
  }, [router]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (!form.phone.trim() || form.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }
    if (!window.Razorpay) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Get user's country code
      const countryCode = localStorage.getItem("userCountry") || "IN";

      // Create payment order
      const orderData = {
        userId: user._id,
        quantity: bookingDetails.quantity,
        bookingType: bookingDetails.bookingType || "ticket",
        seatType: bookingDetails.seatType,
        eventPass: bookingDetails.eventPass || undefined,
        eventCategory: bookingDetails.eventCategory || "Ticket Booking",
        attendanceDate:
          bookingDetails.bookingType === "pass"
            ? undefined
            : bookingDetails.attendanceDate || bookingDetails.eventDate,
        countryCode,
        customerDetails: {
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
      };

      const response = await createPaymentOrder({
        eventId: bookingDetails.eventId,
        orderData,
      }).unwrap();

      if (response.success && response.data?.razorpayOrder) {
        const { orderId, amount, currency, keyId } =
          response.data.razorpayOrder;

        // Store booking ID for verification
        localStorage.setItem("pendingBookingId", response.data.booking._id);

        // Configure Razorpay options
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: bookingDetails.eventTitle,
          description:
            bookingDetails.bookingType === "pass"
              ? `${bookingDetails.quantity} x ${bookingDetails.seatType} Event Pass`
              : `${bookingDetails.quantity} x ${bookingDetails.seatType} Ticket`,
          order_id: orderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          theme: {
            color: "#ec4899",
          },
          handler: async function (response) {
            // Payment successful - verify on backend
            await handlePaymentVerification({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
              toast.error("Payment cancelled");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error(response.message || "Failed to create payment order");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.data?.message || "Payment failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePaymentVerification = async (paymentData) => {
    try {
      // Verify payment signature on backend
      const verifyResult = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/payment/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        },
      );

      const result = await verifyResult.json();

      if (result.success) {
        toast.success("Payment successful!");
        localStorage.removeItem("pendingEventBooking");
        localStorage.removeItem("pendingBookingId");
        setSuccessData(result.data);
        setShowSuccessModal(true);
        setIsLoading(false);
      } else {
        toast.error(result.message || "Payment verification failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Payment verification failed");
      setIsLoading(false);
    }
  };

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

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        bookingData={successData}
        onClose={() => setShowSuccessModal(false)}
      />

      <section className="min-h-screen  py-6">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
              onClick={() => router.back()}
            >
              <FaArrowLeft className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Checkout</h1>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left Column - Event Summary */}
            <div className="md:col-span-2">
              <div className="bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden sticky top-6">
                {/* Event Image */}
                {bookingDetails.posterImage && (
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={bookingDetails.posterImage}
                      alt={bookingDetails.eventTitle}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1730] to-transparent" />
                  </div>
                )}

                <div className="p-4">
                  <h2 className="text-white font-bold text-lg line-clamp-2">
                    {bookingDetails.eventTitle}
                  </h2>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <FaCalendarAlt className="text-pink-400" />
                      {bookingDetails.bookingType === "pass" &&
                      bookingDetails.eventEndDate &&
                      bookingDetails.eventEndDate !== bookingDetails.eventDate ? (
                        <span>
                          {formatDate(bookingDetails.eventDate)} →{" "}
                          {formatDate(bookingDetails.eventEndDate)} • All days
                        </span>
                      ) : (
                        <span>
                          {formatDate(
                            bookingDetails.attendanceDate ||
                              bookingDetails.eventDate
                          )}{" "}
                          • {formatTime(bookingDetails.eventTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <FaMapMarkerAlt className="text-pink-400" />
                      <span>{bookingDetails.venue}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <FaTicketAlt className="text-pink-400" />
                      <span>
                        {bookingDetails.quantity} x {bookingDetails.seatType}{" "}
                        {bookingDetails.bookingType === "pass"
                          ? "Pass"
                          : "Ticket"}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-6 pt-4 border-t border-gray-700/50 space-y-2">
                    <div className="flex justify-between text-gray-400 text-sm">
                      <span>
                        Tickets ({bookingDetails.quantity} x ₹
                        {bookingDetails.unitPrice})
                      </span>
                      <span>₹{bookingDetails.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700/50">
                      <span>Total</span>
                      <span className="text-pink-400">
                        ₹{bookingDetails.finalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="md:col-span-3">
              <div className="bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <FaShieldAlt className="text-green-400" />
                  Contact Details
                </h3>

                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                      required
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Tickets will be sent to this email
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Security Note */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                    <FaLock className="text-green-400 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-medium text-sm">
                        Secure Payment
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Your payment information is encrypted and securely
                        processed by Razorpay.
                      </p>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-4 rounded-xl font-semibold text-lg shadow-lg mt-6"
                    onClick={handlePayment}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      `Pay ₹${bookingDetails.finalAmount}`
                    )}
                  </Button>

                  <p className="text-gray-500 text-xs text-center">
                    By clicking Pay, you agree to our Terms of Service and
                    Privacy Policy
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Checkout;
