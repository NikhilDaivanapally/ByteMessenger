import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const apiSlice = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8000/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    Signup: builder.mutation({
      query: (data) => ({
        url: "/v1/auth/register",
        method: "POST",
        body: data,
      }),
    }),
    otpsubmit: builder.mutation({
      query: (data) => ({
        url: "/v1/auth/verifyotp",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/v1/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    success: builder.query({
      query: () => "/v1/auth/login/success",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),

    forgotpass: builder.mutation({
      query: (data) => ({
        url: "/v1/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    resetpass: builder.mutation({
      query: (data) => ({
        url: `/v1/auth/reset-password?`,
        method: "POST",
        body: data,
      }),
    }),

    getConversation: builder.mutation({
      query: (data) => ({
        url: `/v1/user/get_conversation`,
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: `/v1/auth/logout`,
        method: "POST",
      }),
    }),
    updateuser: builder.mutation({
      query: (data) => ({
        url: `/v1/user/update-profile`,
        method: "PATCH",
        body: data,
      }),
    }),
    users: builder.query({
      query: () => "/v1/user/get_users",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),
    friends: builder.query({
      query: () => "/v1/user/get_friends",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),
    friendrequests: builder.query({
      query: () => "/v1/user/get_friend_request",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),
    ExistingDirectConversations: builder.query({
      query: () => "/v1/user/get_direct_conversations",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),
    ExistingGroupConversations: builder.query({
      query: () => "/v1/user/get_group_conversations",
      keepUnusedDataFor: 2, // cache duration in seconds
    }),
    createGroup: builder.mutation({
      query: (data) => ({
        url: `/v1/user/create_group`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});
export const {
  useSignupMutation,
  useOtpsubmitMutation,
  useLoginMutation,
  useForgotpassMutation,
  useResetpassMutation,
  useUsersQuery,
  useFriendsQuery,
  useFriendrequestsQuery,
  useExistingDirectConversationsQuery,
  useExistingGroupConversationsQuery,
  useLogoutMutation,
  useUpdateuserMutation,
  useGetConversationMutation,
  useCreateGroupMutation,
  useLazySuccessQuery
} = apiSlice;
