import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";
export const GET = async (req, { params }) => {
  const { slug } = params;
  const session = await getAuthSession();
  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }, { status: 401 })
    );
  }

  try {
    const post = await prisma.post.findFirst({
      where: { slug },
      include: { user: true, likedBy: true },
    });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    let currentUserId = user.id;

    const checkIfUserLiked = (post, currentUserId) => {
      return post.likedBy.some((like) => like.userId === currentUserId);
    };
    const isLiked = post ? checkIfUserLiked(post, currentUserId) : false;

    const response = {
      ...post,
      isLiked: isLiked,
    };
    return new NextResponse(JSON.stringify(response, { status: 200 }));
  } catch (err) {
    console.log(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }, { status: 500 })
    );
  }
};

export const PATCH = async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split("/")[3];
    const { action } = await req.json();

    const session = await getAuthSession();
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: "Not Authenticated!" }),
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { slug: slug },
    });

    if (!post) {
      return new NextResponse(JSON.stringify({ message: "Post not found" }), {
        status: 404,
      });
    }

    const postId = post.id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const userId = user.id;

    const existingLike = await prisma.postLike.findFirst({
      where: {
        AND: [{ userId: userId }, { postId: postId }],
      },
    });

    if (action === "like" && !existingLike) {
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            userId: userId,
            postId: postId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
        }),
      ]);
    } else if (action === "unlike" && existingLike) {
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        likedBy: {
          where: { userId: userId },
        },
      },
    });

    return new NextResponse(
      JSON.stringify({
        ...updatedPost,
        isLiked: updatedPost.likedBy.length > 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating post likes:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Error updating post likes",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
