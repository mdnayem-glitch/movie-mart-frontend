import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Home Banner API **/
export const privacyPolicyApi = createApi({
  reducerPath: "privacyPolicyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/v1/api",
  }),
  tagTypes: ["privacyPolicyApi"],
  endpoints: (builder) => ({
    /** Get all banners */
    getprivacyPolicy: builder.query({
      query: () => "/privacy-policy",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["privacyPolicyApi"],
    }),
  }),
});

export const { useGetprivacyPolicyQuery } = privacyPolicyApi;
