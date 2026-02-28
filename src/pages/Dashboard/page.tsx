import { getUserFromToken } from "../../utils/authUtils";
import DashboardAdmin from "./counters/dashboard";
import DashboardVet from "./vets/dashboard";

export default function Page() {
  const userLogin = getUserFromToken()!;
  return (
    <div>
      {userLogin.aud === "admin" && <DashboardAdmin />}
      {userLogin.aud === "vet" && <DashboardVet />}
    </div>
  );
}
