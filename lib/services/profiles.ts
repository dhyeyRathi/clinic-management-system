import { createClient } from "@/lib/supabase/server";

export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      client_profiles:client_profiles(*),
      doctor_profiles:doctor_profiles(*)
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllClients() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_profiles")
    .select(`
      *,
      profile:profiles(*)
    `);

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllDoctors() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(`
      *,
      profile:profiles(*)
    `);

  if (error) throw new Error(error.message);
  return data;
}

export async function updateUserProfile(
  userId: string,
  baseData: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    role?: "CLIENT" | "DOCTOR" | "RECEPTIONIST" | "LAB_MANAGER" | "MANAGER";
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  },
  roleSpecificData?: any
) {
  const supabase = await createClient();

  // 1. Update the base profile
  if (Object.keys(baseData).length > 0) {
    const { error: baseError } = await supabase
      .from("profiles")
      .update(baseData)
      .eq("id", userId);

    if (baseError) throw new Error(baseError.message);
  }

  // 2. Update role-specific table if data is provided
  if (roleSpecificData) {
    // Fetch the role to determine which table to update
    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (roleError) throw new Error(roleError.message);

    if (profile?.role === "CLIENT") {
      const { error: clientError } = await supabase
        .from("client_profiles")
        .update(roleSpecificData)
        .eq("user_id", userId);

      if (clientError) throw new Error(clientError.message);
    } else if (profile?.role === "DOCTOR") {
      const { error: doctorError } = await supabase
        .from("doctor_profiles")
        .update(roleSpecificData)
        .eq("user_id", userId);

      if (doctorError) throw new Error(doctorError.message);
    }
  }

  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  // In our clinic system, rather than deleting records, we disable the user by setting status to INACTIVE
  const { error } = await supabase
    .from("profiles")
    .update({ status: "INACTIVE" })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createClientProfile(data: {
  user_id: string;
  client_code?: string;
  date_of_birth?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  emergency_contact?: string;
  medical_notes_summary?: string;
}) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("client_profiles")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
}

export async function createDoctorProfile(data: {
  user_id: string;
  doctor_code?: string;
  specialization: string;
  qualifications: string;
  availability?: any;
  consultation_fee?: number;
}) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("doctor_profiles")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
}
