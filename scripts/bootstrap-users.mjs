import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54331";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: "admin@easycomp.test",
    password: "EasyComp2026!",
    full_name: "Admin EasyComp",
    role: "SUPER_ADMIN",
    business_id: null,
  },
  {
    email: "panaderia@easycomp.test",
    password: "EasyComp2026!",
    full_name: "María López",
    role: "BUSINESS_ADMIN",
    business_id: "tenant-panaderia-sol",
  },
  {
    email: "twd@easycomp.test",
    password: "EasyComp2026!",
    full_name: "Felipe Muñoz",
    role: "BUSINESS_ADMIN",
    business_id: "tenant-twd",
  },
];

async function main() {
  for (const user of users) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    });

    if (error && !error.message.includes("already been registered")) {
      console.error(`Error creating ${user.email}:`, error.message);
      continue;
    }

    const userId = created?.user?.id;
    if (!userId) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === user.email);
      if (!existing) {
        console.error(`Could not resolve user id for ${user.email}`);
        continue;
      }
      await supabase
        .from("profiles")
        .update({
          role: user.role,
          business_id: user.business_id,
          full_name: user.full_name,
          active: true,
        })
        .eq("user_id", existing.id);
      console.log(`Updated profile: ${user.email}`);
      continue;
    }

    await supabase
      .from("profiles")
      .update({
        role: user.role,
        business_id: user.business_id,
        full_name: user.full_name,
        active: true,
      })
      .eq("user_id", userId);

    console.log(`Created: ${user.email}`);
  }
}

main().catch(console.error);
