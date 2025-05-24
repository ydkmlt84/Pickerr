import React, { forwardRef, ReactNode, useState } from "react";
import type { Media } from "../../../../types/moviematch";

import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { CakeIcon, NoSymbolIcon, FireIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import { Pill } from "../atoms/Pill";

import styles from "./Card.module.css";
import { ShareIcon } from "@heroicons/react/24/outline";

export interface CardProps {
  title?: ReactNode;
  href?: string;
  media: Media;

  style?: React.CSSProperties;
}


interface ContentRatingIconProps {
  rating: string;
  size?: string;
}

export const ContentRatingIcon = ({ rating, size = "1rem" }: ContentRatingIconProps) => {
  const className = `text-gray-600`;
  const style = { width: size, height: size };

  const getIcon = () => {
    switch (rating.toUpperCase()) {
      case "G":
        return <CakeIcon className={className} style={style} />;
      case "R":
        return <FireIcon className={className} style={style} />;
      case "NC-17":
        return <NoSymbolIcon className={className} style={style} />;
      default:
        return <CakeIcon className={className} style={style} />;
    }
  };

  return getIcon();
};

const formatTime = (milliseconds: number) =>
  `${Math.round(milliseconds / 1000 / 60)} minutes`;

export const Card = forwardRef<HTMLDivElement & HTMLAnchorElement, CardProps>(
  ({ media, title, href }, ref) => {
    const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);

    const { rootPath } = document.body.dataset;

    const srcSet = [
      `${rootPath}${media.posterUrl}?width=300`,
      `${rootPath}${media.posterUrl}?width=450 1.5x`,
      `${rootPath}${media.posterUrl}?width=600 2x`,
      `${rootPath}${media.posterUrl}?width=900 3x`,
    ];

    const mediaTitle = `${media.title}${
      media.type === "movie" ? ` (${media.year})` : ""
    }`;

    const Tag = href ? "a" : "div";

    return (
      <Tag
        ref={ref}
        className={href ? styles.linkCard : styles.card}
        {...(href
          ? {
            href,
            target: /(iPhone|iPad)/.test(navigator.userAgent)
              ? "_self"
              : "_blank",
          }
          : {})}
      >
        <img
          className={styles.poster}
          src={srcSet[0]}
          srcSet={srcSet.join(", ")}
          alt={`${media.title} poster`}
        />
        {showMoreInfo
          ? (
            <div className={styles.moreInfo}>
              <p className={styles.moreInfoTitle}>{mediaTitle}</p>
              <div className={styles.moreInfoMetadata}>
                <Pill>{media.year}</Pill>
                <Pill>{formatTime(+media.duration)}</Pill>
                <Pill>
                  <StarIcon height="0.8rem" width="0.5rem" /> {media.rating}
                </Pill>
                {media.contentRating && (
                  <Pill>
  <ContentRatingIcon rating={media.contentRating} size="1rem" />
</Pill>
                )}
                {media.genres.map((genre) => (
                  <Pill key={genre}>{genre}</Pill>
                ))}
                {!href && (
                  <Pill href={media.linkUrl}>
                    <span>Open in Plex</span>
                    <ShareIcon />
                  </Pill>
                )}
              </div>
              <p className={styles.moreInfoDescription}>
                {media.description}
              </p>
            </div>
          )
          : (
            <div className={styles.titleContainer}>
              <p className={styles.title}>{title ?? mediaTitle}</p>
            </div>
          )}
        <button
          className={styles.moreInfoButton}
          onClick={(e) => {
            e.preventDefault();
            setShowMoreInfo(!showMoreInfo);
          }}
        >
          <InformationCircleIcon />
        </button>
      </Tag>
    );
  },
);

Card.displayName = "Card";
