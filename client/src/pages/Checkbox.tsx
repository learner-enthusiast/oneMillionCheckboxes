import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/utiltyFunctions/socket";
import { toast } from "sonner";
import { checkBox, oidc } from "@/BackendRoutes";
import { getFromLocalStorage } from "../utiltyFunctions/localStorage";

const Checkbox = () => {
  const socketRef = useRef<any>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const getUser = getFromLocalStorage("User");

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;

    const fetchCheckboxState = async () => {
      const data = await checkBox.getCheckBoxState();
      await oidc.healthRoute();
      setChecked(JSON.parse(data.data.checkboxState));
    };

    fetchCheckboxState();

    s.on("checkbox:updated", (data: any) => {
      const { index, user } = data;
      if (getUser.username !== user) {
        setChecked((prev) => {
          const updated = [...prev];
          updated[index] = !updated[index];
          return updated;
        });

        toast(`${user} updated a checkbox`);
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleChange = (index: number) => {
    const socket = socketRef.current;
    if (!socket) return;

    setChecked((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });

    socket.emit("checkbox:update", { index });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-600 to-yellow-400">
      <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-10 gap-3">
        {checked.map((isChecked, i) => (
          <input
            key={i}
            type="checkbox"
            checked={isChecked}
            onChange={() => handleChange(i)}
            className="w-5 h-5 cursor-pointer accent-blue-600"
          />
        ))}
      </div>
    </div>
  );
};

export default Checkbox;
