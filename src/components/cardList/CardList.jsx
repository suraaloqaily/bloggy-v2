import React from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";

const getData = async (page, cat) => {
  const res = await fetch(`/api/posts?page=${page}&cat=${cat || ""}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed");
  }
  return res.json();
};

const CardList = async ({ page, cat }) => {
  const { posts, count } = await getData(page, cat);

  const POST_PER_PAGE = 6;
  const hasPrev = POST_PER_PAGE * (page - 1) > 0;
  const hasNext = POST_PER_PAGE * (page - 1) + POST_PER_PAGE < count;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recent Blogs</h1>
      {cat && (
        <div className={styles.countInfo}>
          {count} blogs found in category &ldquo;{cat}&rdquo;
        </div>
      )}
      {posts && posts.length > 0 ? (
        <>
          <div className={styles.posts}>
            {posts.map((item) => (
              <Card
                item={item}
                key={item._id}
              />
            ))}
          </div>
          <Pagination
            cat={cat}
            page={page}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        </>
      ) : (
        <div>There are no posts yet, be the first one!</div>
      )}
    </div>
  );
};

export default CardList;
