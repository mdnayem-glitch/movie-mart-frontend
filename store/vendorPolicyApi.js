import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const vendorPolicyApi = createApi({
  reducerPath: "vendorPolicyApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["vendorPolicyApi"],
  endpoints: (builder) => ({
    /** Get all banners */
    getVendorPolicy: builder.query({
      query: () => "/vendor-policy",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["vendorPolicyApi"],
    }),
  }),
});

export const { useGetVendorPolicyQuery } = vendorPolicyApi;
