import React from "react";
import styles from "./navbar.module.css";
import Link from "next/link";
import AuthLinks from "../authLinks/AuthLinks";
import ThemeToggle from "../themeToggle/ThemeToggle";

const Navbar = () => {
  return (
    <div className={styles.container}>
      <div className={styles.links}>
        <ThemeToggle />
        <Link
          href="/"
          className={styles.link}>
          Homepage
        </Link>
        <AuthLinks />
      </div>
    </div>
  );
};

export default Navbar;
