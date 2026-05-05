import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/utiltyFunctions/socket";
import { getUserGeoLocation } from "@/utiltyFunctions/geoLocation";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getFromLocalStorage } from "@/utiltyFunctions/localStorage";
import { oidc } from "@/BackendRoutes";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// BUG FIX: Added `lastSeen` timestamp to track when a marker was last updated.
// This is the key field used to decide if a user is still active or should be removed.
type LocationMarker = {
  userId: number;
  username: string;
  lat: number;
  lng: number;
  lastSeen: number; // Unix timestamp in ms (Date.now())
};

// BUG FIX: `lastSeen` is optional in validation because it is injected locally
// after receiving data — the backend does not need to send it.
function isValidMarker(
  marker: any,
): marker is Omit<LocationMarker, "lastSeen"> {
  return (
    typeof marker?.lat === "number" &&
    typeof marker?.lng === "number" &&
    typeof marker?.userId === "number" &&
    typeof marker?.username === "string"
  );
}

// How long (ms) without a location update before a user is removed from the map.
const STALE_THRESHOLD_MS = 20_000;

// How often (ms) we run the cleanup check. Every 5s is enough.
const CLEANUP_INTERVAL_MS = 5_000;

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const Location = () => {
  const socketRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  const cleanupIntervalRef = useRef<number | null>(null);

  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const me = getFromLocalStorage("User");

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const sendMyLocation = async () => {
      try {
        await oidc.healthRoute();
        const position = await getUserGeoLocation();
        const { latitude, longitude } = position.coords;

        socket.emit("location:update", {
          lat: latitude,
          lng: longitude,
        });

        const myMarker: LocationMarker = {
          userId: me.userId,
          username: me.username,
          lat: latitude,
          lng: longitude,
          lastSeen: Date.now(),
        };

        if (isValidMarker(myMarker)) {
          setMyLocation({ lat: latitude, lng: longitude });
          setMarkers((prev) => {
            const others = prev.filter(
              (marker) => marker.userId !== myMarker.userId,
            );
            return [...others, myMarker];
          });
        }
      } catch (error) {
        console.error("Failed to get location:", error);
      }
    };

    sendMyLocation();
    intervalRef.current = window.setInterval(sendMyLocation, 5000);

    socket.on("location:updated", (data: any) => {
      data = JSON.parse(data);

      if (isValidMarker(data)) {
        setMarkers((prev) => {
          const filtered = prev.filter(
            (marker) => marker.userId !== data.userId,
          );
          return [...filtered, { ...data, lastSeen: Date.now() }];
        });
      } else {
        console.warn("Invalid location marker data:", data);
      }
    });

    cleanupIntervalRef.current = window.setInterval(() => {
      const now = Date.now();
      setMarkers((prev) =>
        prev.filter((marker) => now - marker.lastSeen < STALE_THRESHOLD_MS),
      );
    }, CLEANUP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      // BUG FIX: Clear the cleanup interval on unmount to avoid memory leaks.
      if (cleanupIntervalRef.current)
        window.clearInterval(cleanupIntervalRef.current);
      socket.off("location:updated");
    };
  }, [me]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[19.075984, 72.877656]}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {myLocation && (
          <RecenterMap lat={myLocation.lat} lng={myLocation.lng} />
        )}

        {markers.map((marker) => (
          <Marker key={marker.userId} position={[marker.lat, marker.lng]}>
            <Tooltip permanent direction="top" offset={[0, -5]}>
              {marker.username}
            </Tooltip>
            <Popup>{marker.username}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Location;
