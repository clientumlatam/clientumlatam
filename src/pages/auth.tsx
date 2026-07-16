import { AuthView } from "@neondatabase/neon-js/auth/react/ui";
import { useParams } from "react-router-dom";

export function AuthPage() {
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
      <AuthView pathname={pathname} />
    </div>
  );
}
