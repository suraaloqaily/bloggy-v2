"use client";
import { useState } from "react";
import styles from "./card.module.css";
import Link from "next/link";
import handleTime from "@/utils/time";
import { FaHeart } from "react-icons/fa";

const Card = ({ item }) => {
  return (
    <Link href={`/posts/${item.slug}`}>
      <div className={styles.container}>
        <div className={styles.textContainer}>
          <div className={styles.detail}>
            <span className={styles.date}>{handleTime(item.createdAt)} - </span>
            <span className={styles.category}>{item.catSlug}</span>
          </div>
          <h1>
            {item.title.substring(0, 20)}
            {item.title.length > 20 ? "..." : ""}
          </h1>
          <div
            className={styles.desc}
            dangerouslySetInnerHTML={{ __html: item?.desc.substring(0, 60) }}
          />
        </div>
      </div>
    </Link>
  );
};

export default Card;
