import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/utiltyFunctions/socket";
import { getUserGeoLocation } from "@/utiltyFunctions/geoLocation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getFromLocalStorage } from "@/utiltyFunctions/localStorage";
import { oidc } from "@/BackendRoutes";

// FIX 1: Leaflet's default marker icons break in bundlers (Vite/Webpack) because
// the asset paths are not resolved correctly at build time.
// We manually delete the broken internal resolver and point Leaflet to the correct files.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type LocationMarker = {
  userId: number;
  username: string;
  lat: number;
  lng: number;
};

function isValidMarker(marker: any): marker is LocationMarker {
  return (
    typeof marker?.lat === "number" &&
    typeof marker?.lng === "number" &&
    typeof marker?.userId === "number" &&
    typeof marker?.username === "string"
  );
}

// FIX 2: MapContainer's `center` prop is NOT reactive — it only sets the initial
// view and ignores all subsequent changes. To programmatically move the map,
// we need a child component that calls useMap() to get the live map instance
// and imperatively calls setView() whenever the target coordinates change.
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

  const [markers, setMarkers] = useState<LocationMarker[]>([]);

  // FIX 3: Track the user's own coordinates in state so we can pass them
  // to RecenterMap and dynamically re-center the map on first location fetch.
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const me = getFromLocalStorage("User");

  useEffect(() => {
    if (!me?.userid || !me?.username) {
      console.warn("User info not available from localStorage");
      return;
    }

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
          userId: me.userid,
          username: me.username,
          lat: latitude,
          lng: longitude,
        };

        if (isValidMarker(myMarker)) {
          // FIX 3 (continued): Update myLocation state to trigger RecenterMap re-render.
          // Only meaningful on first load, but keeps the map following the user if they move.
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
    intervalRef.current = window.setInterval(sendMyLocation, 10000);

    socket.on("location:updated", (data: any) => {
      console.log("Received location:", data);

      // FIX 4: If markers from other users are still not appearing, log the raw shape here.
      // The isValidMarker check will silently drop data if the backend sends
      // `user_id` instead of `userId`, or `lat`/`lng` as strings instead of numbers.
      // Confirm the payload shape matches { userId: number, username: string, lat: number, lng: number }.
      if (isValidMarker(data)) {
        setMarkers((prev) => {
          const filtered = prev.filter(
            (marker) => marker.userId !== data.userId,
          );
          return [...filtered, data];
        });
      } else {
        console.warn(
          "Invalid location marker data received — check backend payload shape:",
          data,
        );
      }
    });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      socket.off("location:updated");
      socket.disconnect();
    };

    // FIX 5: The original dependency was `me` (an object), which causes the effect to
    // re-run on every render because a new object reference is created each time
    // getFromLocalStorage() is called. Using the primitive `me?.userid` instead
    // makes the dependency stable — the effect only re-runs if the logged-in user changes.
  }, [me?.userid]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        // Fallback center while location hasn't loaded yet.
        // RecenterMap will move the map to the real location once coordinates arrive.
        center={[19.075984, 72.877656]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* FIX 2 (continued): Render RecenterMap only after we have real coordinates.
            It renders nothing to the DOM — it just calls map.setView() as a side effect. */}
        {myLocation && (
          <RecenterMap lat={myLocation.lat} lng={myLocation.lng} />
        )}

        {markers.map((marker) => (
          <Marker key={marker.userId} position={[marker.lat, marker.lng]}>
            <Popup>{marker.username}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Location;
