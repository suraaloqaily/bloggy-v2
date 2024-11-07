"use client";
import { signIn, useSession } from "next-auth/react";
import styles from "./loginPage.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading/Loading";

const LoginPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
       router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });
       if (response?.error) {
        setError(response.error);
      } else if (response?.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("An unexpected error occurred");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred");
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Login</h1>
        <form
          onSubmit={handleSubmit}
          className={styles.form}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.submitButton}>
            Log In
          </button>
        </form>
        <div className={styles.divider}>
          <span>OR</span>
        </div>
        <div
          className={styles.socialButton}
          onClick={() => signIn("google")}>
          Sign in with Google
        </div>
      </div>
    </div>
  );
};
LoginPage.displayName = "LoginPage";

export default LoginPage;
