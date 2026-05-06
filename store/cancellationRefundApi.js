import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cancellationRefundApi = createApi({
  reducerPath: "cancellationRefundApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
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
