import React from "react";

import data from "@public/meta.json";

export const Cards: React.FC = () => {
  return (
    <div className="flex-1 container my-8 max-w-screen-lg mx-auto p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data?.plugins ?? []).map((plugin) => (
          <div
            key={plugin.name}
            className="col-span-1 rounded-md border border-gray-300 p-5"
          >
            <h2 className="text-xl font-semibold mb-2">{plugin.name}</h2>
            <p className="m-0">{plugin.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
