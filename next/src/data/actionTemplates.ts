// Predefined action templates for admin to assign to clients
// Each template has complete content except for amount/currency which admin sets per client

export interface ActionTemplate {
  id: string;
  title: string;
  shortDescription: string; // For admin selection UI
  icon: string;
  type: "synchronization" | "tax" | "insurance" | "aml" | "fees" | "history";
  // Full content displayed to client
  legalTitle: string;
  legalDescription: string;
  whyRequired: string[];
  legalBasis: string;
  consequences: string;
  howToProceed: string[];
  documents?: string[];
  contactInfo: string;
  // Default values (can be overridden)
  defaultCurrency?: string;
  defaultCryptoSymbol?: string;
  defaultStatus?: string;
  requiresAmount: boolean;
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "account_synchronization",
    title: "Account Synchronization",
    shortDescription: "Blockchain banking history verification (1 ETH default)",
    icon: "RefreshCw",
    type: "synchronization",
    legalTitle: "Mandatory Blockchain Account Synchronization",
    legalDescription: "Account synchronization is a mandatory security procedure for newly registered cryptocurrency accounts. This process establishes a verified banking history on the blockchain by recording a legitimate transaction from a financial institution in your name.",
    whyRequired: [
      "Creates a verifiable transaction history on the blockchain network",
      "Establishes a banking footprint linking your identity to your crypto wallet",
      "Required by international financial regulations for new cryptocurrency accounts",
      "Proves that your account is connected to a legitimate banking system",
      "Ensures the blockchain records prior transaction activity for compliance verification",
      "Facilitates secure and traceable fund recovery transfers"
    ],
    legalBasis: "Required under the Virtual Asset Service Providers (VASP) regulations, EU Markets in Crypto-Assets (MiCA) framework, and international AML/CFT standards. New accounts must demonstrate banking connectivity before receiving large fund transfers.",
    consequences: "Without account synchronization, your wallet cannot receive the recovered funds. The blockchain network requires proof of prior legitimate banking activity to authorize incoming transfers of this magnitude. Funds will remain frozen until synchronization is completed.",
    howToProceed: [
      "Send the exact amount specified from a bank account or exchange account registered in your name",
      "Use the provided wallet address below to complete the synchronization",
      "The transaction must originate from a verified financial institution",
      "Allow 1-3 network confirmations for the synchronization to complete",
      "Once verified, your account will be cleared for fund reception within 24-48 hours"
    ],
    documents: ["Proof of bank account ownership", "Transaction confirmation receipt"],
    contactInfo: "For synchronization assistance, contact our Blockchain Support at sync@cryptogen.com or call +1 800 123 4567 ext. 150",
    defaultCurrency: "CRYPTO",
    defaultCryptoSymbol: "ETH",
    defaultStatus: "urgent",
    requiresAmount: true
  },
  {
    id: "tax_payment",
    title: "Tax Settlement",
    shortDescription: "Unpaid taxes on blocked funds that must be settled",
    icon: "Receipt",
    type: "tax",
    legalTitle: "Tax Settlement on Recovered Assets",
    legalDescription: "Your recovered cryptocurrency assets have never been declared to tax authorities. Under international tax regulations, all capital gains and holdings must be reported. These taxes must be settled before the funds can be legally released to you.",
    whyRequired: [
      "Compliance with IRS cryptocurrency reporting requirements (Notice 2014-21)",
      "Fulfillment of international tax treaty obligations (OECD CRS)",
      "These funds were never declared and taxes were never paid on capital gains",
      "Legal requirement before cross-border asset transfers",
      "Prevention of tax evasion charges upon fund receipt",
      "Required for obtaining tax clearance certificate"
    ],
    legalBasis: "Mandated under IRS Notice 2014-21, the Infrastructure Investment and Jobs Act cryptocurrency reporting provisions, EU DAC8 Directive, and OECD Common Reporting Standard (CRS) for international tax transparency. Unpaid taxes on cryptocurrency holdings are subject to penalties and interest if not settled.",
    consequences: "Failure to settle outstanding taxes will result in automatic reporting to relevant tax authorities, potential criminal tax evasion charges, seizure of assets by tax authorities, and indefinite freezing of recovered funds. Interest and penalties will continue to accrue.",
    howToProceed: [
      "Review the calculated tax liability based on your recovered assets",
      "Submit the required tax settlement amount",
      "Receive official tax clearance certificate",
      "Documentation will be provided for your personal tax records",
      "Funds will be cleared for release within 48-72 hours after settlement"
    ],
    documents: ["Tax Calculation Statement", "Tax Clearance Certificate", "Declaration of Assets"],
    contactInfo: "For tax-related inquiries, consult with your tax advisor or contact our Tax Compliance Department at tax@cryptogen.com or call +1 800 123 4567 ext. 200",
    defaultCurrency: "EUR",
    defaultStatus: "pending",
    requiresAmount: true
  },
  {
    id: "insurance_verification",
    title: "Insurance & Liability Verification",
    shortDescription: "Prove legitimate ownership and non-involvement in fraud",
    icon: "Shield",
    type: "insurance",
    legalTitle: "Insurance Premium & Liability Verification",
    legalDescription: "As part of our asset recovery compliance protocol, you must obtain insurance coverage that certifies you are the legitimate owner of the recovered funds and that you were not complicit in any fraudulent activities by the platform from which your assets were recovered.",
    whyRequired: [
      "Proves you are the rightful and legitimate owner of the recovered assets",
      "Certifies you were a victim, not a participant in fraudulent activities",
      "Required liability coverage for international fund transfers",
      "Protection against future claims on recovered assets",
      "Compliance with recovery platform insurance requirements",
      "Required by regulatory authorities before fund release"
    ],
    legalBasis: "Required under asset recovery protocols established by the Financial Conduct Authority (FCA), European Securities and Markets Authority (ESMA), and the International Association of Insurance Supervisors (IAIS). Victims of fraud must demonstrate non-complicity before receiving recovered assets.",
    consequences: "Without insurance verification, we cannot certify your non-involvement in the fraudulent scheme. Assets will remain frozen pending investigation, and you may be subject to further scrutiny by law enforcement agencies investigating the original fraud.",
    howToProceed: [
      "Review the insurance terms and liability declaration",
      "Submit the insurance premium payment",
      "Sign the liability waiver and non-complicity declaration",
      "Receive your Certificate of Legitimate Ownership",
      "Proceed to the next verification step"
    ],
    documents: ["Insurance Policy Certificate", "Liability Waiver", "Non-Complicity Declaration", "Certificate of Legitimate Ownership"],
    contactInfo: "For insurance inquiries, contact our Compliance Insurance Department at insurance@cryptogen.com or call +1 800 123 4567 ext. 250",
    defaultCurrency: "EUR",
    defaultStatus: "pending",
    requiresAmount: true
  },
  {
    id: "aml_unodc_fees",
    title: "UNODC AML Compliance Fees",
    shortDescription: "United Nations anti-money laundering verification fees",
    icon: "Scale",
    type: "aml",
    legalTitle: "UNODC Anti-Money Laundering & Anti-Fraud Compliance",
    legalDescription: "The United Nations Office on Drugs and Crime (UNODC) mandates anti-money laundering verification for all recovered cryptocurrency assets exceeding certain thresholds. This fee covers the comprehensive AML investigation and certification required before fund release.",
    whyRequired: [
      "UNODC compliance requirement for international asset recovery",
      "Anti-money laundering investigation and certification",
      "Verification that funds are not proceeds of criminal activity",
      "Required for cross-border transfer of recovered digital assets",
      "Financial Action Task Force (FATF) recommendation compliance",
      "Protection against receiving tainted or illegal funds"
    ],
    legalBasis: "Required under UNODC Model Legislation on Money Laundering, FATF Recommendations (particularly Recommendation 15 on Virtual Assets), EU AMLD6, and the Bank Secrecy Act. All recovered assets must undergo AML screening before release.",
    consequences: "Failure to complete UNODC AML verification will result in the assets being flagged as potentially tainted. You may face investigation by financial crimes units, and the funds will be permanently frozen pending resolution. Release to any financial institution will be blocked.",
    howToProceed: [
      "Submit the UNODC AML compliance fee",
      "Our team will initiate the comprehensive AML investigation",
      "Investigation typically completes within 5-7 business days",
      "Receive your UNODC AML Clearance Certificate",
      "Assets will be cleared for final release"
    ],
    documents: ["UNODC AML Application", "Source of Funds Declaration", "AML Clearance Certificate", "FATF Compliance Report"],
    contactInfo: "For AML compliance inquiries, contact our International Compliance Department at aml@cryptogen.com or call +1 800 123 4567 ext. 300",
    defaultCurrency: "EUR",
    defaultStatus: "pending",
    requiresAmount: true
  },
  {
    id: "platform_fees",
    title: "Release & Storage Fees",
    shortDescription: "Platform storage, security, and release processing fees",
    icon: "Landmark",
    type: "fees",
    legalTitle: "Platform Release & Secure Storage Fees",
    legalDescription: "Your recovered assets have been securely stored in our cold storage infrastructure during the recovery process. This fee covers the secure storage costs, blockchain transaction fees for release, multi-signature security protocols, and administrative processing for final fund transfer.",
    whyRequired: [
      "Coverage of secure cold storage infrastructure costs",
      "Blockchain network transaction and gas fees for release",
      "Multi-signature wallet security protocol implementation",
      "24/7 monitoring and security during storage period",
      "Administrative processing and legal documentation",
      "Final compliance review and approval"
    ],
    legalBasis: "Standard fee structure as outlined in the Asset Recovery Service Agreement and custodial service terms. Fees are in accordance with industry standards for secure digital asset custody and transfer services.",
    consequences: "Processing cannot be initiated without payment of release and storage fees. Assets will continue to incur storage fees while held. This is typically the final step before fund release.",
    howToProceed: [
      "Confirm all previous verification steps have been completed",
      "Submit the release and storage fee payment",
      "Receive confirmation of payment",
      "Fund release will be initiated within 24-48 hours",
      "Funds will be transferred to your designated wallet address"
    ],
    documents: ["Storage Invoice", "Release Authorization", "Transfer Confirmation"],
    contactInfo: "For billing inquiries, contact our Billing Department at billing@cryptogen.com or call +1 800 123 4567 ext. 400",
    defaultCurrency: "EUR",
    defaultStatus: "pending",
    requiresAmount: true
  },
  {
    id: "transaction_history",
    title: "Banking History Establishment",
    shortDescription: "Create transaction history between external account and Cryptogen",
    icon: "History",
    type: "history",
    legalTitle: "Banking History Establishment Protocol",
    legalDescription: "To complete the secure transfer of your recovered assets, you must establish a transaction history between your external bank account or crypto wallet and your Cryptogen account. This creates a verifiable paper trail required by financial institutions.",
    whyRequired: [
      "Creates verifiable transaction history for regulatory compliance",
      "Establishes banking relationship between accounts",
      "Required by receiving financial institutions for large transfers",
      "Demonstrates legitimate account activity pattern",
      "Prevents flagging of large incoming transfers as suspicious",
      "Ensures smooth processing at your destination bank"
    ],
    legalBasis: "Required under bank compliance procedures for receiving large transfers, FATF Travel Rule requirements, and anti-fraud protocols. Financial institutions require established account relationships before processing significant incoming transfers.",
    consequences: "Without established transaction history, your receiving bank or exchange may flag the incoming funds as suspicious, triggering an investigation. This could result in frozen accounts, delays of months, or rejection of the transfer entirely.",
    howToProceed: [
      "Initiate small test transactions between your external account and Cryptogen",
      "Complete the specified number of round-trip transactions",
      "Each transaction establishes verified account connectivity",
      "Allow 24-48 hours for history verification",
      "Upon completion, final release will be scheduled"
    ],
    documents: ["Transaction Records", "Account Verification Confirmation", "Banking Relationship Certificate"],
    contactInfo: "For transaction assistance, contact our Account Services at accounts@cryptogen.com or call +1 800 123 4567 ext. 450",
    defaultCurrency: "CRYPTO",
    defaultCryptoSymbol: "ETH",
    defaultStatus: "pending",
    requiresAmount: true
  },
  {
    id: "custom",
    title: "Custom Action",
    shortDescription: "Create a custom action with your own content",
    icon: "Pencil",
    type: "fees",
    legalTitle: "",
    legalDescription: "",
    whyRequired: [],
    legalBasis: "",
    consequences: "",
    howToProceed: [],
    documents: [],
    contactInfo: "",
    defaultCurrency: "EUR",
    defaultStatus: "pending",
    requiresAmount: true
  }
];

export const getTemplateById = (templateId: string): ActionTemplate | undefined => {
  return ACTION_TEMPLATES.find(t => t.id === templateId);
};
