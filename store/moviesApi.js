import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.moviemart.org/v1/api";

/** Movies API **/
export const moviesApi = createApi({
  reducerPath: "moviesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Movies"],
  endpoints: (builder) => ({
    /** Get all movies with optional search and filters */
    getMovies: builder.query({
      query: (params) => {
        // Filter out empty values
        const cleanParams = {};
        if (params) {
          Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== '' && value !== null && value !== undefined) {
              cleanParams[key] = value;
            }
          });
        }
        return {
          url: "/movies",
          params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
        };
      },
      transformResponse: (response) => ({
        data: Array.isArray(response.data) ? response.data : [response.data],
        meta: response.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
      }),
      providesTags: ["Movies"],
    }),

    /** Get single movie by ID */
    getMovieById: builder.query({
      query: (id) => `/movies/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Movies", id }],
    }),

    /** Get movie reviews */
    getMovieReviews: builder.query({
      query: ({ id, page = 1, limit = 10 }) => 
        `/movies/${id}/reviews?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        reviews: response.data,
        meta: response.meta,
      }),
      providesTags: (result, error, { id }) => [{ type: "Movies", id: `reviews-${id}` }],
    }),

    /** Get upcoming movies */
    getUpcomingMovies: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/movies/upcoming?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        movies: response.data,
        meta: response.meta,
      }),
      providesTags: ["Movies"],
    }),

    /** Get top rated movies */
    getTopRatedMovies: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/movies/top-rated?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        movies: response.data,
        meta: response.meta,
      }),
      providesTags: ["Movies"],
    }),

    /** Get movies by genre */
    getMoviesByGenre: builder.query({
      query: ({ genre, page = 1, limit = 10 }) => 
        `/movies/genre/${genre}?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        movies: response.data,
        meta: response.meta,
      }),
      providesTags: ["Movies"],
    }),

    /** Get movies by home section */
    getMoviesByHomeSection: builder.query({
      query: ({ homeSection, limit = 10 }) => ({
        url: "/movies",
        params: { homeSection, limit },
      }),
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["Movies"],
    }),
  }),
});

export const { 
  useGetMoviesQuery, 
  useGetMovieByIdQuery,
  useGetMovieReviewsQuery,
  useGetUpcomingMoviesQuery,
  useGetTopRatedMoviesQuery,
  useGetMoviesByGenreQuery,
  useGetMoviesByHomeSectionQuery,
} = moviesApi;
