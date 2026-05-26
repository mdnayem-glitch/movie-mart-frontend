import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Button Data **/
export const btnData = [
  {
    id: 1,
    label: "Active",
    value: "active",
  },
  {
    id: 2,
    label: "Inactive",
    value: "inactive",
  },
];

/** Banner Type constants **/
export const BANNER_TYPES = {
  HOME: "home",
  FILM_MART: "film_mart",
  EVENTS: "events",
  WATCH_MOVIES: "watch_movies",
};

/** Home Banner API **/
export const homeBannerApi = createApi({
  reducerPath: "homeBannerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.moviemart.org/v1/api",
  }),
  tagTypes: ["homeBanner"],
  endpoints: (builder) => ({
    /** Get banners filtered by bannerType and platform */
    getBannersByType: builder.query({
      query: ({ bannerType, platform = "web" }) =>
        `/banners?bannerType=${bannerType}&platform=${platform}&active=true`,
      transformResponse: (response) =>
        Array.isArray(response.data) ? response.data : [response.data],
      providesTags: ["homeBanner"],
    }),
  }),
});

export const { useGetBannersByTypeQuery } = homeBannerApi;
