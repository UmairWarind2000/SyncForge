// src/store/api/boardApi.ts


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ColumnWithTasks, TaskWithRelations } from "@/types";


export const boardApi = createApi({
    reducerPath: "boardApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/api" }),


    tagTypes: ["Board", "Task", "Chat", "Files"],


    endpoints: (builder) => ({


        // ── Columns ───────────────────────────────────────────────────────────


        getBoardData: builder.query<ColumnWithTasks[], string>({
            query: (workspaceId) => `/columns?workspaceId=${workspaceId}`,
            transformResponse: (res: { success: boolean; data: ColumnWithTasks[] }) =>
                res.data,
            providesTags: ["Board"],
        }),


        // ── Tasks ─────────────────────────────────────────────────────────────


        createTask: builder.mutation<
            TaskWithRelations,
            {
                workspaceId: string;
                columnId: string;
                title: string;
                description?: string;
                priority?: string;
                assigneeId?: string;
                dueDate?: string;
            }
        >({
            query: (body) => ({
                url: "/tasks",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Board"],
        }),


        updateTask: builder.mutation<
            TaskWithRelations,
            { id: string; workspaceId: string } & Partial<{
                title: string;
                description: string;
                priority: string;
                assigneeId: string | null;
                dueDate: string | null;
            }>
        >({
            query: ({ id, ...body }) => ({
                url: `/tasks/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Board"],
        }),


        moveTask: builder.mutation<
            void,
            {
                taskId: string;
                workspaceId: string;
                columnId: string;
                order: number;
            }
        >({
            query: ({ taskId, ...body }) => ({
                url: `/tasks/${taskId}/move`,
                method: "POST",
                body,
            }),
        }),


        deleteTask: builder.mutation<void, { id: string }>({
            query: ({ id }) => ({
                url: `/tasks/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Board"],
        }),


        // ── Chat ──────────────────────────────────────────────────────────────


        getMessages: builder.query<
            Array<{
                id: string;
                content: string;
                createdAt: string;
                authorId: string;
                authorName: string | null;
                authorImage: string | null;
            }>,
            string
        >({
            query: (workspaceId) => `/messages?workspaceId=${workspaceId}`,
            transformResponse: (res: { success: boolean; data: any[] }) =>
                res.data.map((m) => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.createdAt,
                    authorId: m.author.id,
                    authorName: m.author.name,
                    authorImage: m.author.image,
                })),
            providesTags: ["Chat"],
        }),


        // ── Files ─────────────────────────────────────────────────────────────


        getFiles: builder.query<
            Array<{
                id: string;
                name: string;
                path: string;
                language: string;
            }>,
            string
        >({
            query: (workspaceId) => `/files?workspaceId=${workspaceId}`,
            transformResponse: (res: { success: boolean; data: any[] }) =>
                res.data.map((f) => ({
                    id: f.id,
                    name: f.name,
                    path: f.path,
                    language: f.language,
                })),
            providesTags: ["Files"],
        }),


        createFile: builder.mutation<
            {
                id: string;
                name: string;
                path: string;
                language: string;
                content: string;
            },
            {
                workspaceId: string;
                name: string;
                path: string;
                language?: string;
            }
        >({
            query: (body) => ({
                url: "/files",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Files"],
        }),


        deleteFile: builder.mutation<void, { id: string }>({
            query: ({ id }) => ({
                url: `/files/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Files"],
        }),


        renameFile: builder.mutation<
            { id: string; name: string; path: string },
            { id: string; name: string; path: string }
        >({
            query: ({ id, ...body }) => ({
                url: `/files/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Files"],
        }),


    }),
});


export const {
    useGetBoardDataQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useMoveTaskMutation,
    useDeleteTaskMutation,
    useGetMessagesQuery,
    useGetFilesQuery,
    useCreateFileMutation,
    useDeleteFileMutation,
    useRenameFileMutation,
} = boardApi;