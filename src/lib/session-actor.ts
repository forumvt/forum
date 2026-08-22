import * as userRepo from "@/repositories/user.repository";

export async function resolveActor(user: {
  id: string;
  role?: unknown;
}): Promise<{ id: string; role: string | undefined }> {
  return {
    id: user.id,
    role: await userRepo.findRoleById(user.id),
  };
}
