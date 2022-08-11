import { reasonableSchedule } from "../schedule/ScheduleUtils";
import { Role } from "../tokens/MagicLinkPayload";
import { ConventionStatus, ConventionDto } from "./convention.dto";

const getNewStatus = (
  enterpriseAccepted: boolean,
  beneficiaryAccepted: boolean,
): ConventionStatus => {
  if (enterpriseAccepted && beneficiaryAccepted) return "IN_REVIEW";
  if (
    (enterpriseAccepted && !beneficiaryAccepted) ||
    (!enterpriseAccepted && beneficiaryAccepted)
  )
    return "PARTIALLY_SIGNED";
  return "READY_TO_SIGN";
};

// Returns an application signed by provided roles.
export const signConventionDtoWithRole = (
  application: ConventionDto,
  role: Role,
): ConventionDto => {
  if (
    !["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(application.status)
  ) {
    throw new Error(
      "Incorrect initial application status: " + application.status,
    );
  }

  const enterpriseAccepted =
    role === "establishment" ? true : application.enterpriseAccepted;
  const beneficiaryAccepted =
    role === "beneficiary" ? true : application.beneficiaryAccepted;

  const status = getNewStatus(enterpriseAccepted, beneficiaryAccepted);

  return {
    ...application,
    beneficiaryAccepted,
    enterpriseAccepted,
    status,
  };
};

// USED IN FRONT DO NOT DELETE !
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const IMMERSION_APPLICATION_TEMPLATE: ConventionDto = {
  id: "fake-test-id",
  externalId: "00000000001",
  status: "DRAFT",
  email: "esteban@ocon.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  postalCode: "75000",
  emergencyContact: "Camille Dumaître",
  emergencyContactPhone: "0601020202",
  agencyId: "fake-agency-id",
  dateSubmission: "2021-07-01",
  dateStart: "2021-08-01",
  dateEnd: "2021-08-31",
  dateValidation: "2021-08-05",
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  mentor: "Alain Prost",
  mentorPhone: "0601010101",
  mentorEmail: "alain@prost.fr",
  schedule: reasonableSchedule({
    start: new Date("2021-08-01"),
    end: new Date("2021-08-31"),
  }),
  workConditions: undefined,
  immersionAddress: "75001 Centre du monde",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionAppellation: {
    romeLabel: "Conduite d'équipement de formage et découpage des matériaux",
    romeCode: "H2905",
    appellationCode: "12922",
    appellationLabel: "Conducteur / Conductrice de cisaille",
  },
  immersionActivities: "Piloter une cisaille",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
  internshipKind: "immersion",
};
