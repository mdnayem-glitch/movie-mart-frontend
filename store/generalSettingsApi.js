import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ---------- API Slice ----------
export const generalSettingsApi = createApi({
  reducerPath: "generalSettingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
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
