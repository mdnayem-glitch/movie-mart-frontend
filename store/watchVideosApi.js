import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.moviemart.org/v1/api";

/** Watch Videos API with RTK Query **/
export const watchVideosApi = createApi({
  reducerPath: "watchVideosApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        // if (token) {
        //   headers.set("Authorization", `Bearer ${token}`);
        // }
      }
      return headers;
    },
  }),
  tagTypes: [
    "WatchVideos",
    "Channels",
    "WatchCategories",
    "VideoReviews",
    "VideoPurchases",
    "WatchHistory",
    "Subscriptions"
  ],
  endpoints: (builder) => ({
    // ==================== CHANNEL ENDPOINTS ====================

    /** Create channel */
    createChannel: builder.mutation({
      query: (channelData) => ({
        url: "/watch-videos/channels",
        method: "POST",
        body: channelData,
      }),
      invalidatesTags: ["Channels"],
    }),

    /** Get all channels */
    getChannels: builder.query({
      query: (params) => ({
        url: "/watch-videos/channels",
        params: params || {},
      }),
      transformResponse: (response) => ({
        channels: response.data,
        meta: response.meta,
      }),
      providesTags: ["Channels"],
    }),

    /** Get channel by ID */
    getChannelById: builder.query({
      query: (id) => `/watch-videos/channels/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Channels", id }],
    }),

    /** Update channel */
    updateChannel: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/watch-videos/channels/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Channels"],
    }),

    /** Delete channel */
    deleteChannel: builder.mutation({
      query: (id) => ({
        url: `/watch-videos/channels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Channels"],
    }),

    /** Subscribe to channel */
    subscribeToChannel: builder.mutation({
      query: ({ channelId, userId }) => ({
        url: `/watch-videos/channels/${channelId}/subscribe`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Channels", "Subscriptions"],
    }),

    /** Unsubscribe from channel */
    unsubscribeFromChannel: builder.mutation({
      query: ({ channelId, userId }) => ({
        url: `/watch-videos/channels/${channelId}/unsubscribe`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Channels", "Subscriptions"],
    }),

    /** Check subscription status */
    checkSubscription: builder.query({
      query: ({ channelId, userId }) => 
        `/watch-videos/channels/${channelId}/subscription`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, { channelId }) => [
        { type: "Subscriptions", id: channelId },
      ],
    }),

    /** Get user's subscribed channels */
    getUserSubscriptions: builder.query({
      query: (userId) => `/watch-videos/user/${userId}/subscriptions`,
      transformResponse: (response) => response.data,
      providesTags: ["Subscriptions"],
    }),

    /** Get channel videos */
    getChannelVideos: builder.query({
      query: ({ channelId, page = 1, limit = 10 }) => ({
        url: `/watch-videos/channels/${channelId}/videos`,
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        videos: response.data,
        meta: response.meta,
      }),
      providesTags: ["WatchVideos"],
    }),

    // ==================== CATEGORY ENDPOINTS ====================

    /** Create category */
    createWatchCategory: builder.mutation({
      query: (categoryData) => ({
        url: "/watch-videos/categories",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["WatchCategories"],
    }),

    /** Get all categories */
    getWatchCategories: builder.query({
      query: () => "/watch-videos/categories",
      transformResponse: (response) => response.data,
      providesTags: ["WatchCategories"],
    }),

    /** Update category */
    updateWatchCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/watch-videos/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["WatchCategories"],
    }),

    /** Delete category */
    deleteWatchCategory: builder.mutation({
      query: (id) => ({
        url: `/watch-videos/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WatchCategories"],
    }),

    // ==================== WATCH VIDEO ENDPOINTS ====================

    /** Create watch video */
    createWatchVideo: builder.mutation({
      query: (videoData) => ({
        url: "/watch-videos",
        method: "POST",
        body: videoData,
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    /** Get all watch videos */
    getWatchVideos: builder.query({
      query: (params) => {
        // Filter out empty string values to avoid validation errors
        const cleanParams = {};
        if (params) {
          Object.keys(params).forEach(key => {
            const value = params[key];
            // Only include non-empty values
            if (value !== '' && value !== null && value !== undefined) {
              cleanParams[key] = value;
            }
          });
        }
        return {
          url: "/watch-videos",
          params: cleanParams,
        };
      },
      transformResponse: (response) => ({
        videos: response.data,
        meta: response.meta,
      }),
      providesTags: ["WatchVideos"],
    }),

    /** Get watch video by ID */
    getWatchVideoById: builder.query({
      query: ({ id, userId, countryCode }) => {
        // Build params object, excluding null/undefined values
        const params = { countryCode };
        if (userId) params.userId = userId;
        return {
          url: `/watch-videos/${id}`,
          params,
        };
      },
      transformResponse: (response) => response.data,
      providesTags: (result, error, { id }) => [{ type: "WatchVideos", id }],
    }),

    /** Update watch video */
    updateWatchVideo: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/watch-videos/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    /** Delete watch video */
    deleteWatchVideo: builder.mutation({
      query: (id) => ({
        url: `/watch-videos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    /** Get featured videos */
    getFeaturedVideos: builder.query({
      query: (limit = 10) => ({
        url: "/watch-videos/featured",
        params: { limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ["WatchVideos"],
    }),

    /** Get trending videos */
    getTrendingVideos: builder.query({
      query: (limit = 10) => ({
        url: "/watch-videos/trending",
        params: { limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ["WatchVideos"],
    }),

    /** Get recommended videos */
    getRecommendedVideos: builder.query({
      query: ({ videoId, limit = 10 }) => ({
        url: "/watch-videos/recommended",
        params: { videoId, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ["WatchVideos"],
    }),

    /** Get related videos for "Related For You" section based on genres/category */
    getRelatedVideos: builder.query({
      query: ({ videoId, genres, categoryId, limit = 10 }) => {
        const params = { limit, status: 'published' };
        if (genres && genres.length > 0) {
          params.genres = genres.join(',');
        }
        if (categoryId) {
          params.categoryId = categoryId;
        }
        return {
          url: "/watch-videos",
          params,
        };
      },
      transformResponse: (response, meta, arg) => {
        // Filter out the current video from results
        const videos = response.data || [];
        return videos.filter(v => v._id !== arg.videoId);
      },
      providesTags: ["WatchVideos"],
    }),

    /** Get videos by home section */
    getVideosByHomeSection: builder.query({
      query: ({ homeSection, limit = 10 }) => ({
        url: "/watch-videos",
        params: { homeSection, limit, status: 'published' },
      }),
      transformResponse: (response) => ({
        videos: response.data || [],
        meta: response.meta,
      }),
      providesTags: ["WatchVideos"],
    }),

    // ==================== EPISODE ENDPOINTS ====================

    /** Add season to video */
    addSeason: builder.mutation({
      query: ({ videoId, seasonData }) => ({
        url: `/watch-videos/${videoId}/seasons`,
        method: "POST",
        body: seasonData,
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    /** Add episode to season */
    addEpisode: builder.mutation({
      query: ({ videoId, seasonNumber, episodeData }) => ({
        url: `/watch-videos/${videoId}/seasons/${seasonNumber}/episodes`,
        method: "POST",
        body: episodeData,
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    // ==================== REVIEW ENDPOINTS ====================

    /** Add/update review */
    addVideoReview: builder.mutation({
      query: ({ videoId, reviewData }) => ({
        url: `/watch-videos/${videoId}/reviews`,
        method: "POST",
        body: reviewData,
      }),
      invalidatesTags: ["VideoReviews", "WatchVideos"],
    }),

    /** Get video reviews */
    getVideoReviews: builder.query({
      query: ({ videoId, page = 1, limit = 10 }) => ({
        url: `/watch-videos/${videoId}/reviews`,
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        reviews: response.data,
        meta: response.meta,
      }),
      providesTags: ["VideoReviews"],
    }),

    // ==================== LIKE ENDPOINTS ====================

    /** Toggle like */
    toggleVideoLike: builder.mutation({
      query: ({ videoId, userId }) => ({
        url: `/watch-videos/${videoId}/like`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["WatchVideos"],
    }),

    /** Check like status */
    checkLikeStatus: builder.query({
      query: ({ videoId, userId }) => `/watch-videos/${videoId}/like/${userId}`,
      transformResponse: (response) => response.data,
    }),

    // ==================== WATCH HISTORY ENDPOINTS ====================

    /** Update watch progress */
    updateWatchProgress: builder.mutation({
      query: ({ videoId, progressData }) => ({
        url: `/watch-videos/${videoId}/progress`,
        method: "POST",
        body: progressData,
      }),
      invalidatesTags: ["WatchHistory"],
    }),

    /** Get watch history */
    getWatchHistory: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/watch-videos/user/${userId}/history`,
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        history: response.data,
        meta: response.meta,
      }),
      providesTags: ["WatchHistory"],
    }),

    /** Get continue watching */
    getContinueWatching: builder.query({
      query: ({ userId, limit = 10 }) => ({
        url: `/watch-videos/user/${userId}/continue-watching`,
        params: { limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ["WatchHistory"],
    }),

    // ==================== PURCHASE ENDPOINTS ====================

    /** Get user's purchases */
    getUserPurchases: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/watch-videos/user/${userId}/purchases`,
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        purchases: response.data,
        meta: response.meta,
      }),
      providesTags: ["VideoPurchases"],
    }),

    /** Check video access */
    checkVideoAccess: builder.query({
      query: ({ videoId, userId }) => `/watch-videos/${videoId}/access/${userId}`,
      transformResponse: (response) => response.data,
    }),

    // ==================== PAYMENT ENDPOINTS ====================

    /** Create payment order */
    createVideoPaymentOrder: builder.mutation({
      query: ({ videoId, orderData }) => ({
        url: `/watch-videos/${videoId}/payment/create-order`,
        method: "POST",
        body: orderData,
      }),
    }),

    /** Verify payment */
    verifyVideoPayment: builder.query({
      query: (orderId) => `/watch-videos/payment/verify/${orderId}`,
      transformResponse: (response) => response.data,
    }),

    /** Get payment status */
    getVideoPaymentStatus: builder.query({
      query: (orderId) => `/watch-videos/payment/status/${orderId}`,
      transformResponse: (response) => response.data,
    }),

    /** Initiate refund */
    initiateVideoRefund: builder.mutation({
      query: ({ purchaseId, reason }) => ({
        url: `/watch-videos/payment/refund/${purchaseId}`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["VideoPurchases"],
    }),

    /** Get all purchases (admin) */
    getAllPurchases: builder.query({
      query: (params) => ({
        url: "/watch-videos/purchases",
        params: params || {},
      }),
      transformResponse: (response) => ({
        purchases: response.data,
        meta: response.meta,
      }),
      providesTags: ["VideoPurchases"],
    }),

    /** Get vendor purchases */
    getVendorPurchases: builder.query({
      query: ({ vendorId, page = 1, limit = 10, startDate, endDate }) => ({
        url: `/watch-videos/vendor/${vendorId}/purchases`,
        params: { page, limit, startDate, endDate },
      }),
      transformResponse: (response) => ({
        purchases: response.data,
        meta: response.meta,
      }),
      providesTags: ["VideoPurchases"],
    }),

    // ==================== SECURE VIDEO STREAMING ====================

    /** Get secure video stream URL (requires purchase for paid videos) */
    getSecureVideoStream: builder.query({
      query: ({ videoId, userId }) => ({
        url: `/watch-videos/${videoId}/stream`,
        params: userId ? { userId } : {},
      }),
      transformResponse: (response) => response.data,
    }),

    /** Verify stream access token */
    verifyStreamAccess: builder.query({
      query: (token) => ({
        url: `/watch-videos/stream/verify`,
        params: { token },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Channel hooks
  useCreateChannelMutation,
  useGetChannelsQuery,
  useGetChannelByIdQuery,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
  useSubscribeToChannelMutation,
  useUnsubscribeFromChannelMutation,
  useCheckSubscriptionQuery,
  useGetUserSubscriptionsQuery,
  useGetChannelVideosQuery,
  
  // Category hooks
  useCreateWatchCategoryMutation,
  useGetWatchCategoriesQuery,
  useUpdateWatchCategoryMutation,
  useDeleteWatchCategoryMutation,
  
  // Watch Video hooks
  useCreateWatchVideoMutation,
  useGetWatchVideosQuery,
  useGetWatchVideoByIdQuery,
  useLazyGetWatchVideoByIdQuery,
  useUpdateWatchVideoMutation,
  useDeleteWatchVideoMutation,
  useGetFeaturedVideosQuery,
  useGetTrendingVideosQuery,
  useGetRecommendedVideosQuery,
  useGetRelatedVideosQuery,
  useGetVideosByHomeSectionQuery,
  
  // Episode hooks
  useAddSeasonMutation,
  useAddEpisodeMutation,
  
  // Review hooks
  useAddVideoReviewMutation,
  useGetVideoReviewsQuery,
  
  // Like hooks
  useToggleVideoLikeMutation,
  useCheckLikeStatusQuery,
  
  // Watch History hooks
  useUpdateWatchProgressMutation,
  useGetWatchHistoryQuery,
  useGetContinueWatchingQuery,
  
  // Purchase hooks
  useGetUserPurchasesQuery,
  useCheckVideoAccessQuery,
  useLazyCheckVideoAccessQuery,
  
  // Payment hooks
  useCreateVideoPaymentOrderMutation,
  useVerifyVideoPaymentQuery,
  useLazyVerifyVideoPaymentQuery,
  useGetVideoPaymentStatusQuery,
  useLazyGetVideoPaymentStatusQuery,
  useInitiateVideoRefundMutation,
  useGetAllPurchasesQuery,
  useGetVendorPurchasesQuery,
  
  // Secure streaming hooks
  useGetSecureVideoStreamQuery,
  useLazyGetSecureVideoStreamQuery,
  useVerifyStreamAccessQuery,
  useLazyVerifyStreamAccessQuery,
} = watchVideosApi;
