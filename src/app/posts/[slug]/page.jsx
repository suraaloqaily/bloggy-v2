"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Menu from "@/components/Menu/Menu";
import styles from "./singlePage.module.css";
import Image from "next/image";
import Comments from "@/components/comments/Comments";
import handleTime from "@/utils/time";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import Loading from "@/components/Loading/Loading";
import { useSession } from "next-auth/react";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const SinglePage = ({ params }) => {
  const { slug } = params;
  const [loadingLikes, setLoadingLikes] = useState({});
  const { status } = useSession();
  const { data, error, isLoading, mutate } = useSWR(
    `/api/posts/${slug}`,
    fetcher
  );

  useEffect(() => {
    if (status === "authenticated" && data) {
      const viewedPosts = JSON.parse(localStorage.getItem("viewedPosts")) || [];
      if (!viewedPosts.includes(slug)) {
        fetch(`/api/posts/${slug}/increment-views`, { method: "POST" });
        viewedPosts.push(slug);
        localStorage.setItem("viewedPosts", JSON.stringify(viewedPosts));
      }
    }
  }, [status, data, slug]);

  const toggleLike = async (event, postId) => {
    event.preventDefault();
    if (loadingLikes[postId]) return;

    const action = data?.isLiked ? "unlike" : "like";
    setLoadingLikes((prev) => ({ ...prev, [postId]: true }));

    try {
      mutate(
        {
          ...data,
          likes: data.isLiked ? data.likes - 1 : data.likes + 1,
          isLiked: !data.isLiked,
        },
        false
      );

      const res = await fetch(`/api/posts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error("Failed to update like status");
      }

      mutate();
    } catch (error) {
      console.error("Error updating like status:", error);
      mutate();
    } finally {
      setLoadingLikes((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.textContainer}>
          {status === "authenticated" ? (
            <>
              <h1 className={styles.title}>{data?.title}</h1>
              <div className={styles.user}>
                {data?.user?.image && (
                  <div className={styles.userImageContainer}>
                    <Image
                      src={data.user.image}
                      alt=""
                      fill
                      className={styles.avatar}
                    />
                  </div>
                )}
                <div className={styles.userTextContainer}>
                  <span className={styles.username}>{data?.user?.name}</span>
                  <span className={styles.date}>
                    {handleTime(data.createdAt)}
                  </span>
                  <span className={styles.views}>
                    {data.views === 1
                      ? `${data.views} - view`
                      : `${data.views} - views`}
                  </span>
                  <span className={styles.likes}>
                    <span>{data.likes}</span>
                    <button
                      className={styles.likeButton}
                      aria-label={data.isLiked ? "Unlike post" : "Like post"}
                      disabled={loadingLikes[data.id]}>
                      <FaHeart
                        onClick={(event) => toggleLike(event, data.id)}
                        className={
                          data.isLiked ? styles.redHeart : styles.whiteHeart
                        }
                      />
                    </button>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <Link href="/login">Login to see the blogs</Link>
            </div>
          )}
        </div>
        {data?.img && (
          <div className={styles.imageContainer}>
            <Image
              src={data.img}
              alt=""
              fill
              className={styles.image}
            />
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.post}>
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: data?.desc }}
          />
          <div className={styles.comment}>
            <Comments postSlug={slug} />
          </div>
        </div>
        <Menu />
      </div>
    </div>
  );
};

export default SinglePage;
