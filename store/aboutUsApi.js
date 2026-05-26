import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const aboutUsApi = createApi({
  reducerPath: "aboutUsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
  }),
  tagTypes: ["aboutUsApi"],
  endpoints: (builder) => ({
    getAboutUs: builder.query({
      query: () => "/about-us",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["aboutUsApi"],
    }),
  }),
});

export const { useGetAboutUsQuery } = aboutUsApi;
