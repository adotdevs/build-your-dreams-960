import fs from "fs";
import path from "path";

const root = path.resolve("d:/build-your-dreams-960/next");
const source = path.resolve("d:/build-your-dreams-960");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

copyDir(path.join(source, "src/components"), path.join(root, "src/components"));
copyDir(path.join(source, "src/pages"), path.join(root, "src/pages"));
copyDir(path.join(source, "src/hooks"), path.join(root, "src/hooks"));
copyDir(path.join(source, "src/i18n"), path.join(root, "src/i18n"));
copyDir(path.join(source, "src/data"), path.join(root, "src/data"));
copyDir(path.join(source, "src/assets"), path.join(root, "src/assets"));
fs.copyFileSync(path.join(source, "src/styles.css"), path.join(root, "src/styles.css"));
fs.mkdirSync(path.join(root, "public"), { recursive: true });
for (const file of fs.readdirSync(path.join(source, "public"))) {
  const from = path.join(source, "public", file);
  if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(root, "public", file));
}
fs.mkdirSync(path.join(root, "src/lib"), { recursive: true });
for (const file of ["utils.ts", "locale.ts", "crypto-prices.ts", "client-password-policy.ts"]) {
  fs.copyFileSync(path.join(source, "src/lib", file), path.join(root, "src/lib", file));
}
fs.mkdirSync(path.join(root, "src/server"), { recursive: true });
fs.copyFileSync(
  path.join(source, "src/lib/crypto-prices.functions.ts"),
  path.join(root, "src/server/crypto-prices.ts"),
);
fs.mkdirSync(path.join(root, "public/logos"), { recursive: true });
fs.copyFileSync(
  path.join(source, "src/assets/logos/coinly-logo.svg"),
  path.join(root, "public/logos/coinly-logo.svg"),
);

const routes = [
  ["src/app/page.tsx", "@/pages/Index"],
  ["src/app/features/page.tsx", "@/pages/FeaturesPage"],
  ["src/app/api/page.tsx", "@/pages/APIPage"],
  ["src/app/docs/page.tsx", "@/pages/DocumentationPage"],
  ["src/app/help/page.tsx", "@/pages/HelpCenterPage"],
  ["src/app/legal/page.tsx", "@/pages/LegalNoticePage"],
  ["src/app/privacy/page.tsx", "@/pages/PrivacyPage"],
  ["src/app/terms/page.tsx", "@/pages/TermsPage"],
  ["src/app/cookies/page.tsx", "@/pages/CookiesPage"],
  ["src/app/security/page.tsx", "@/pages/SecurityPage"],
  ["src/app/login/page.tsx", "@/pages/Login"],
  ["src/app/register/page.tsx", "@/pages/Register"],
  ["src/app/forgot-password/page.tsx", "@/pages/ForgotPassword"],
  ["src/app/reset-password/page.tsx", "@/pages/ResetPassword"],
  ["src/app/kyc/page.tsx", "@/pages/KYC"],
  ["src/app/fiscal-profile/page.tsx", "@/pages/FiscalProfile"],
  ["src/app/dashboard/page.tsx", "@/pages/Dashboard"],
  ["src/app/dashboard/wallet/page.tsx", "@/pages/Wallet"],
  ["src/app/dashboard/transactions/page.tsx", "@/pages/Transactions"],
  ["src/app/dashboard/withdrawal/page.tsx", "@/pages/BankWithdrawal"],
  ["src/app/dashboard/support/page.tsx", "@/pages/Support"],
  ["src/app/dashboard/settings/page.tsx", "@/pages/Settings"],
  ["src/app/dashboard/action/[actionId]/page.tsx", "@/pages/ActionDetail"],
  ["src/app/admin/login/page.tsx", "@/pages/admin/AdminLogin"],
  ["src/app/admin/page.tsx", "@/pages/admin/AdminDashboard"],
  ["src/app/admin/analytics/page.tsx", "@/pages/admin/AgentAnalytics"],
  ["src/app/admin/logs/page.tsx", "@/pages/admin/AdminActivityLogs"],
  ["src/app/admin/settings/page.tsx", "@/pages/admin/AdminSettings"],
  ["src/app/admin/agents/page.tsx", "@/pages/admin/AgentsList"],
  ["src/app/admin/agents/[agentId]/permissions/page.tsx", "@/pages/admin/AgentPermissions"],
  ["src/app/admin/clients/page.tsx", "@/pages/admin/ClientsList"],
  ["src/app/admin/clients/[clientId]/page.tsx", "@/pages/admin/ClientDetail"],
  ["src/app/admin/support/page.tsx", "@/pages/admin/SupportTickets"],
  ["src/app/admin/support/[ticketId]/page.tsx", "@/pages/admin/TicketDetail"],
  ["src/app/platform/page.tsx", "@/pages/platform/PlatformDashboard"],
  ["src/app/platform/analytics/page.tsx", "@/pages/platform/PlatformAnalytics"],
  ["src/app/platform/settings/page.tsx", "@/pages/platform/PlatformSettings"],
  ["src/app/platform/companies/page.tsx", "@/pages/platform/CompaniesList"],
  ["src/app/platform/companies/[companyId]/page.tsx", "@/pages/platform/CompanyDetail"],
  ["src/app/not-found.tsx", "@/pages/NotFound"],
];

for (const [rel, imp] of routes) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `"use client";\n\nimport Page from "${imp}";\n\nexport default function RoutePage() {\n  return <Page />;\n}\n`,
  );
}

const authPath = path.join(root, "src/hooks/useAuth.tsx");
let auth = fs.readFileSync(authPath, "utf8");
auth = auth.replace(
  "import { User, Session } from '@supabase/supabase-js';\nimport { supabase } from '@/integrations/supabase/client';",
  "import { supabase, type AuthUser as User, type AuthSession as Session } from '@/integrations/supabase/client';",
);
fs.writeFileSync(authPath, auth);

const logoPath = path.join(root, "src/components/Logo.tsx");
let logo = fs.readFileSync(logoPath, "utf8");
logo = logo.replace(
  'import CoinlyLogo from "@/assets/logos/coinly-logo.svg";',
  'const CoinlyLogo = "/logos/coinly-logo.svg";',
);
fs.writeFileSync(logoPath, logo);

const imageNames = ["legalDocuments", "securityShield", "featuresDashboard", "apiDeveloper"];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith(".tsx")) {
      let text = fs.readFileSync(full, "utf8");
      let changed = false;
      for (const name of imageNames) {
        const needle = `src={${name}}`;
        const next = `src={typeof ${name} === "string" ? ${name} : ${name}.src}`;
        if (text.includes(needle)) {
          text = text.split(needle).join(next);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, text);
    }
  }
}
walk(path.join(root, "src/pages"));

const cryptoPath = path.join(root, "src/server/crypto-prices.ts");
let crypto = fs.readFileSync(cryptoPath, "utf8");
crypto = crypto.replace('import { createServerFn } from "@tanstack/react-start";\n\n', "");
crypto = crypto.replace(
  'export const getCryptoPrices = createServerFn({ method: "GET" }).handler(async () => {',
  "export async function getCryptoPrices() {",
);
if (crypto.trimEnd().endsWith("});")) {
  crypto = crypto.trimEnd().slice(0, -3) + "}\n";
}
fs.writeFileSync(cryptoPath, crypto);
console.log("bootstrap ok");
