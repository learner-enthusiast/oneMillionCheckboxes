import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { toast } from "sonner";

const Checkbox = () => {
  const [socket, setSocket] = useState<any>(null);
  const [checked, setChecked] = useState<boolean[]>(Array(100).fill(false));

  const user = {
    id: "user_1",
    name: "Arnab",
  };

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    s.on("checkbox:updated", (data: any) => {
      const { index, user } = data;

      setChecked((prev) => {
        const updated = [...prev];
        updated[index] = !updated[index];
        return updated;
      });

      // 🔥 Sonner toast
      toast(`${user.name} updated a checkbox`);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleChange = (index: number) => {
    if (!socket) return;

    socket.emit("checkbox:update", {
      index,
      user,
    });
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
