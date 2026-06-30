import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const partnerTermsApi = createApi({
  reducerPath: "partnerTermsApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["partnerTermsApi"],
  endpoints: (builder) => ({
    getPartnerTerms: builder.query({
      query: () => "/partner-terms",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["partnerTermsApi"],
    }),
  }),
});

export const { useGetPartnerTermsQuery } = partnerTermsApi;
