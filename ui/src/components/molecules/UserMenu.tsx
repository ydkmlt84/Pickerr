"use client";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useDispatch } from "react-redux";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Avatar } from "../atoms/Avatar";
import { MenuButton } from "../atoms/MenuButton";
import { MenuGroup } from "../atoms/MenuGroup";
import { useStore, Dispatch } from "../../store";
import styles from "./UserMenu.module.css";
import { UserProgressItem } from "./UserProgressItem";

export const UserMenu = () => {
  const [{ user, room }] = useStore(["user", "room"]);
  const dispatch = useDispatch<Dispatch>();

  if (!user) return null;

  const areOthersInRoom = room?.users && room?.users.length > 1;
  const progress =
    room?.users?.find((_) => _.user.userName === user.userName)?.progress ?? 0;

  return (
    <Menu as="div" className={styles.userMenu}>
      <Menu.Button className={styles.user}>
      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        <Avatar
          userName={user.userName}
          avatarUrl={user.avatarImage}
          progress={progress * 100}
        />
        <p className={styles.userName}>{user.userName}</p>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={styles.popover}>
          <div className={styles.menuContent}>
            <UserProgressItem
              key={user.userName}
              user={user}
              progress={progress}
              style={!areOthersInRoom ? { marginBottom: "var(--s2)" } : {}}
            />
            {areOthersInRoom && (
              <MenuGroup title="Also in the room:">
                <div className={styles.usersList}>
                  {room?.users!
                    .filter((u) => u.user.userName !== user.userName)
                    .map((userProgress) => (
                      <UserProgressItem
                        key={userProgress.user.userName}
                        {...userProgress}
                      />
                    ))}
                </div>
              </MenuGroup>
            )}
            <Menu.Item>
              {({ active }) => (
                <MenuButton
                  className={active ? styles.activeMenuItem : ""}
                  onClick={() => dispatch({ type: "leaveRoom" })}
                >
                  Leave Room
                </MenuButton>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <MenuButton
                  className={active ? styles.activeMenuItem : ""}
                  onClick={() => dispatch({ type: "logout" })}
                >
                  Logout
                </MenuButton>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
