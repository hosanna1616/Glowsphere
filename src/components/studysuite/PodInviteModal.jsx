import React from "react";

const PodInviteModal = ({
  isOpen,
  inviteUsername,
  setInviteUsername,
  searchResults,
  onInvite,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-amber-300/20 bg-stone-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-amber-100">Invite into Glow Silent Pod</h3>
            <p className="text-sm text-amber-100/60">
              Search by exact username and send a private invite.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-amber-100/60 hover:text-amber-100">
            Close
          </button>
        </div>
        <input
          type="text"
          value={inviteUsername}
          onChange={(event) => setInviteUsername(event.target.value)}
          placeholder="Type @username"
          className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-amber-50 outline-none"
        />
        <div className="space-y-2">
          {searchResults.length ? (
            searchResults.map((result) => (
              <button
                key={result._id}
                type="button"
                onClick={() => onInvite(result.username)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-amber-50 transition hover:border-amber-300/30"
              >
                <span>
                  {result.name}
                  <span className="ml-2 text-sm text-amber-100/60">@{result.username}</span>
                </span>
                <span className="text-sm text-amber-300">Invite</span>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-amber-100/60">
              Start typing a username to invite a friend into your pod.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PodInviteModal;
