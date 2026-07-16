import { AccountView } from "@neondatabase/neon-js/auth/react/ui";
import { useParams } from "react-router-dom";

export function AccountPage() {
  const { pathname } = useParams<{ pathname: string }>();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0B131D",
      }}
    >
      <AccountView pathname={pathname} />
    </div>
  );
}
