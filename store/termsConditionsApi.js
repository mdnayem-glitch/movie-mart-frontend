import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const termsConditionsApi = createApi({
  reducerPath: "termsConditionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
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
