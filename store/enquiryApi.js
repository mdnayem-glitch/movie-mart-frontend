import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const enquiryApi = createApi({
  reducerPath: "enquiryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["enquiryApi"],
  endpoints: (builder) => ({
    /** GET all enquiries */
    getEnquiry: builder.query({
      query: () => "/inquiries",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["enquiryApi"],
    }),

    /** POST: Create enquiry */
    createEnquiry: builder.mutation({
      query: (body) => ({
        url: "/inquiries",
        method: "POST",
        body,
      }),
      invalidatesTags: ["enquiryApi"],
    }),
  }),
});

export const { useGetEnquiryQuery, useCreateEnquiryMutation } = enquiryApi;
