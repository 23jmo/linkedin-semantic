#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Path to the migration file
const migrationFile = path.join(
  __dirname,
  "../supabase/migrations/20240601_email_schema.sql"
);

// Check if the migration file exists
if (!fs.existsSync(migrationFile)) {
  console.error("Migration file not found:", migrationFile);
  process.exit(1);
}

console.log("Applying email schema migration...");

try {
  // Run the migration using the Supabase CLI
  // If you don't have the Supabase CLI, you can use the SQL Editor in the Supabase dashboard
  execSync(`npx supabase db push --db-url ${process.env.SUPABASE_URL}`, {
    stdio: "inherit",
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  console.log("Migration applied successfully!");
} catch (error) {
  console.error("Error applying migration:", error.message);
  console.log("\nAlternative: You can manually apply the migration by:");
  console.log("1. Go to the Supabase dashboard");
  console.log("2. Navigate to the SQL Editor");
  console.log("3. Copy and paste the contents of the migration file");
  console.log("4. Run the SQL query");

  // Read the migration file content
  const migrationContent = fs.readFileSync(migrationFile, "utf8");
  console.log("\nMigration file content:");
  console.log("----------------------------------------");
  console.log(migrationContent);
  console.log("----------------------------------------");

  process.exit(1);
}
