import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["admin@azphur.com"];

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ success: false, error: "Server configuration is incomplete." }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  const email = userData.user?.email?.trim().toLowerCase();

  if (userError || !email || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { data: partners, error: partnersError } = await supabaseAdmin
    .from("funding_partner_whitelist")
    .select("*")
    .order("created_at", { ascending: false });

  if (partnersError) {
    console.error("Unable to load funding partners for admin operations:", partnersError);
    return NextResponse.json({ success: false, error: "Unable to load funding partners." }, { status: 500 });
  }

  return NextResponse.json({ success: true, partners: partners || [] });
}
