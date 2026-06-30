import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const contactUsApi = createApi({
  reducerPath: "contactUsApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["contactUsApi"],
  endpoints: (builder) => ({
    getContactUs: builder.query({
      query: () => "/contact-us",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["contactUsApi"],
    }),
  }),
});

export const { useGetContactUsQuery } = contactUsApi;
