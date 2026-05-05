import React from "react";
import freeAPI from "@/BackendRoutes/FreeAPI";
import { usePaginatedData } from "@/lib/utils";
import { PaginatedList } from "./PaginatedList";

const RUsers_app = () => {
  const { items: users, ...pagination } = usePaginatedData({
    fetchFn: freeAPI.getRandomUsers,
  });

  return (
    <PaginatedList
      title="Random Users"
      items={users}
      {...pagination}
      renderItem={(u, i) => (
        <div
          key={u?.id ?? u?.login?.uuid ?? i}
          className="flex gap-4 items-center rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {}}
        >
          <div>{i + 1} .</div>
          <img
            src={u?.picture?.thumbnail}
            alt={`${u?.name?.first} ${u?.name?.last}`}
            className="h-12 w-12 rounded-full"
          />
          <div>
            <div className="font-semibold">
              {u?.name
                ? `${u.name.title} ${u.name.first} ${u.name.last}`
                : (u?.login?.username ?? `User ${i + 1}`)}
            </div>
            <div className="text-sm text-muted-foreground">{u?.email}</div>
            <div className="text-sm text-muted-foreground">
              {u?.location?.city}, {u?.location?.country}
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default RUsers_app;
