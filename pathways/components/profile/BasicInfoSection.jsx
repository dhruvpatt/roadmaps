import { useState } from "react";

export default function BasicInfoSection({ user, onNameChange }) {
  const [name, setName] = useState(user.first_name || "");
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {editing ? (
          <button
            onClick={() => {
              onNameChange(name);
              setEditing(false);
            }}
            className="text-sm text-white bg-amber-600 px-3 py-1 rounded hover:bg-amber-700"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-amber-600 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div className="text-gray-800 space-y-2">
        <div>
          <label className="block text-sm font-medium">Name:</label>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          ) : (
            <p className="text-lg">{user.first_name} {user.last_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Email:</label>
          <p className="text-gray-600">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Role:</label>
          <p className="capitalize">{user.role}</p>
        </div>
      </div>
    </div>
  );
}
