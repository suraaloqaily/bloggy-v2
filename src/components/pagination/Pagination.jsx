"use client";

import React from "react";
import styles from "./pagination.module.css";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ cat, page, hasPrev, hasNext }) => {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        disabled={!hasPrev}
        onClick={() => router.push(`?page=${page - 1}&cat=${cat || ""}`)}>
        <FaChevronLeft />
      </button>

      <button
        disabled={!hasNext}
        className={styles.button}
        onClick={() => router.push(`?page=${page + 1}&cat=${cat || ""}`)}>
        <FaChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
