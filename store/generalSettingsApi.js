import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ---------- API Slice ----------
export const generalSettingsApi = createApi({
  reducerPath: "generalSettingsApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["generalSettings"],
  endpoints: (builder) => ({
    getGeneralSettings: builder.query({
      query: () => "/general-settings",
      transformResponse: (response) => response.data,
      providesTags: ["generalSettings"],
    }),
  }),
});

export const { useGetGeneralSettingsQuery } = generalSettingsApi;
