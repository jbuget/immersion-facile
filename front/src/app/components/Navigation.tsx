import React from "react";
import { routes } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";

export const Navigation = () => {
  const featureFlags = useFeatureFlags();

  return (
    <nav>
      <a {...routes.home().link}>Home</a>
      {" - "}
      <a {...routes.convention().link}>Demande immersion</a>
      {" - "}
      {featureFlags.enableAdminUi && <a {...routes.admin().link}>Backoffice</a>}
      {featureFlags.enableAdminUi && " - "}
      <a {...routes.formEstablishment().link}>Formulaire Entreprise</a> {" - "}
      <a {...routes.landingEstablishment().link}>Landing entreprise </a> {" - "}
      <a {...routes.search().link}>Recherche</a> {" - "}
      <a {...routes.addAgency().link}>Ajouter agence</a>
    </nav>
  );
};
