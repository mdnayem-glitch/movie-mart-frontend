"use client";

import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaRocket,
  FaShieldAlt,
  FaGlobe,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import {
  useGetVendorPackagesQuery,
  useGetPlatformSettingsQuery,
  useCreateVendorApplicationMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useValidateVendorApplicationMutation,
} from "../../../store/becomeVendorApi";
import {
  detectUserCountry,
  getPriceForCountry,
} from "@/services/geolocationService";
import { getCountryByCode, COUNTRIES } from "@/data/countries";

const BecomeAVendor = () => {
  const [step, setStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // ✅ Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ✅ Detect user's country for location-based pricing
  useEffect(() => {
    const detectCountry = async () => {
      try {
        setLocationLoading(true);
        const country = await detectUserCountry(false, true);
        setUserCountry(country);
        // Update form country based on detected location
        if (country?.countryCode) {
          setFormData((prev) => ({ ...prev, country: country.countryCode }));
        }
      } catch (error) {
        console.error("Failed to detect country:", error);
        setUserCountry({
          countryCode: "IN",
          currency: "INR",
          currencySymbol: "₹",
          flag: "🇮🇳",
        });
      } finally {
        setLocationLoading(false);
      }
    };
    detectCountry();
  }, []);

  // Helper function to get package price for user's country
  const getPackagePrice = (pkg) => {
    if (!pkg) return { price: 0, currency: "INR", currencySymbol: "₹" };

    // Check if package has country-wise pricing
    const countryPricing = pkg.countryPricing || [];
    const userCountryCode = userCountry?.countryCode || "IN";

    // Find pricing for user's country
    const countryPrice = countryPricing.find(
      (cp) => cp.countryCode === userCountryCode && cp.isActive,
    );

    if (countryPrice) {
      const countryData = getCountryByCode(countryPrice.countryCode);
      return {
        price: countryPrice.price,
        currency: countryPrice.currency,
        currencySymbol: countryData?.currencySymbol || countryPrice.currency,
      };
    }

    // Default to base price (INR)
    return {
      price: pkg.price,
      currency: "INR",
      currencySymbol: "₹",
    };
  };

  // ✅ Fetch packages and settings
  const { data: packages = [], isLoading: packagesLoading } =
    useGetVendorPackagesQuery();
  const { data: platformSettings = [], isLoading: settingsLoading } =
    useGetPlatformSettingsQuery();
  const [createVendor, { isLoading: vendorLoading }] =
    useCreateVendorApplicationMutation();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [validateApplication] = useValidateVendorApplicationMutation();
  const [createVendorApplication, { isLoading: vendorApplicationLoading }] =
    useCreateVendorApplicationMutation();

  // Get platform fees
  const eventFee = useMemo(() => {
    const setting = platformSettings.find(
      (s) => s.key === "event_platform_fee",
    );
    return setting?.value || 20;
  }, [platformSettings]);

  const movieWatchFee = useMemo(() => {
    const setting = platformSettings.find(
      (s) => s.key === "movie_watch_platform_fee",
    );
    return setting?.value || 50;
  }, [platformSettings]);

  // ✅ Form Data
  const [formData, setFormData] = useState({
    vendorName: "",
    businessType: "",
    gstNumber: "",
    country: "IN",
    address: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Selected Services
  const [selectedServices, setSelectedServices] = useState({
    film_trade: false,
    events: false,
    movie_watch: false,
  });
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [isGovernmentEvent, setIsGovernmentEvent] = useState(false); // Government events have fixed 10% platform fee

  // KYC upload removed — documents are optional and handled later if needed.
  const steps = ["Vendor Info", "Select Services", "Review"];

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Step Validation
  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1: // Vendor Info
        if (!formData.vendorName.trim()) {
          toast.error("Please enter your name");
          return false;
        }
        if (!formData.businessType.trim()) {
          toast.error("Please enter your business name");
          return false;
        }
        if (!formData.email.trim()) {
          toast.error("Please enter your email");
          return false;
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        if (!formData.password.trim()) {
          toast.error("Please set a password for your vendor panel");
          return false;
        }
        if (formData.password.trim().length < 8) {
          toast.error("Password must be at least 8 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (!formData.phone.trim()) {
          toast.error("Please enter your phone number");
          return false;
        }
        // India phone validation: 10 digits, starts with 6-9
        const phoneDigits = formData.phone.replace(/\D/g, "");
        if (formData.country === "IN") {
          const indiaPhone = /^[6-9]\d{9}$/;
          const normalised = phoneDigits.replace(/^91/, "");
          if (!indiaPhone.test(normalised)) {
            toast.error("Please enter a valid Indian mobile number (10 digits starting with 6–9)");
            return false;
          }
        } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
          toast.error("Please enter a valid phone number");
          return false;
        }
        // GST validation (India only, optional but if filled must be valid)
        if (formData.country === "IN" && formData.gstNumber && formData.gstNumber.trim()) {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          if (!gstRegex.test(formData.gstNumber.trim().toUpperCase())) {
            toast.error("Please enter a valid GST number (e.g. 27ABCDE1234F1Z5)");
            return false;
          }
        }
        if (!formData.address.trim()) {
          toast.error("Please enter your address");
          return false;
        }
        return true;

      case 2: // Select Services
        if (
          !selectedServices.film_trade &&
          !selectedServices.events &&
          !selectedServices.movie_watch
        ) {
          toast.error("Please select at least one service");
          return false;
        }
        if (selectedServices.film_trade && !selectedPackageId) {
          toast.error("Please select a Film Trade package");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // ✅ Navigation
  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!selectedServices.film_trade) return 0;
    const pkg = packages.find((p) => p._id === selectedPackageId);
    return pkg?.price || 0;
  }, [selectedServices.film_trade, selectedPackageId, packages]);

  // Check if any service is selected
  const hasSelectedService =
    selectedServices.film_trade ||
    selectedServices.events ||
    selectedServices.movie_watch;

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedCredentials, setSubmittedCredentials] = useState(null);

  const buildValidationPayload = () => ({
    vendorName: formData.vendorName,
    businessType: formData.businessType,
    gstNumber: formData.gstNumber || undefined,
    country: formData.country,
    address: formData.address,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
  });

  const runBackendValidation = async () => {
    const validationRes = await validateApplication(
      buildValidationPayload(),
    ).unwrap();

    if (!validationRes.isValid) {
      throw new Error(validationRes.message || "Validation failed");
    }

    return validationRes;
  };

  // ✅ Submit form after payment (or directly if no payment needed)
  const submitApplication = async (paymentInfo = null) => {
    try {
      const form = new FormData();

      const vendorFields = [
        "vendorName",
        "businessType",
        "gstNumber",
        "country",
        "address",
        "email",
        "phone",
        "password",
      ];
      vendorFields.forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          form.append(key, value);
        }
      });

      // Build selected services array
      const services = [];
      if (selectedServices.film_trade && selectedPackageId) {
        services.push({
          serviceType: "film_trade",
          packageId: selectedPackageId,
        });
      }
      if (selectedServices.events) {
        services.push({
          serviceType: "events",
          isGovernmentEvent: isGovernmentEvent,
        });
      }
      if (selectedServices.movie_watch) {
        services.push({ serviceType: "movie_watch" });
      }

      form.append("selectedServices", JSON.stringify(services));

      // Add payment info if provided
      if (paymentInfo) {
        form.append("paymentInfo", JSON.stringify(paymentInfo));
      }

      const res = await createVendor(form).unwrap();
      console.log("Vendor Application Submitted ✅:", res);

      // Store credentials if returned
      if (res?.data?.tempCredentials) {
        setSubmittedCredentials(res.data.tempCredentials);
      } else {
        setSubmittedCredentials(null);
      }

      // Show Success Modal
      setShowSuccessModal(true);

      // Reset form
      setFormData({
        vendorName: "",
        businessType: "",
        gstNumber: "",
        country: "IN",
        address: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setSelectedServices({
        film_trade: false,
        events: false,
        movie_watch: false,
      });
      setSelectedPackageId(null);
      setIsGovernmentEvent(false);
      // We keep the final step visible until they close modal or go home
    } catch (err) {
      console.log("❌ Full error object:", err);
      let message = "Failed to submit form";
      if (err?.data?.message) {
        message = err.data.message;
      } else if (err?.data?.errorMessages?.length) {
        message = err.data.errorMessages.map((e) => e.message).join(", ");
      } else if (err?.error) {
        message = err.error;
      }
      toast.error(`❌ ${message}`);
    }
  };

  // ✅ Handle Razorpay Payment
  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Payment system not loaded. Please refresh the page.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Validate all form fields on the server before opening payment
      await runBackendValidation();

      // Create payment order only after validation passes
      const orderRes = await createPaymentOrder({
        packageId: selectedPackageId,
        customerDetails: {
          name: formData.vendorName,
          email: formData.email,
          phone: formData.phone,
        },
      }).unwrap();

      const { orderId, amount, razorpayOrderId, currency } = orderRes.data;

      // Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderRes.data.keyId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency || "INR",
        name: "MovieMart",
        description: "Vendor Package Payment",
        order_id: razorpayOrderId,
        prefill: {
          name: formData.vendorName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#EF4444",
        },
        handler: async function (response) {
          try {
            // Verify payment with Razorpay signature
            const verifyRes = await verifyPayment({
              orderId: orderId,
              paymentDetails: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            }).unwrap();

            if (verifyRes?.data?.verified) {
              toast.success(
                "Payment successful! Submitting your application...",
              );

              // Submit form with payment info
              await submitApplication({
                status: "completed",
                amount: amount,
                transactionId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                paymentMethod: "razorpay",
              });
            } else {
              toast.error(
                "Payment verification failed. Please contact support.",
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setIsProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      // Show specific validation error if available
      const errorMessage =
        err?.message ||
        err?.data?.message ||
        err?.data?.errors?.[0] ||
        "Failed to initiate payment";
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-validate all steps before payment or submission
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    if (!hasSelectedService) {
      toast.error("Please select at least one service");
      return;
    }

    if (selectedServices.film_trade && !selectedPackageId) {
      toast.error("Please select a Film Trade package");
      return;
    }

    // If Film Trade is selected, process payment first (validation happens inside handlePayment)
    if (selectedServices.film_trade && totalAmount > 0) {
      await handlePayment();
    } else {
      // No payment needed - but still validate on the server first
      setIsProcessingPayment(true);
      try {
        await runBackendValidation();

        // Validation passed, submit directly
        await submitApplication();
      } catch (err) {
        const errorMessage =
          err?.message ||
          err?.data?.message ||
          err?.data?.errors?.[0] ||
          "Validation failed";
        toast.error(errorMessage);
      } finally {
        setIsProcessingPayment(false);
      }
    }
  };

  if (packagesLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1730] via-[#1a1f3a] to-[#0B1730] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="max-w-5xl mx-auto mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 rounded-full px-4 py-2 mb-4">
            <FaRocket className="text-pink-400" />
            <span className="text-pink-400 text-sm font-semibold">
              Start Earning on Movie Mart
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">
              Movie Mart Vendor
            </span>{" "}
            & Start Earning
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto mb-4">
            Join creators, producers & event organisers who are earning by
            trading films, selling tickets, and streaming content on Movie Mart.
          </p>
          <p className="text-pink-400 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
            Choose how you want to earn on Movie Mart.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm max-w-2xl mx-auto mt-2">
            Select one or more services below and start monetising your content,
            events, or films on a trusted platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress Stepper */}
          <div className="mb-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-700 -z-10">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-500"
                  style={{
                    width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {steps.map((label, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center relative z-10"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${
                      step === i + 1
                        ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/50 scale-110"
                        : step > i + 1
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {step > i + 1 ? <FaCheckCircle /> : i + 1}
                  </div>
                  <p
                    className={`mt-2 text-xs sm:text-sm font-medium hidden sm:block ${
                      step === i + 1
                        ? "text-pink-400"
                        : step > i + 1
                          ? "text-green-400"
                          : "text-gray-500"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-2xl">
            <form onSubmit={handleSubmit}>
              {/* Step 1 - Vendor Info */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <FaShieldAlt className="text-pink-400" />
                      Vendor Information
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Tell us about yourself and your business
                    </p>
                  </div>

                  {[
                    {
                      label: "Full Name",
                      name: "vendorName",
                      type: "text",
                      required: true,
                      placeholder: "John Doe",
                    },
                    {
                      label: "Business Name",
                      name: "businessType",
                      type: "text",
                      required: true,
                      placeholder: "Your Company Name",
                    },
                    {
                      label: "GST Number",
                      name: "gstNumber",
                      type: "text",
                      required: false,
                      placeholder: formData.country === "IN" ? "e.g. 27ABCDE1234F1Z5" : "Optional",
                    },
                    {
                      label: "Email Address",
                      name: "email",
                      type: "email",
                      required: true,
                      placeholder: "you@example.com",
                    },
                    {
                      label: "Phone Number",
                      name: "phone",
                      type: "tel",
                      required: true,
                      placeholder: formData.country === "IN" ? "10-digit mobile (e.g. 9876543210)" : "+1 234 567 8900",
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="text-gray-300 font-medium mb-2 block">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-900 border border-gray-600 text-white text-sm py-3 px-4 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder-gray-500"
                      />
                    </div>
                  ))}

                  {/* Password Fields */}
                  <div className="mt-2 p-4 bg-pink-500/5 border border-pink-500/20 rounded-xl space-y-4">
                    <p className="text-pink-400 text-xs font-semibold flex items-center gap-2">
                      🔒 Set your Vendor Panel password — you'll use this to log in immediately after registration
                    </p>

                    {/* Password */}
                    <div>
                      <label className="text-gray-300 font-medium mb-2 block">
                        Panel Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="Min. 8 characters"
                          className="w-full bg-gray-900 border border-gray-600 text-white text-sm py-3 px-4 pr-12 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="text-gray-300 font-medium mb-2 block">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="Re-enter your password"
                          className={`w-full bg-gray-900 border text-white text-sm py-3 px-4 pr-12 rounded-lg focus:ring-2 transition-all placeholder-gray-500 ${
                            formData.confirmPassword && formData.password !== formData.confirmPassword
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : formData.confirmPassword && formData.password === formData.confirmPassword
                              ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                              : "border-gray-600 focus:ring-pink-500 focus:border-pink-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
                      )}
                    </div>
                  </div>



                  {/* Country Selection */}
                  <div>
                    <label className="text-gray-300 flex items-center gap-2">
                      <FaGlobe className="text-pink-400" />
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-600 text-white text-sm py-3 px-4 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium mb-2 block">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Enter your complete business address"
                      className="w-full bg-gray-900 border border-gray-600 text-white text-sm py-3 px-4 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder-gray-500 resize-none"
                    />
                  </div>
                </div>
              )}

         

              {/* Step 2 - Select Services */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <p className="text-gray-300 text-sm mb-4">
                    Select the services you want to offer on MovieMart. You can
                    choose one or more services.
                  </p>

                  {/* Film Trade Service */}
                  <div
                    className={`rounded-2xl border-2 p-5 transition-all ${selectedServices.film_trade ? "border-blue-500 bg-blue-500/10" : "border-gray-600 bg-white/5"}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedServices.film_trade}
                        onChange={(e) => {
                          setSelectedServices((prev) => ({
                            ...prev,
                            film_trade: e.target.checked,
                          }));
                          if (!e.target.checked) setSelectedPackageId(null);
                        }}
                        className="w-5 h-5 mt-1 accent-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                          🎬 Film Trade
                          <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
                            Premium Trading Access
                          </span>
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">
                          List your movies, web series or short films. Sell,
                          license, trade and connect with verified buyers across
                          India & abroad.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-green-400">
                            <FaCheckCircle className="text-xs" /> Secure deals
                          </span>
                          <span className="flex items-center gap-1 text-green-400">
                            <FaCheckCircle className="text-xs" /> Verified
                            buyers
                          </span>
                          <span className="flex items-center gap-1 text-green-400">
                            <FaCheckCircle className="text-xs" /> Global reach
                          </span>
                        </div>

                        {selectedServices.film_trade && (
                          <div className="mt-4">
                            {!selectedPackageId && (
                              <p className="text-red-400 text-sm mb-3 flex items-center gap-2">
                                <span>⚠️</span> Please select a package to
                                continue
                              </p>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {packages.map((pkg) => (
                                <label
                                  key={pkg._id}
                                  className={`relative block rounded-xl border p-4 cursor-pointer transition-all ${
                                    selectedPackageId === pkg._id
                                      ? "border-blue-400 bg-blue-500/20 ring-2 ring-blue-400"
                                      : "border-gray-500 bg-white/5 hover:border-gray-400"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="package"
                                    checked={selectedPackageId === pkg._id}
                                    onChange={() =>
                                      setSelectedPackageId(pkg._id)
                                    }
                                    className="absolute top-3 right-3 w-4 h-4 accent-blue-500"
                                  />
                                  {pkg.isPopular && (
                                    <span className="absolute -top-2 left-3 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-semibold">
                                      Most Popular
                                    </span>
                                  )}
                                  <h4 className="font-bold text-white">
                                    {pkg.name === "Gold"
                                      ? "🟡 Gold Package"
                                      : pkg.name === "Platinum"
                                        ? "🔵 Platinum Package"
                                        : pkg.name}
                                  </h4>
                                  <p className="text-2xl font-bold text-blue-400 my-2">
                                    {(() => {
                                      const priceInfo = getPackagePrice(pkg);
                                      return `${priceInfo.currencySymbol}${priceInfo.price?.toLocaleString()}`;
                                    })()}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {(() => {
                                      const d = Number(pkg.duration) || 0;
                                      const t = (pkg.durationType || 'months').toLowerCase();
                                      // Singularize unit when duration is 1 (e.g. "1 month" not "1 months")
                                      const unit = d === 1 ? t.replace(/s$/, '') : t;
                                      return `for ${d} ${unit}`;
                                    })()}
                                  </p>
                                  <ul className="mt-3 space-y-1.5">
                                    {pkg.features?.slice(0, 4).map((f, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-gray-300 flex items-start gap-1.5"
                                      >
                                        <FaCheckCircle className="text-green-400 text-[10px] mt-0.5 flex-shrink-0" />{" "}
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {pkg.name === "Gold" && (
                                    <p className="text-[10px] text-gray-500 mt-2 italic">
                                      Recommended for independent creators &
                                      first-time traders
                                    </p>
                                  )}
                                  {pkg.name === "Platinum" && (
                                    <p className="text-[10px] text-gray-500 mt-2 italic">
                                      Ideal for producers, distributors &
                                      studios
                                    </p>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Events Service */}
                  <div
                    className={`rounded-2xl border-2 p-5 transition-all ${selectedServices.events ? "border-yellow-500 bg-yellow-500/10" : "border-gray-600 bg-white/5"}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedServices.events}
                        onChange={(e) => {
                          setSelectedServices((prev) => ({
                            ...prev,
                            events: e.target.checked,
                          }));
                          if (!e.target.checked) setIsGovernmentEvent(false);
                        }}
                        className="w-5 h-5 mt-1 accent-yellow-500"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                          🎭 Events
                          <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">
                            No Upfront Cost
                          </span>
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">
                          Host events, concerts, shows, plays, workshops and
                          reach the right audience instantly.
                        </p>

                        {/* Government Event Option */}
                        {selectedServices.events && (
                          <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isGovernmentEvent}
                                onChange={(e) =>
                                  setIsGovernmentEvent(e.target.checked)
                                }
                                className="w-5 h-5 mt-0.5 accent-green-500"
                              />
                              <div>
                                <span className="text-green-400 font-semibold text-sm flex items-center gap-2">
                                  🏛️ This is a Government Event
                                  <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">
                                    Fixed 10% Fee
                                  </span>
                                </span>
                                <p className="text-xs text-gray-400 mt-1">
                                  Government-sponsored events, cultural
                                  festivals, public programs, and official
                                  ceremonies qualify for a fixed 10% platform
                                  fee.
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

                        <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-yellow-400 font-semibold text-sm mb-1">
                            Platform Fee: {isGovernmentEvent ? "10" : eventFee}%
                            {isGovernmentEvent && (
                              <span className="ml-2 text-xs text-green-400">
                                (Government Event Rate)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mb-2">
                            Deducted only after a successful ticket sale
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs mt-2">
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> Easy
                              ticketing
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> Post-event
                              payouts
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> Refund
                              protection
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Movie Watch Service */}
                  <div
                    className={`rounded-2xl border-2 p-5 transition-all ${selectedServices.movie_watch ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 bg-white/5"}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedServices.movie_watch}
                        onChange={(e) =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            movie_watch: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 mt-1 accent-cyan-500"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                          🎥 Movie Watch
                          <span className="text-xs bg-cyan-500 text-black px-2 py-1 rounded-full">
                            No Upfront Cost
                          </span>
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">
                          Upload & stream your movies or web series and let
                          viewers rent or purchase directly on Movie Mart.
                        </p>
                        <div className="mt-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <p className="text-cyan-400 font-semibold text-sm mb-1">
                            Revenue Share: {movieWatchFee}% to You
                          </p>
                          <p className="text-xs text-gray-400 mb-2">
                            Paid on every movie sale or rental
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs mt-2">
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> You keep
                              ownership
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> Transparent
                              earnings
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <FaCheckCircle className="text-xs" /> Secure
                              streaming
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Summary */}
                  {hasSelectedService && (
                    <div className="mt-6 p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-600 shadow-lg">
                      <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2">
                        <span className="text-xl">📋</span> Summary of Your
                        Selected Services
                      </h4>
                      <div className="space-y-3 text-sm">
                        {selectedServices.film_trade && selectedPackageId && (
                          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                            <span className="flex items-center gap-2 text-gray-200">
                              <FaCheckCircle className="text-blue-400" />
                              <span>
                                🎬 Film Trade{" "}
                                {
                                  packages.find(
                                    (p) => p._id === selectedPackageId,
                                  )?.name
                                }{" "}
                                Package
                              </span>
                            </span>
                            <span className="text-white font-bold">
                              {userCountry?.currencySymbol || "₹"}
                              {totalAmount.toLocaleString()} / month
                            </span>
                          </div>
                        )}
                        {selectedServices.events && (
                          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <span className="flex items-center gap-2 text-gray-200">
                              <FaCheckCircle className="text-yellow-400" />
                              <span>🎭 Events Ticketing Service</span>
                              {isGovernmentEvent && (
                                <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">
                                  🏛️ Govt
                                </span>
                              )}
                            </span>
                            <span className="text-green-400 font-semibold text-xs">
                              ₹0 Upfront ({isGovernmentEvent ? "10" : eventFee}%
                              per ticket sale)
                            </span>
                          </div>
                        )}
                        {selectedServices.movie_watch && (
                          <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                            <span className="flex items-center gap-2 text-gray-200">
                              <FaCheckCircle className="text-cyan-400" />
                              <span>🎥 Movie Watch Streaming Service</span>
                            </span>
                            <span className="text-green-400 font-semibold text-xs">
                              ₹0 Upfront (Revenue share: {movieWatchFee}%)
                            </span>
                          </div>
                        )}
                        <hr className="border-gray-600 my-3" />
                        <div className="flex justify-between items-center text-base sm:text-lg font-bold p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg">
                          <span className="text-white flex items-center gap-2">
                            <FaShieldAlt className="text-blue-400" /> Total Due
                            Now
                          </span>
                          <span className="text-blue-400">
                            {userCountry?.currencySymbol || "₹"}
                            {totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-2">
                          <FaShieldAlt className="text-green-400" /> Secure
                          payment | No hidden charges | Cancel anytime
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 - Review */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Review Your Application
                  </h3>

                  {/* Vendor Info */}
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      👤 Vendor Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>{" "}
                        <span className="text-white">
                          {formData.vendorName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Business:</span>{" "}
                        <span className="text-white">
                          {formData.businessType}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Email:</span>{" "}
                        <span className="text-white">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Phone:</span>{" "}
                        <span className="text-white">{formData.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Country:</span>{" "}
                        <span className="text-white">{formData.country}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">GST:</span>{" "}
                        <span className="text-white">
                          {formData.gstNumber || "N/A"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Address:</span>{" "}
                        <span className="text-white">{formData.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Services */}
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      🎯 Selected Services
                    </h4>
                    <div className="space-y-3">
                      {selectedServices.film_trade && (
                        <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <div>
                            <span className="text-blue-400 font-semibold">
                              🎬 Film Trade
                            </span>
                            {selectedPackageId && (
                              <span className="ml-2 text-sm text-gray-300">
                                (
                                {
                                  packages.find(
                                    (p) => p._id === selectedPackageId,
                                  )?.name
                                }{" "}
                                Package)
                              </span>
                            )}
                          </div>
                          <span className="text-white font-bold">
                            ₹{totalAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedServices.events && (
                        <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                          <span className="text-yellow-400 font-semibold flex items-center gap-2">
                            🎭 Events
                            {isGovernmentEvent && (
                              <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">
                                🏛️ Government
                              </span>
                            )}
                          </span>
                          <span className="text-green-400">
                            Free ({isGovernmentEvent ? "10" : eventFee}% fee)
                          </span>
                        </div>
                      )}
                      {selectedServices.movie_watch && (
                        <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <span className="text-cyan-400 font-semibold">
                            🎥 Movie Watch
                          </span>
                          <span className="text-green-400">
                            Free ({movieWatchFee}% fee)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {totalAmount > 0 && (
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold text-lg">
                          Total Payment
                        </span>
                        <span className="text-2xl font-bold text-blue-400">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Payment will be processed after submission. You'll
                        receive a confirmation email.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 cursor-pointer bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-medium flex items-center justify-center gap-2 border border-gray-600"
                  >
                    <span>←</span> Previous
                  </button>
                )}
                {step < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-6 cursor-pointer py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                  >
                    Next <span>→</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={vendorLoading || isProcessingPayment}
                    className={`ml-auto px-8 py-4 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${
                      selectedServices.film_trade && totalAmount > 0
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/30"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : vendorLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : selectedServices.film_trade && totalAmount > 0 ? (
                      <>
                        <FaRocket />
                        Pay {userCountry?.currencySymbol || "₹"}
                        {totalAmount.toLocaleString()} & Submit
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Success Modal — Vendor is instantly approved, show login credentials */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-green-500/20">
                <FaCheckCircle />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                🎉 You&apos;re Approved!
              </h2>
              <p className="text-green-400 font-semibold mb-6 text-sm">
                Your vendor account is ready. Log in to your panel now.
              </p>

              {/* Credentials Card */}
              {submittedCredentials && (
                <div className="bg-gray-800 border border-green-500/30 rounded-2xl p-5 mb-6 text-left space-y-3">
                  <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-3">🔑 Your Login Credentials</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-4 py-3">
                      <span className="text-gray-400 text-xs font-medium">Email</span>
                      <span className="text-white text-sm font-mono font-semibold">{submittedCredentials.email}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-4 py-3">
                      <span className="text-gray-400 text-xs font-medium">Password</span>
                      <span className="text-white text-sm font-mono font-semibold">{submittedCredentials.password}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-4 py-3">
                      <span className="text-gray-400 text-xs font-medium">Panel URL</span>
                      <span className="text-pink-400 text-xs font-mono">panel.moviemart.org</span>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs text-center pt-1">📧 These credentials have also been sent to your email.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <a
                  href={submittedCredentials?.panelUrl || "https://panel.moviemart.org/auth/sign-in"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <FaRocket /> Login to Vendor Panel
                </a>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-medium hover:bg-white/10 transition-all"
                >
                  Go to Home Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BecomeAVendor;
