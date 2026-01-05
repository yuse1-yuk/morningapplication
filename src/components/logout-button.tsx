"use client";

export function LogoutButton() {
  const logout = async () => {
    await fetch("/api/google/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  return (
    <button
      onClick={logout}
      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20"
    >
      Google連携を解除
    </button>
  );
}
