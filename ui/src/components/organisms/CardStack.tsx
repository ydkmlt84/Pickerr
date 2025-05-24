"use client";
import React, { useCallback, useEffect, useRef } from "react";
import { useSprings, animated } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";
import { Tr } from "../atoms/Tr";
import { useStore } from "../../store";
import styles from "./CardStack.module.css";
import { HeartIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import type { Media } from "../../../../types/moviematch";

const YZ_SIZE = 15;
const YZ_OFFSET = -30;

type Card = Media;

interface CardStackProps {
  cards: Card[];
  renderCard: (card: Card) => React.ReactNode;
  onCardDismissed: (card: Card, direction: "left" | "right") => void;
}

export const CardStack = ({ cards, renderCard, onCardDismissed }: CardStackProps) => {
  const [{ connectionStatus }] = useStore(["connectionStatus"]);
  const gone = useRef(new Set<number>());
  const elRef = useRef<HTMLDivElement>(null);

  const [springs, api] = useSprings(cards.length, i => ({
    x: 0,
    y: i * YZ_SIZE + YZ_OFFSET,
    z: i * YZ_SIZE + YZ_OFFSET,
    scale: 1,
    opacity: 1,
    config: { tension: 500, friction: 30 },
  }));

  const handleRate = useCallback((direction: "left" | "right") => {
    const index = cards.findIndex((_, i) => !gone.current.has(i));
    if (index === -1) return;

    gone.current.add(index);
    const dir = direction === "left" ? -1 : 1;
    onCardDismissed(cards[index], direction);

    api.start(i => {
      if (i !== index) return {};
      return {
        x: (window.innerWidth + 100) * dir,
        opacity: 0,
        config: { duration: 150 },
      };
    });
  }, [cards, api, onCardDismissed]);

  const bind = useGesture(
    {
      onDrag: ({ args: [index], down, movement: [mx], velocity: [vx], direction: [dx] }) => {
        const trigger = !down && vx > 0.2;
        const dir = dx > 0 ? 1 : -1;

        if (trigger) {
          gone.current.add(index);
          onCardDismissed(cards[index], dir === -1 ? "left" : "right");
        }

        api.start(i => {
          if (i !== index) return;
          const isGone = gone.current.has(index);
          const x = isGone ? (window.innerWidth + 100) * dir : down ? mx : 0;
          const scale = down ? 1.05 : 1;

          return {
            x,
            y: i * YZ_SIZE + YZ_OFFSET,
            z: i * YZ_SIZE + YZ_OFFSET,
            opacity: isGone ? 0 : 1,
            scale,
          };
        });

        if (!down && gone.current.size === cards.length) {
          setTimeout(() => {
            gone.current.clear();
            api.start(i => ({
              x: 0,
              y: i * YZ_SIZE + YZ_OFFSET,
              z: i * YZ_SIZE + YZ_OFFSET,
              opacity: 1,
              scale: 1,
            }));
          }, 600);
        }
      },
    },
    { drag: { axis: "x" } }
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (connectionStatus !== "connected") return;
      if (e.code === "ArrowLeft") handleRate("left");
      else if (e.code === "ArrowRight") handleRate("right");
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRate, connectionStatus]);

  const isEmpty = gone.current.size === cards.length;

  return (
    <div className={isEmpty ? styles.emptyStack : styles.stack} ref={elRef}>
      {isEmpty ? (
        <p className={styles.emptyText}>
          <Tr name="RATE_SECTION_EXHAUSTED_CARDS" />
        </p>
      ) : (
        <>
          <button className={styles.dislikeButton} onClick={() => handleRate("left")}>
            <XMarkIcon />
          </button>
          <button className={styles.likeButton} onClick={() => handleRate("right")}>
            <HeartIcon />
          </button>
        </>
      )}

      {springs.map(({ x, y, z, scale, opacity }, i) => (
        <animated.div
          key={cards[i].id}
          data-index={i}
          className={styles.item}
          style={{
            transform: x.to(
              (xVal) => `translate3d(${xVal}px, ${y.get()}px, ${z.get()}px) scale(${scale.get()})`
            ),
            opacity: opacity.to([0.1, 0.8, 1], [0, 1, 1]),
          }}
          {...bind(i)}
        >
          {renderCard(cards[i])}
        </animated.div>
      ))}
    </div>
  );
};
