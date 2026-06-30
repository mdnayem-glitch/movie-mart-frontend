import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

export const watchlistApi = createApi({
  reducerPath: "watchlistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Watchlist"],
  endpoints: (builder) => ({
    addToWatchlist: builder.mutation({
      query: ({ itemType, itemId }) => ({
        url: "/watchlist",
        method: "POST",
        body: { itemType, itemId },
      }),
      invalidatesTags: ["Watchlist"],
    }),

    removeFromWatchlist: builder.mutation({
      query: ({ itemType, itemId }) => ({
        url: "/watchlist",
        method: "DELETE",
        body: { itemType, itemId },
      }),
      invalidatesTags: ["Watchlist"],
    }),

    checkWatchlistStatus: builder.query({
      query: ({ itemType, itemId }) => `/watchlist/check/${itemType}/${itemId}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, { itemType, itemId }) => [
        { type: "Watchlist", id: `${itemType}-${itemId}` },
      ],
    }),

    getUserWatchlist: builder.query({
      query: ({ itemType, page = 1, limit = 20 }) => {
        const params = { page, limit };
        if (itemType) params.itemType = itemType;
        return {
          url: "/watchlist",
          params,
        };
      },
      transformResponse: (response) => ({
        items: response.data,
        meta: response.meta,
      }),
      providesTags: ["Watchlist"],
    }),

    getWatchlistCounts: builder.query({
      query: () => "/watchlist/counts",
      transformResponse: (response) => response.data,
      providesTags: ["Watchlist"],
    }),
  }),
});

export const {
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useCheckWatchlistStatusQuery,
  useGetUserWatchlistQuery,
  useGetWatchlistCountsQuery,
} = watchlistApi;
