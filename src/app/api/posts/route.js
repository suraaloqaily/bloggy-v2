import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || 1;
  const cat = searchParams.get("cat");
  const POST_PER_PAGE = 6;

  const query = {
    take: POST_PER_PAGE,
    skip: POST_PER_PAGE * (page - 1),
    where: {
      ...(cat && { catSlug: cat }),
    },
  };

  try {
    const [posts, count] = await prisma.$transaction([
      prisma.post.findMany(query),
      prisma.post.count({ where: query.where }),
    ]);

    return new NextResponse(JSON.stringify({ posts, count }), { status: 200 });
  } catch (err) {
    console.error("Error retrieving posts:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};

export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session) {
    return new NextResponse(JSON.stringify({ message: "Not Authenticated!" }), {
      status: 401,
    });
  }

  try {
    const body = await req.json();

    const { title, desc, img, catSlug } = body;

    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

 
    let uniqueSlug = slug;
    let suffix = 1;

    while (true) {
      const existingPost = await prisma.post.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existingPost) break;

 
      uniqueSlug = `${slug}-${suffix}`;
      suffix += 1;
    }

    const post = await prisma.post.create({
      data: {
        title,
        desc,
        img,
        slug: uniqueSlug,
        catSlug: catSlug || "style",
        userEmail: session.user.email,
      },
    });

 
    return new NextResponse(JSON.stringify(post), { status: 200 });
  } catch (err) {
    console.error("Error creating post:", err);
    return new NextResponse(
      JSON.stringify({ message: "Something went wrong!" }),
      { status: 500 }
    );
  }
};
