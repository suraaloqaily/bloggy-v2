"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import styles from "./comments.module.css";
import Image from "next/image";
import { useSession } from "next-auth/react";
import handleTime from "@/utils/time";
import EmojiPicker from "emoji-picker-react";
import { FaHeart } from "react-icons/fa";
import Loading from "../Loading/Loading";

const fetcher = (url) => fetch(url).then((res) => res.json());

const LikesPopup = ({ isVisible, onClose, users }) => (
  <div className={`${styles.popupOverlay} ${isVisible ? styles.show : ""}`}>
    <div className={styles.popupContent}>
      <button
        onClick={onClose}
        className={styles.closeButton}>
        ✖
      </button>
      <h2>Liked by</h2>
      <div className={styles.likesList}>
        {users.length > 0 ? (
          users.map((user, idx) => (
            <div
              key={idx}
              className={styles.user}>
              <Image
                src={user.image}
                alt="User profile"
                width={40}
                height={40}
                className={styles.userImage}
              />
              <span>{user.name}</span>
            </div>
          ))
        ) : (
          <p>No likes yet.</p>
        )}
      </div>
    </div>
  </div>
);

const Comments = ({ postSlug }) => {
  const { status } = useSession();
  const { data, mutate, isLoading } = useSWR(
    `/api/comments?postSlug=${postSlug}`,
    fetcher
  );
  const [desc, setDesc] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [likeStatus, setLikeStatus] = useState({});
  const [loadingLikes, setLoadingLikes] = useState({});
  const [showLikesPopup, setShowLikesPopup] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);

  const handleSubmit = async () => {
    if (!desc.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ desc, postSlug }),
      headers: { "Content-Type": "application/json" },
    });

    setDesc("");
    setFeedbackMessage("Comment submitted successfully!");
    mutate();
    setShowEmojiPicker(false);
    setTimeout(() => setFeedbackMessage(""), 3000);
  };

  const handleEmojiClick = (emojiData) =>
    setDesc((prev) => prev + emojiData.emoji);

  const toggleLike = async (commentId) => {
    const isLiked = likeStatus[commentId] || false;
    const action = isLiked ? "unlike" : "like";

    if (loadingLikes[commentId]) return;

    setLikeStatus((prev) => ({ ...prev, [commentId]: !isLiked }));
    setLoadingLikes((prev) => ({ ...prev, [commentId]: true }));

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const updatedComment = await res.json();
        console.log(updatedComment);
        mutate();
        setLikeStatus((prev) => ({ ...prev, [commentId]: !isLiked }));
      } else {
        console.error("Error updating like status.");
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    } finally {
      setLoadingLikes((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const fetchLikedUsers = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`);
      if (response.ok) {
        const users = await response.json();
        setLikedUsers(users);
        setShowLikesPopup(true);
      } else {
        console.error("Failed to fetch liked users.");
      }
    } catch (error) {
      console.error("Error fetching liked users:", error);
    }
  };
  return (
    <div className={styles.container}>
      {status === "authenticated" ? (
        <div className={styles.write}>
          <div className={styles.inputContainer}>
            <textarea
              placeholder="Write a comment..."
              className={styles.input}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button
              className={styles.emojiButton}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              😊
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <button
            className={styles.button}
            onClick={handleSubmit}>
            Send
          </button>
        </div>
      ) : null}
      {feedbackMessage && (
        <div className={styles.feedback}>{feedbackMessage}</div>
      )}
      <div className={styles.comments}>
        {isLoading ? (
          <Loading />
        ) : status === "authenticated" ? (
          data?.map((item) => (
            <div
              key={item.id}
              className={styles.comment}>
              <div className={styles.user}>
                {item?.user?.image && (
                  <Image
                    src={item.user.image}
                    alt=""
                    width={50}
                    height={50}
                    className={styles.image}
                  />
                )}
                <div className={styles.userInfo}>
                  <span className={styles.username}>{item.user.name}</span>
                  <span className={styles.date}>
                    {handleTime(item.createdAt)}
                  </span>
                </div>
              </div>

              <p className={styles.desc}>{item.desc}</p>
              <button
                className={styles.likeButton}
                disabled={loadingLikes[item.id]}
                aria-label={item.isLiked ? "Unlike comment" : "Like comment"}>
                <FaHeart
                  onClick={() => toggleLike(item.id)}
                  className={item.isLiked ? styles.redHeart : styles.whiteHeart}
                />
                <span
                  className={styles.likesCount}
                  onClick={() => fetchLikedUsers(item.id)}>
                  {item.likes}
                </span>
              </button>
            </div>
          ))
        ) : null}
      </div>
      <LikesPopup
        isVisible={showLikesPopup}
        onClose={() => setShowLikesPopup(false)}
        users={likedUsers}
      />
    </div>
  );
};

export default Comments;
