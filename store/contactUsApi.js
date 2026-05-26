import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const contactUsApi = createApi({
  reducerPath: "contactUsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
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
