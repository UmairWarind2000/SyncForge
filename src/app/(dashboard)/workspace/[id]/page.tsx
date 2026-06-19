// src/app/(dashboard)/workspace/[id]/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Users, CheckSquare, Code2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { formatDate } from "@/lib/utils";
import { SprintReportModal } from "@/components/ai/SprintReportModal";

type PageProps = { params: Promise<{ id: string }> };

export default async function WorkspacePage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    const workspace = await prisma.workspace.findFirst({
        where: {
            id,
            OR: [
                { ownerId: session!.user.id },
                { members: { some: { userId: session!.user.id } } },
            ],
        },
        include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } },
                },
                orderBy: { joinedAt: "asc" },
            },
            _count: { select: { tasks: true, files: true, messages: true } },
        },
    });

    if (!workspace) notFound();

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Workspace header */}
            <div className="flex items-start gap-4 mb-8">
                <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: workspace.color }}
                >
                    {workspace.name[0].toUpperCase()}
                </div>
                <SprintReportModal
                    workspaceId={workspace.id}
                    workspaceName={workspace.name}
                />
                <div>
                    <h1 className="text-2xl font-bold">{workspace.name}</h1>
                    {workspace.description && (
                        <p className="text-muted-foreground mt-1">{workspace.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(workspace.createdAt)}
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Tasks", value: workspace._count.tasks, icon: CheckSquare },
                    { label: "Files", value: workspace._count.files, icon: Code2 },
                    { label: "Messages", value: workspace._count.messages, icon: Calendar },
                    { label: "Members", value: workspace.members.length, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Team members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {workspace.members.map(({ user, role, joinedAt }) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UserAvatar name={user.name} image={user.image} size="sm" />
                                    <div>
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(joinedAt)}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                        {role.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}