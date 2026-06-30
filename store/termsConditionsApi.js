import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const termsConditionsApi = createApi({
  reducerPath: "termsConditionsApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["termsConditionsApi"],
  endpoints: (builder) => ({
    /** Get all banners */
    getTermsConditions: builder.query({
      query: () => "/terms-condition",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["termsConditionsApi"],
    }),
  }),
});

export const { useGetTermsConditionsQuery } = termsConditionsApi;
