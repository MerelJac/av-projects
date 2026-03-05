"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type SignupResult = { success: true } | { success: false; error: string };

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const firstName = String(formData.get("firstName"));
  const lastName = String(formData.get("lastName"));
  const passwordConfirm = String(formData.get("password-confirm"));
  const INVITE_PASS = process.env.INVITE_PASS!;
  console.log("Invite pass", INVITE_PASS);
  if (!email || !password || !passwordConfirm || !firstName || !lastName) {
    return { success: false, error: "Missing required fields" };
  }

  if (password !== passwordConfirm) {
    return { success: false, error: "Passwords do not match" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      success: false,
      error: "This email is not authorized to register.",
    };
  }

  if (user.password === INVITE_PASS) {
    // if placeholder password, fill in with new password
    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
      prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          firstName,
          lastName,
        },
        create: {
          userId: user.id,
          firstName,
          lastName,
        },
      }),
    ]);

    return { success: true };
  } else {
    return { success: false, error: "Account already exists. Please log in." };
  }
}
