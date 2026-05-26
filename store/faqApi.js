import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const faqApi = createApi({
  reducerPath: "faqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["Faq"], // ✅ Correct tag type name
  endpoints: (builder) => ({
    /** 🟢 Get all FAQs */
    getFaqs: builder.query({
      query: () => "/faqs",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["Faq"],
    }),
  }),
});

export const { useGetFaqsQuery } = faqApi;
