import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

/** Events API with RTK Query **/
export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get token from localStorage if available
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        // if (token) {
        //   headers.set("Authorization", `Bearer ${token}`);
        // }
      }
      return headers;
    },
  }),
  tagTypes: ["Events", "EventCategories", "EventBookings", "UserBookings"],
  endpoints: (builder) => ({
    // ==================== EVENT ENDPOINTS ====================
    
    /** Get all events */
    getEvents: builder.query({
      query: (params) => ({
        url: "/events",
        params: params || {},
      }),
      transformResponse: (response) => ({
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.meta || { page: 1, limit: 12, total: 0, totalPages: 1 },
      }),
      providesTags: ["Events"],
    }),

    /** Get single event by ID */
    getEventById: builder.query({
      query: (id) => `/events/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Events", id }],
    }),

    /** Get events by category */
    getEventsByCategory: builder.query({
      query: (categoryId) => `/events?categoryId=${categoryId}`,
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["Events"],
    }),

    /** Search events */
    searchEvents: builder.query({
      query: ({ query, city, eventType, startDate, endDate }) => ({
        url: "/events/search",
        params: { query, city, eventType, startDate, endDate },
      }),
      transformResponse: (response) => response.data,
      providesTags: ["Events"],
    }),

    /** Get events by home section */
    getEventsByHomeSection: builder.query({
      query: ({ homeSection, limit = 10 }) => ({
        url: "/events",
        params: { homeSection, limit },
      }),
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [],
      providesTags: ["Events"],
    }),

    // ==================== EVENT CATEGORY ENDPOINTS ====================
    
    /** Get all event categories */
    getEventCategories: builder.query({
      query: () => "/event-categories",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["EventCategories"],
    }),

    /** Get event category by ID */
    getEventCategoryById: builder.query({
      query: (id) => `/event-categories/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "EventCategories", id }],
    }),

    // ==================== BOOKING ENDPOINTS ====================
    
    /** Create event booking (old method) */
    createEventBooking: builder.mutation({
      query: ({ eventId, bookingData }) => ({
        url: `/events/${eventId}/book`,
        method: "POST",
        body: bookingData,
      }),
      invalidatesTags: ["Events", "EventBookings"],
    }),

    /** Get all bookings */
    getAllBookings: builder.query({
      query: (params) => ({
        url: "/events/bookings",
        params: params || {},
      }),
      transformResponse: (response) => ({
        bookings: response.data,
        meta: response.meta,
      }),
      providesTags: ["EventBookings"],
    }),

    /** Get bookings by user */
    getUserBookings: builder.query({
      query: (userId) => `/events/bookings?userId=${userId}`,
      transformResponse: (response) => ({
        bookings: response.data,
        meta: response.meta,
      }),
      providesTags: ["UserBookings"],
    }),

    /** Get booking by ID */
    getBookingById: builder.query({
      query: (id) => `/events/bookings/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "EventBookings", id }],
    }),

    /** Cancel booking */
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/events/bookings/${id}/cancel`,
        method: "PUT",
      }),
      invalidatesTags: ["EventBookings", "UserBookings", "Events"],
    }),

    /** Get e-ticket */
    getETicket: builder.query({
      query: (bookingId) => `/events/bookings/${bookingId}/ticket`,
      transformResponse: (response) => response.data,
    }),

    // ==================== CASHFREE PAYMENT ENDPOINTS ====================
    
    /** Create Cashfree payment order */
    createPaymentOrder: builder.mutation({
      query: ({ eventId, orderData }) => ({
        url: `/events/${eventId}/payment/create-order`,
        method: "POST",
        body: orderData,
      }),
    }),

    /** Verify payment */
    verifyPayment: builder.query({
      query: (orderId) => `/events/payment/verify/${orderId}`,
      transformResponse: (response) => response.data,
    }),

    /** Get payment status */
    getPaymentStatus: builder.query({
      query: (orderId) => `/events/payment/status/${orderId}`,
      transformResponse: (response) => response.data,
    }),

    /** Initiate refund */
    initiateRefund: builder.mutation({
      query: ({ bookingId, reason }) => ({
        url: `/events/payment/refund/${bookingId}`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["EventBookings", "UserBookings"],
    }),

    // ==================== TICKET VALIDATION ENDPOINTS ====================
    
    /** Validate ticket by scanner ID */
    validateTicket: builder.mutation({
      query: ({ scannerId, scanData }) => ({
        url: `/events/tickets/validate/${scannerId}`,
        method: "POST",
        body: scanData,
      }),
    }),

    /** Check ticket status */
    checkTicketStatus: builder.query({
      query: (scannerId) => `/events/tickets/status/${scannerId}`,
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Event hooks
  useGetEventsQuery,
  useGetEventByIdQuery,
  useGetEventsByCategoryQuery,
  useSearchEventsQuery,
  useLazySearchEventsQuery,
  useGetEventsByHomeSectionQuery,
  
  // Category hooks
  useGetEventCategoriesQuery,
  useGetEventCategoryByIdQuery,
  
  // Booking hooks
  useCreateEventBookingMutation,
  useGetAllBookingsQuery,
  useGetUserBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
  useGetETicketQuery,
  
  // Payment hooks
  useCreatePaymentOrderMutation,
  useVerifyPaymentQuery,
  useLazyVerifyPaymentQuery,
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
  useInitiateRefundMutation,
  
  // Ticket validation hooks
  useValidateTicketMutation,
  useCheckTicketStatusQuery,
} = eventsApi;
