import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cancellationRefundApi = createApi({
  reducerPath: "cancellationRefundApi",
  baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  tagTypes: ["cancellationRefundApi"],
  endpoints: (builder) => ({
    getCancellationRefund: builder.query({
      query: () => "/cancellation-refund",
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["cancellationRefundApi"],
    }),
  }),
});

export const { useGetCancellationRefundQuery } = cancellationRefundApi;
