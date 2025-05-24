"use client";

import React, { useRef, useState } from "react";
import { ErrorMessage } from "../../atoms/ErrorMessage";
import { Tr } from "../../atoms/Tr";
import { Version } from "../../atoms/Version";
import { Layout } from "../../layout/Layout";
import { Card } from "../../molecules/Card";
import { CardStack } from "../../organisms/CardStack";
import { MatchesList } from "../../organisms/MatchesList";
import { RoomInfoBar } from "../../organisms/RoomInfoBar";

import styles from "./Room.module.css";
import { useStore } from "../../../store";

import { Tab } from "@headlessui/react";

export const RoomScreen = () => {
  const [{ room }, dispatch] = useStore(["room"]);
  const matchesEl = useRef<HTMLUListElement>(null);
  const [media] = useState(room?.media);

  const [matchOrder, setMatchOrder] = useState<"mostRecent" | "mostLikes">("mostRecent");

  if (!room || !media) {
    return <ErrorMessage message="No Room!" />;
  }

  const handleSortChange = (index: number) => {
    const value = index === 0 ? "mostRecent" : "mostLikes";
    setMatchOrder(value);
    if (matchesEl.current) {
      matchesEl.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  return (
    <Layout hideLogo className={styles.screen}>
      <CardStack
        cards={media}
        onCardDismissed={(card, rating) => {
          dispatch({
            type: "rate",
            payload: {
              mediaId: card.id,
              rating: rating === "left" ? "dislike" : "like",
            },
          });
        }}
        renderCard={(card) => <Card media={card} key={card.id} />}
      />

      <RoomInfoBar />

      <div className="w-full pt-4">
        <Tab.Group onChange={handleSortChange}>
          <Tab.List className={styles.segmentedControlList}>
            <Tab
              className={({ selected }) =>
                selected
                  ? styles.segmentedControlOptionSelected
                  : styles.segmentedControlOption
              }
            >
              Most Recent
            </Tab>
            <Tab
              className={({ selected }) =>
                selected
                  ? styles.segmentedControlOptionSelected
                  : styles.segmentedControlOption
              }
            >
              Most Likes
            </Tab>
          </Tab.List>
        </Tab.Group>
      </div>

      <MatchesList ref={matchesEl}>
        {room.matches &&
          room.matches
            .sort((a, b) =>
              matchOrder === "mostLikes"
                ? b.users.length - a.users.length
                : b.matchedAt - a.matchedAt
            )
            .map((match) => (
              <Card
                media={match.media}
                href={match.media.linkUrl}
                key={match.media.id}
                title={
                  <Tr
                    name="MATCHES_SECTION_CARD_LIKERS"
                    context={{
                      users: match.users.join(" & "),
                      movie: match.media.title,
                    }}
                  />
                }
              />
            ))}
      </MatchesList>

      <Version />
    </Layout>
  );
};
