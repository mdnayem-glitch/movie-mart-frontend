import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Current booking in progress
  currentBooking: {
    eventId: null,
    event: null,
    quantity: 1,
    seatType: "Normal",
    eventCategory: null,
    attendanceDate: null, // ISO string - for multi-day events, the specific day user is attending
    unitPrice: 0,
    totalAmount: 0,
    bookingFee: 0,
    taxAmount: 0,
    finalAmount: 0,
    customerDetails: {
      name: "",
      email: "",
      phone: "",
    },
  },
  
  // Payment state
  payment: {
    orderId: null,
    paymentSessionId: null,
    status: "idle", // idle, pending, success, failed
    error: null,
  },
  
  // Booking result
  bookingResult: {
    booking: null,
    eTicket: null,
  },
  
  // UI state
  isDrawerOpen: false,
  isCheckoutLoading: false,
  step: "select", // select, checkout, payment, success
};

export const eventBookingSlice = createSlice({
  name: "eventBooking",
  initialState,
  reducers: {
    // Set current event for booking
    setBookingEvent: (state, action) => {
      const event = action.payload;
      state.currentBooking.eventId = event._id;
      state.currentBooking.event = event;
      state.currentBooking.unitPrice = event.ticketPrice;
      
      // Reset quantities
      state.currentBooking.quantity = 1;
      state.currentBooking.seatType = "Normal";
      state.currentBooking.eventCategory = null;

      // Default attendance date = event start date (for single & multi-day events)
      state.currentBooking.attendanceDate = event.startDate || null;
      
      // Calculate initial amounts (no booking fee or GST)
      const totalAmount = event.ticketPrice * 1;
      
      state.currentBooking.totalAmount = totalAmount;
      state.currentBooking.bookingFee = 0;
      state.currentBooking.taxAmount = 0;
      state.currentBooking.finalAmount = totalAmount;
    },
    
    // Update ticket quantity
    setQuantity: (state, action) => {
      const quantity = action.payload;
      state.currentBooking.quantity = quantity;
      
      // Recalculate amounts (no booking fee or GST)
      const totalAmount = state.currentBooking.unitPrice * quantity;
      
      state.currentBooking.totalAmount = totalAmount;
      state.currentBooking.bookingFee = 0;
      state.currentBooking.taxAmount = 0;
      state.currentBooking.finalAmount = totalAmount;
    },
    
    // Set seat type
    setSeatType: (state, action) => {
      const { seatType, price } = action.payload;
      state.currentBooking.seatType = seatType;
      state.currentBooking.unitPrice = price;
      
      // Recalculate amounts (no booking fee or GST)
      const totalAmount = price * state.currentBooking.quantity;
      
      state.currentBooking.totalAmount = totalAmount;
      state.currentBooking.bookingFee = 0;
      state.currentBooking.taxAmount = 0;
      state.currentBooking.finalAmount = totalAmount;
    },
    
    // Set event category (participation type)
    setEventCategory: (state, action) => {
      state.currentBooking.eventCategory = action.payload;
    },

    // Set attendance date (for multi-day events - which specific day the user will attend)
    setAttendanceDate: (state, action) => {
      state.currentBooking.attendanceDate = action.payload;
    },
    
    // Update customer details
    setCustomerDetails: (state, action) => {
      state.currentBooking.customerDetails = {
        ...state.currentBooking.customerDetails,
        ...action.payload,
      };
    },
    
    // Set payment order details
    setPaymentOrder: (state, action) => {
      state.payment.orderId = action.payload.orderId;
      state.payment.paymentSessionId = action.payload.paymentSessionId;
      state.payment.status = "pending";
    },
    
    // Set payment status
    setPaymentStatus: (state, action) => {
      state.payment.status = action.payload;
    },
    
    // Set payment error
    setPaymentError: (state, action) => {
      state.payment.status = "failed";
      state.payment.error = action.payload;
    },
    
    // Set booking result
    setBookingResult: (state, action) => {
      state.bookingResult.booking = action.payload.booking;
      state.bookingResult.eTicket = action.payload.eTicket;
      state.payment.status = "success";
      state.step = "success";
    },
    
    // UI state
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    
    setStep: (state, action) => {
      state.step = action.payload;
    },
    
    setCheckoutLoading: (state, action) => {
      state.isCheckoutLoading = action.payload;
    },
    
    // Reset booking state
    resetBooking: (state) => {
      return initialState;
    },
    
    // Clear payment state
    clearPayment: (state) => {
      state.payment = initialState.payment;
    },
  },
});

export const {
  setBookingEvent,
  setQuantity,
  setSeatType,
  setEventCategory,
  setAttendanceDate,
  setCustomerDetails,
  setPaymentOrder,
  setPaymentStatus,
  setPaymentError,
  setBookingResult,
  openDrawer,
  closeDrawer,
  setStep,
  setCheckoutLoading,
  resetBooking,
  clearPayment,
} = eventBookingSlice.actions;

// Selectors
export const selectCurrentBooking = (state) => state.eventBooking.currentBooking;
export const selectPayment = (state) => state.eventBooking.payment;
export const selectBookingResult = (state) => state.eventBooking.bookingResult;
export const selectIsDrawerOpen = (state) => state.eventBooking.isDrawerOpen;
export const selectStep = (state) => state.eventBooking.step;
export const selectIsCheckoutLoading = (state) => state.eventBooking.isCheckoutLoading;

export default eventBookingSlice.reducer;
