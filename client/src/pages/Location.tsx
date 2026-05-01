import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/utiltyFunctions/socket";
import { getUserGeoLocation } from "@/utiltyFunctions/geoLocation";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getFromLocalStorage } from "@/utiltyFunctions/localStorage";
import { oidc } from "@/BackendRoutes";

type LocationMarker = {
  userId: number;
  username: string;
  lat: number;
  lng: number;
};

const Location = () => {
  const socketRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  const [markers, setMarkers] = useState<LocationMarker[]>([]);
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

        setMarkers((prev) => {
          const myMarker: LocationMarker = {
            userId: me?.id ?? 0,
            username: me?.username ?? "Me",
            lat: latitude,
            lng: longitude,
          };

          const others = prev.filter(
            (marker) => marker.userId !== myMarker.userId,
          );
          return [...others, myMarker];
        });
      } catch (error) {
        console.error("Failed to get location:", error);
      }
    };

    sendMyLocation();
    intervalRef.current = window.setInterval(sendMyLocation, 10000);

    socket.on("location:updated", (data: LocationMarker) => {
      console.log(data);
      setMarkers((prev) => {
        const filtered = prev.filter((marker) => marker.userId !== data.userId);
        return [...filtered, data];
      });
    });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      socket.off("location:updated");
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[19.075984, 72.877656]}
        zoom={10}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
