import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["subscription"],
  endpoints: (builder) => ({
    /** Get all banners */
    getSubscription: builder.query({
      query: () => "/subscription-plans",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["subscription"],
    }),
  }),
});

export const { useGetSubscriptionQuery } = subscriptionApi;
