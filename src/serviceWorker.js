import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";

precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();


registerRoute(
    new NavigationRoute(createHandlerBoundToURL("index.html"))
);

self.skipWaiting();
clientsClaim();

self.addEventListener("message", (event) => {
    console.log("message event", event);
});

// BACKGROUND SYNC
self.addEventListener("sync", (event) => {
    console.log("background sync event", event);
});

// PERIODIC SYNC
self.addEventListener("periodicsync", (event) => {
    console.log("periodic sync event", event);
});