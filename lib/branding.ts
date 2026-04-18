/**
 * Configuracion base de branding.
 * Cuando subas el logo, usaremos este path en toda la app.
 */
export const BRANDING = {
  // Archivo versionado para evitar cache stale sin usar query params en next/image.
  companyLogoPath: "/branding/company-logo-white.png",
  companyLogoAlt: "Logo de la empresa",
} as const;
