import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";

import "./main.css";

import { LoginScreen } from "./components/pages/Login";
import { JoinScreen } from "../../web/app/src/components/screens/Join";
import { CreateScreen } from "../../web/app/src/components/screens/Create";
import { RoomScreen } from "../../web/app/src/components/screens/Room";
import { Loading } from "../../web/app/src/components/screens/Loading";
import { ToastList } from "./components/atoms/Toast";
import { ConfigScreen } from "../../web/app/src/components/screens/Config";
import type { Routes } from "../../web/app/src/types";
import { createStore, Dispatch, useSelector } from "./store";

const store = createStore();

const MovieMatch = () => {
  const { route = "loading", translations, toasts } = useSelector([
    "route",
    "translations",
    "toasts",
  ]);

  const dispatch = useDispatch<Dispatch>();

  return (
    <>
      {(() => {
        const routes: Record<
          Routes,
          () => JSX.Element
        > = {
          loading: Loading,
          login: LoginScreen,
          join: JoinScreen,
          createRoom: CreateScreen,
          room: RoomScreen,
          config: ConfigScreen,
        };
        const CurrentComponent = routes[route];

        if (!translations) {
          return <Loading />;
        }

        if (CurrentComponent) {
          return <CurrentComponent />;
        } else {
          return <p>No route for {route}</p>;
        }
      })()}
      <ToastList
        toasts={toasts}
        removeToast={(toast) =>
          dispatch({ type: "removeToast", payload: toast })}
      />
    </>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(
  <StrictMode>
    <Provider store={store}>
      <MovieMatch />
    </Provider>
  </StrictMode>
);


if (
  window.innerHeight !==
    document.querySelector("body")?.getBoundingClientRect().height &&
  (!(navigator as unknown as Record<string, unknown>).standalone)
) {
  document.body.style.setProperty("--vh", window.innerHeight / 100 + "px");
  window.addEventListener("resize", () => {
    document.body.style.setProperty("--vh", window.innerHeight / 100 + "px");
  });
}

window.addEventListener("keyup", (e) => {
  if (e.key === "Tab") {
    document.body.classList.add("show-focus-ring");
  }
});

window.addEventListener("mouseup", () => {
  document.body.classList.remove("show-focus-ring");
});
