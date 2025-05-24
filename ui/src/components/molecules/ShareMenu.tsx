import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch, useStore } from "../../store";
import { ShareIcon } from "@heroicons/react/24/outline";

import styles from "./ShareMenu.module.css";

export const ShareMenu = () => {
  const [{ room, translations }] = useStore(["room", "translations"]);
  const dispatch = useDispatch<Dispatch>();

  if (!room) return null;

  const handleShare = async () => {
    const shareUrl = new URL(location.origin);
    shareUrl.searchParams.set("roomName", room.name ?? "");
    try {
      await navigator.clipboard.writeText(shareUrl.href);
      dispatch({
        type: "addToast",
        payload: {
          id: Date.now(),
          showTimeMs: 2_000,
          message: translations?.COPY_LINK_SUCCESS ?? "COPY_LINK_SUCCESS",
          appearance: "Success",
        },
      });
    } catch (err) {
      console.error("Clipboard write failed:", err); // ← logs the error
      dispatch({
        type: "addToast",
        payload: {
          id: Date.now(),
          showTimeMs: 2_000,
          message: translations?.COPY_LINK_FAILURE ?? "COPY_LINK_FAILURE",
          appearance: "Failure",
        },
      });
    }
    
  };

  return (
    <button className={styles.shareButton} onClick={handleShare}>
      <span className={styles.roomName}>{room.name}</span>
      <ShareIcon/>
    </button>
  );
};
