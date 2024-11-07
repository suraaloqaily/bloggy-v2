import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");
  const session = await getAuthSession();
   if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }, { status: 401 })
    );
  }
  try {
    const commentsWithLikes = await prisma.comment.findMany({
      where: {
        ...(postSlug && { postSlug }),
      },
      include: { user: true, likedBy: true },
    } );
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    const commentsWithIsLiked = commentsWithLikes.map((comment) => {
      const isLiked = session?.user?.email
        ? comment.likedBy.some((like) => like.userId === user.id)
        : false;

      return {
        id: comment.id,
        createdAt: comment.createdAt,
        desc: comment.desc,
        likes: comment.likedBy.length,
        userEmail: comment.userEmail,
        postSlug: comment.postSlug,
        user: comment.user,
        isLiked: isLiked,
      };
    });
 
    return new NextResponse(JSON.stringify(commentsWithIsLiked), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }, { status: 500 })
    );
  }
};

export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(
      JSON.stringify({ message: "Not Authenticated!" }, { status: 401 })
    );
  }

  try {
    const body = await req.json();
    const comment = await prisma.comment.create({
      data: { ...body, userEmail: session.user.email },
    });

    return new NextResponse(JSON.stringify(comment, { status: 200 }));
  } catch (err) {
    console.log(err);
 
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }, { status: 500 })
    );
  }
};
