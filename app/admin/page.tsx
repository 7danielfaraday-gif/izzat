import Storefront from "../page";
import { headers } from "next/headers";
import AdminLogin from "../admin-login";
import { adminAuthConfigured, cookieValue, verifyAdminSessionToken } from "../admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requestHeaders = await headers();
  const authenticated = await verifyAdminSessionToken(cookieValue(requestHeaders.get("cookie")));
  if (!authenticated) return <AdminLogin configured={adminAuthConfigured()} />;
  return <Storefront initialScreen="admin" />;
}
