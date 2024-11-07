import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const PATCH = async (req) => {
  const url = new URL(req.url);
  const commentId = url.pathname.split("/").pop();
  const { action } = await req.json();

  const session = await getAuthSession();
  if (!session) {
    return new NextResponse(JSON.stringify({ message: "Not Authenticated!" }), {
      status: 401,
    });
  }

  let userId = session.user.id;
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  if (!commentId) {
    return new NextResponse(
      JSON.stringify({ message: "Comment ID is required" }),
      { status: 400 }
    );
  }

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        AND: [{ userId: userId }, { commentId: commentId }],
      },
    });

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { likes: true },
    });

    if (!comment) {
      return new NextResponse(
        JSON.stringify({ message: "Comment not found" }),
        { status: 404 }
      );
    }

    if (action === "like" && !existingLike) {
      const c = await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: userId,
            commentId: commentId,
          },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } },
        }),
      ]);
    } else if (action === "unlike" && existingLike) {
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
    }

    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        likedBy: {
          where: { userId: userId },
        },
      },
    });

    return new NextResponse(
      JSON.stringify({
        ...updatedComment,
        isLiked: updatedComment.likedBy.length > 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating comment likes:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Error updating comment likes",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
export const GET = async (req, { params }) => {
  const commentId = params.id;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        likedBy: {
          select: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });
    const likedUsers = comment ? comment.likedBy.map((like) => like.user) : [];

    const users = likedUsers?.map((like) => ({
      name: like.name,
      image: like.image || "/default-profile.png",
    }));

    return new NextResponse(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error("Error fetching liked users:", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to fetch liked users" }),
      { status: 500 }
    );
  }
};
