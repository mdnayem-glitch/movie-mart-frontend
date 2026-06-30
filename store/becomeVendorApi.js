import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const becomeVendorApi = createApi({
  reducerPath: "becomeVendorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["becomeVendorApi", "VendorPackages", "PlatformSettings"],
  endpoints: (builder) => ({
    // Get vendor packages (Film Trade)
    getVendorPackages: builder.query({
      query: () => "/vendors/packages?activeOnly=true",
      transformResponse: (response) => response.data || [],
      providesTags: ["VendorPackages"],
    }),

    // Get platform settings (fees)
    getPlatformSettings: builder.query({
      query: () => "/vendors/settings",
      transformResponse: (response) => response.data || [],
      providesTags: ["PlatformSettings"],
    }),

    // Validate vendor application before payment
    validateVendorApplication: builder.mutation({
      query: (data) => ({
        url: "/vendors/applications/validate",
        method: "POST",
        body: data,
      }),
    }),

    // Create payment order for vendor package
    createPaymentOrder: builder.mutation({
      query: (data) => ({
        url: "/vendors/payment/create-order",
        method: "POST",
        body: data,
      }),
    }),

    // Verify payment status
    verifyPayment: builder.mutation({
      query: ({ orderId, paymentDetails }) => ({
        url: `/vendors/payment/verify/${orderId}`,
        method: "POST",
        body: paymentDetails,
      }),
    }),

    // Create vendor application
    createVendorApplication: builder.mutation({
      query: (formData) => ({
        url: "/vendors/applications",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["becomeVendorApi"],
    }),
  }),
});

export const { 
  useGetVendorPackagesQuery,
  useGetPlatformSettingsQuery,
  useValidateVendorApplicationMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useCreateVendorApplicationMutation,
} = becomeVendorApi;
