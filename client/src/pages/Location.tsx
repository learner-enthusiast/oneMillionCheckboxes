import { useEffect } from "react";

import { connectSocket } from "@/utiltyFunctions/socket";

const Location = () => {
  useEffect(() => {
    connectSocket();
  }, []);

  return <div>Location</div>;
};

export default Location;
