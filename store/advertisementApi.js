import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const advertisementApi = createApi({
  reducerPath: "advertisementApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
  }),
  tagTypes: ["Ads"],
  endpoints: (builder) => ({
    getAds: builder.query({
      query: () => "/advertisements",
      transformResponse: (response) => {
        if (!response || !response.data) return [];
        return Array.isArray(response.data) ? response.data : [response.data];
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: "Ads", id: _id })), "Ads"]
          : ["Ads"],
    }),
  }),
});

export const { useGetAdsQuery } = advertisementApi;
