import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const aboutUsApi = createApi({
  reducerPath: "aboutUsApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
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
