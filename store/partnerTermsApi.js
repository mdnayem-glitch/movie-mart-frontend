import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const partnerTermsApi = createApi({
  reducerPath: "partnerTermsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
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
