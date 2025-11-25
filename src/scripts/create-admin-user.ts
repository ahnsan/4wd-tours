import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Script to create an admin user in Medusa Cloud
 * Email: bookings@kellerstainstables.co.uk
 * Password: Hello123!
 *
 * Based on Medusa v2 patterns from official documentation
 * Uses UserModule and AuthModule for proper user creation
 */
export default async function createAdminUser({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModuleService = container.resolve(Modules.USER);
  const authModuleService = container.resolve(Modules.AUTH);

  const adminEmail = "bookings@kellerstainstables.co.uk";
  const adminPassword = "Hello123!";

  try {
    logger.info(`Creating admin user: ${adminEmail}`);

    // Check if user already exists
    const existingUsers = await userModuleService.listUsers({
      email: adminEmail,
    });

    if (existingUsers.length > 0) {
      logger.warn(`User ${adminEmail} already exists. Skipping creation.`);
      logger.info(`Existing user ID: ${existingUsers[0].id}`);
      return {
        success: true,
        message: "User already exists",
        user: existingUsers[0],
      };
    }

    // Step 1: Create user with UserModule
    const user = await userModuleService.createUsers({
      email: adminEmail,
      first_name: "Bookings",
      last_name: "Admin",
    });

    logger.info(`✓ User created with ID: ${user.id}`);

    // Step 2: Create auth identity with emailpass provider
    const authIdentity = await authModuleService.createAuthIdentities({
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: adminEmail,
          provider_metadata: {
            password: adminPassword,
          },
        },
      ],
    });

    logger.info(`✓ Auth identity created with provider: emailpass`);

    logger.info("=== Admin User Created Successfully ===");
    logger.info(`Email: ${adminEmail}`);
    logger.info(`User ID: ${user.id}`);
    logger.info(`You can now login with these credentials`);

    return {
      success: true,
      message: "Admin user created successfully",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      authIdentity: {
        id: authIdentity.id,
        provider: "emailpass",
      },
    };
  } catch (error) {
    logger.error("Failed to create admin user:", error);
    throw error;
  }
}
