"use client";
import { signIn, useSession } from "next-auth/react";
import styles from "./signupPage.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Loading from "@/components/Loading/Loading";
import Image from "next/image";
import { IoImageOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";

const SignupPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleImageChange = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleImageChange(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  }, []);

  const removeImage = () => {
    setImageBase64("");
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          image: imageBase64,
        }),
      });

      if (response.ok) {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result.error) {
          setError("Error signing in after signup");
        } else {
          router.push("/login");
        }
      } else {
        const data = await response.json();
        setError(data.message || "Signup failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
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
        <h1 className={styles.title}>Sign Up</h1>
        <form
          onSubmit={handleSubmit}
          className={styles.form}>
          <div
            className={`${styles.imageUploadContainer} ${
              dragActive ? styles.dragActive : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className={styles.imageInput}
              id="imageInput"
            />

            {imagePreview ? (
              <div className={styles.previewContainer}>
                <Image
                  src={imagePreview}
                  alt="Profile preview"
                  fill
                  className={styles.previewImage}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className={styles.removeImage}>
                  <MdOutlineCancel />
                </button>
              </div>
            ) : (
              <label
                htmlFor="imageInput"
                className={styles.uploadLabel}>
                <IoImageOutline className={styles.uploadIcon} />
                <span>Drag & Drop or Click to Upload</span>
                <span className={styles.uploadSubtext}>
                  Maximum file size: 5MB
                </span>
              </label>
            )}
          </div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.submitButton}>
            Sign Up
          </button>
        </form>
        <div className={styles.divider}>
          <span>OR</span>
        </div>
        <div
          className={styles.socialButton}
          onClick={() => sign("google")}>
          Sign up with Google
        </div>
      </div>
    </div>
  );
};
SignupPage.displayName = "SignupPage";

export default SignupPage;
