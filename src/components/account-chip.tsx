import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AccountChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-10 w-24 animate-pulse rounded-sm bg-raised" />;
  }
  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/login">Sign in</Link>
      </Button>
    );
  }
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-raised text-xs font-medium">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[8rem] truncate text-xs text-muted sm:inline">{label}</span>
      <button
        type="button"
        onClick={() => void signOut("/")}
        className="text-xs text-subtle hover:text-fg"
      >
        Sign out
      </button>
    </div>
  );
}
