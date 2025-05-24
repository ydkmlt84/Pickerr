"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Field } from "../../molecules/Field";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { Layout } from "../../layout/Layout";
import { Tr } from "../../atoms/Tr";
import styles from "./Join.module.css";
import { useStore } from "../../../store";
import { ErrorMessage } from "../../atoms/ErrorMessage";
import { Spinner } from "../../atoms/Spinner";
// Optionally: import { Transition } from "@headlessui/react" for animation effects

export const JoinScreen = () => {
  const [store, dispatch] = useStore(["room", "error"]);

  const initialRoomName = useMemo(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("roomName");
    }
    return null;
  }, []);

  const [roomName, setRoomName] = useState<string>(
    store.room?.name ?? initialRoomName ?? ""
  );
  const [roomNameError, setRoomNameError] = useState<string | undefined>();

  useEffect(() => {
    if (initialRoomName) {
      dispatch({ type: "joinRoom", payload: { roomName: initialRoomName } });
    }
  }, [initialRoomName, dispatch]);

  if (initialRoomName && !store.error) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Error message transition (Headless UI style) */}
        {/* You could wrap this in <Transition> for animation if you want */}
        {store.error && (
          <ErrorMessage message={store.error.message ?? store.error.type ?? ""} />
        )}

        <Field
          label="Room Name"
          name="roomName"
          value={roomName}
          errorMessage={roomNameError}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <ButtonContainer paddingTop="s7" reverseMobile>
          <Button
            appearance="Tertiary"
            onPress={() => dispatch({ type: "logout" })}
            testHandle="logout"
          >
            <Tr name="LOGOUT" />
          </Button>
          <Button
            appearance="Secondary"
            onPress={() =>
              dispatch({
                type: "navigate",
                payload: { route: "createRoom", routeParams: { roomName } },
              })
            }
            testHandle="create-room"
          >
            <Tr name="CREATE_ROOM" />
          </Button>
          <Button
            appearance="Primary"
            onPress={() => {
              if (!roomName) {
                setRoomNameError("Room name is required");
                return;
              }
              dispatch({ type: "joinRoom", payload: { roomName } });
            }}
            type="submit"
            testHandle="join-room"
          >
            <Tr name="JOIN_ROOM" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
