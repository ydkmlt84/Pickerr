"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Filter } from "../../../../../server/types/moviematch";
import { useStore } from "../../../store";
import { Button } from "../../atoms/Button";
import { ButtonContainer } from "../../layout/ButtonContainer";
import { client } from "../../../api/moviematch";
import { ErrorMessage } from "../../atoms/ErrorMessage";
import { Field } from "../../molecules/Field";
import { FilterField } from "../../molecules/FilterField";
import { AddRemoveList } from "../../atoms/AddRemoveList";
import { Layout } from "../../layout/Layout";
import { Tr } from "../../atoms/Tr";

import styles from "./Create.module.css";

export const CreateScreen = () => {
  const [{ translations, createRoom, error, routeParams }, dispatch] = useStore(
    ["translations", "createRoom", "error", "routeParams"]
  );
  const [roomName, setRoomName] = useState<string>(routeParams?.roomName ?? "");
  const [roomNameError, setRoomNameError] = useState<string | null>(null);
  const filters = useRef(new Map<number, Filter>());
  const handleCreateRoom = useCallback(() => {
    if (!roomName) {
      setRoomNameError(
        translations?.FIELD_REQUIRED_ERROR || "This field is required"
      );
      return;
    }

    dispatch({
      type: "createRoom",
      payload: {
        roomName,
        filters: [...filters.current.values()],
      },
    });
  }, [roomName, dispatch, translations?.FIELD_REQUIRED_ERROR]);

  useEffect(() => {
    const waitAndRequest = async () => {
      await client.waitForConnected();
      dispatch({ type: "requestFilters" });
    };
    waitAndRequest();
  }, [dispatch]);

  return (
    <Layout>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {error && <ErrorMessage message={error.message ?? error.type ?? ""} />}
        <Field
          label={<Tr name="LOGIN_ROOM_NAME" />}
          name="roomName"
          value={roomName}
          errorMessage={roomNameError}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <div className={styles.filters}>
          <h2 className={styles.filtersTitle}>Filters</h2>
          <AddRemoveList
            initialChildren={0}
            onRemove={(i) => filters.current.delete(i)}
            testHandle="filter"
          >
            {(i) =>
              createRoom?.availableFilters && (
                <FilterField
                  key={i}
                  name={String(i)}
                  onChange={(filter) =>
                    filter && filters.current.set(i, filter)
                  }
                  filters={createRoom.availableFilters}
                  suggestions={createRoom?.filterValues}
                  requestSuggestions={(key: string) => {
                    dispatch({ type: "requestFilterValues", payload: { key } });
                  }}
                />
              )
            }
          </AddRemoveList>
        </div>

        <ButtonContainer reverseMobile paddingTop="s3">
          <Button
            appearance="Tertiary"
            onClick={() =>
              dispatch({ type: "navigate", payload: { route: "join" } })
            }
            testHandle="back"
          >
            <Tr name="BACK" />
          </Button>
          <Button
            appearance="Primary"
            onClick={handleCreateRoom}
            testHandle="create-room"
          >
            <Tr name="CREATE_ROOM" />
          </Button>
        </ButtonContainer>
      </form>
    </Layout>
  );
};
