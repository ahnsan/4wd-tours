import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * Secure endpoint to create the first admin user
 * This endpoint should be protected by a secret token and only used once
 *
 * Usage:
 * POST /admin/create-first-user
 * Headers: x-setup-token: YOUR_SECURE_TOKEN
 * Body: { email: string, password: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, password } = req.body as { email: string; password: string };
  const setupToken = req.headers["x-setup-token"] as string;

  // Security: Require a setup token from environment
  const expectedToken = process.env.SETUP_TOKEN || "CHANGE_THIS_SECRET_TOKEN";

  if (setupToken !== expectedToken) {
    return res.status(401).json({
      message: "Unauthorized: Invalid setup token",
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const userModuleService = req.scope.resolve(Modules.USER);
    const authModuleService = req.scope.resolve(Modules.AUTH);

    // Check if any users already exist
    const existingUsers = await userModuleService.listUsers({ email });

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "User already exists",
        user: {
          id: existingUsers[0].id,
          email: existingUsers[0].email,
        },
      });
    }

    // Create user
    const user = await userModuleService.createUsers({
      email,
      first_name: "Admin",
      last_name: "User",
    });

    // Create auth identity
    await authModuleService.createAuthIdentities({
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: email,
          provider_metadata: {
            password,
          },
        },
      ],
    });

    return res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return res.status(500).json({
      message: "Failed to create admin user",
      error: error.message,
    });
  }
}
