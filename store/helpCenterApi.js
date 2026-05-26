import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const helpCenterApi = createApi({
  reducerPath: "helpCenterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["helpCenterApi"],
  endpoints: (builder) => ({
    /** Get all banners */
    getHelpCenter: builder.query({
      query: () => "/help-center",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["helpCenterApi"],
    }),
  }),
});

export const { useGetHelpCenterQuery } = helpCenterApi;
