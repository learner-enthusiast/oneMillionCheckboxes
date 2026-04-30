import { useEffect } from "react";

import { connectSocket } from "@/lib/socket";

const Location = () => {
  useEffect(() => {
    connectSocket();
  }, []);

  return <div>Location</div>;
};

export default Location;
