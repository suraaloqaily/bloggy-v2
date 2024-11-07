"use client";

import Image from "next/image";
import styles from "./writePage.module.css";
import { useEffect, useState, useRef } from "react";
import "react-quill/dist/quill.bubble.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactQuill from "react-quill";
import Loading from "@/components/Loading/Loading";

const WritePage = () => {
  const { status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [media, setMedia] = useState("");
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [slug, setSlug] = useState("");  
  const fileInputRef = useRef(null);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    const upload = async () => {
      if (file) {
        const base64File = await convertToBase64(file);
        setMedia(base64File);
      }
    };
    upload();
  }, [file]);

   useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

   useEffect(() => {
    if (slug) {
      router.push(`/posts/${slug}`);
    }
  }, [slug, router]);

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <Loading />
      </div>
    );
  }

  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleFileBrowse = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }
    if (!value.trim()) {
      setErrorMessage("Content is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          desc: value,
          img: media,
          slug: slugify(title),
          catSlug: catSlug || "style",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSlug(data.slug);
      } else {
        const errorData = await res.json();
        if (res.status === 400) {
          setErrorMessage("Bad Request: Please check your input.");
        } else if (res.status === 401) {
          setErrorMessage("Unauthorized: Please log in.");
        } else {
          setErrorMessage(
            errorData.message || "Something went wrong. Please try again."
          );
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage(
        "A network error occurred. Please check your connection and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <input
        required
        type="text"
        placeholder="Title"
        className={styles.input}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className={styles.select}
        onChange={(e) => setCatSlug(e.target.value)}>
        <option value="style">style</option>
        <option value="fashion">fashion</option>
        <option value="food">food</option>
        <option value="culture">culture</option>
        <option value="travel">travel</option>
        <option value="coding">coding</option>
      </select>
      <div className={styles.editor}>
        <button
          className={styles.button}
          onClick={handleFileBrowse}>
          <Image
            src="/plus.png"
            alt="Add Media"
            width={16}
            height={16}
          />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: "none" }}
        />
        {media && (
          <div className={styles.imagePreview}>
            <img
              src={media}
              alt="Preview"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              className={styles.previewImage}
            />
          </div>
        )}
        <ReactQuill
          className={styles.textArea}
          theme="bubble"
          value={value}
          onChange={setValue}
          placeholder="Tell your story..."
        />
      </div>
      <button
        className={styles.publish}
        onClick={handleSubmit}
        disabled={isSubmitting}>
        {isSubmitting ? "Publishing..." : "Publish"}
      </button>
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
    </div>
  );
};

export default WritePage;
