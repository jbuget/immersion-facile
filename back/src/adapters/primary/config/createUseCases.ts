import { sleep } from "shared/src/utils";
import {
  GenerateAdminJwt,
  GenerateMagicLinkJwt,
} from "../../../domain/auth/jwt";
import { AddAgency } from "../../../domain/convention/useCases/AddAgency";
import { AddImmersionApplication } from "../../../domain/convention/useCases/AddImmersionApplication";
import { BroadcastToPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/broadcast/BroadcastToPoleEmploiOnConventionUpdates";
import { CreateImmersionAssessment } from "../../../domain/convention/useCases/CreateImmersionAssessment";
import { ExportConventionsReport } from "../../../domain/convention/useCases/ExportConventionsReport";
import { GenerateMagicLink } from "../../../domain/convention/useCases/GenerateMagicLink";
import { GetAgencyPublicInfoById } from "../../../domain/convention/useCases/GetAgencyPublicInfoById";
import { GetConvention } from "../../../domain/convention/useCases/GetConvention";
import { ListAgenciesWithPosition } from "../../../domain/convention/useCases/ListAgenciesWithPosition";
import { ListAdminConventions } from "../../../domain/convention/useCases/ListAdminConventions";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../../domain/convention/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyImmersionApplicationWasSignedByOtherParty } from "../../../domain/convention/useCases/notifications/NotifyImmersionApplicationWasSignedByOtherParty";
import { NotifyNewApplicationNeedsReview } from "../../../domain/convention/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/convention/useCases/notifications/NotifyToAgencyApplicationSubmitted";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/convention/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { PrivateListAgencies } from "../../../domain/convention/useCases/PrivateListAgencies";
import { RenewConventionMagicLink } from "../../../domain/convention/useCases/RenewConventionMagicLink";
import { SendEmailWhenAgencyIsActivated } from "../../../domain/convention/useCases/SendEmailWhenAgencyIsActivated";
import { ShareApplicationLinkByEmail } from "../../../domain/convention/useCases/ShareApplicationLinkByEmail";
import { SignImmersionApplication } from "../../../domain/convention/useCases/SignImmersionApplication";
import { UpdateAgency } from "../../../domain/convention/useCases/UpdateAgency";
import { UpdateImmersionApplication } from "../../../domain/convention/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../../domain/convention/useCases/UpdateImmersionApplicationStatus";
import { ValidateImmersionApplication } from "../../../domain/convention/useCases/ValidateImmersionApplication";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { Clock } from "../../../domain/core/ports/Clock";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { UuidGenerator } from "../../../domain/core/ports/UuidGenerator";
import { ExportEstablishmentsAsExcelArchive } from "../../../domain/establishment/useCases/ExportEstablishmentsAsExcelArchive";
import { AdminLogin } from "../../../domain/generic/authentication/useCases/AdminLogin";
import { UploadFile } from "../../../domain/generic/fileManagement/useCases/UploadFile";
import { AddFormEstablishment } from "../../../domain/immersionOffer/useCases/AddFormEstablishment";
import { CallLaBonneBoiteAndUpdateRepositories } from "../../../domain/immersionOffer/useCases/CallLaBonneBoiteAndUpdateRepositories";
import { ContactEstablishment } from "../../../domain/immersionOffer/useCases/ContactEstablishment";
import { EditFormEstablishment } from "../../../domain/immersionOffer/useCases/EditFormEstablishment";
import { GetImmersionOfferById } from "../../../domain/immersionOffer/useCases/GetImmersionOfferById";
import { GetImmersionOfferBySiretAndRome } from "../../../domain/immersionOffer/useCases/GetImmersionOfferBySiretAndRome";
import { InsertEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/InsertEstablishmentAggregateFromFormEstablishement";
import { NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../../domain/immersionOffer/useCases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { UpdateEstablishmentAggregateFromForm } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentAggregateFromFormEstablishement";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { NotifyPoleEmploiUserAdvisorOnConventionAssociation } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionAssociation";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";
import { AppellationSearch } from "../../../domain/rome/useCases/AppellationSearch";
import { RomeSearch } from "../../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { HttpAdresseAPI } from "../../secondary/immersionOffer/HttpAdresseAPI";
import { AppConfig } from "./appConfig";
import { GenerateConventionMagicLink } from "./createGenerateConventionMagicLink";
import { makeGenerateEditFormEstablishmentUrl } from "./makeGenerateEditFormEstablishmentUrl";
import { Repositories } from "./repositoriesConfig";

export type UseCases = ReturnType<typeof createUseCases>;

export const createUseCases = (
  config: AppConfig,
  repositories: Repositories,
  generateJwtFn: GenerateMagicLinkJwt,
  generateMagicLinkFn: GenerateConventionMagicLink,
  generateAdminJwt: GenerateAdminJwt,
  emailFilter: EmailFilter,
  uowPerformer: UnitOfWorkPerformer,
  clock: Clock,
  uuidGenerator: UuidGenerator,
) => {
  const createNewEvent = makeCreateNewEvent({
    clock,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const getSiret = new GetSiret(repositories.sirene);
  const adresseAPI = new HttpAdresseAPI(noRateLimit, noRetries);

  return {
    associatePeConnectFederatedIdentity:
      new AssociatePeConnectFederatedIdentity(uowPerformer, createNewEvent),
    uploadFile: new UploadFile(uowPerformer, repositories.documentGateway),
    createImmersionAssessment: new CreateImmersionAssessment(
      uowPerformer,
      createNewEvent,
    ),
    addConvention: new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),
    adminLogin: new AdminLogin(
      config.backofficeUsername,
      config.backofficePassword,
      generateAdminJwt,
      () => sleep(config.nodeEnv !== "test" ? 500 : 0),
    ),
    getConvention: new GetConvention(repositories.conventionQueries),
    linkPoleEmploiAdvisorAndRedirectToConvention:
      new LinkPoleEmploiAdvisorAndRedirectToConvention(
        uowPerformer,
        repositories.peConnectGateway,
        config.immersionFacileBaseUrl,
      ),
    listAdminConventions: new ListAdminConventions(
      repositories.conventionQueries,
    ),
    exportConventionsAsExcelArchive: new ExportConventionsReport(uowPerformer),

    exportEstablishmentsAsExcelArchive: new ExportEstablishmentsAsExcelArchive(
      uowPerformer,
    ),

    updateConvention: new UpdateImmersionApplication(
      uowPerformer,
      createNewEvent,
    ),
    validateConvention: new ValidateImmersionApplication(
      repositories.convention,
      createNewEvent,
      repositories.outbox,
    ),
    updateConventionStatus: new UpdateImmersionApplicationStatus(
      repositories.convention,
      createNewEvent,
      clock,
      repositories.outbox,
    ),
    signConvention: new SignImmersionApplication(
      repositories.convention,
      createNewEvent,
      repositories.outbox,
    ),
    generateMagicLink: new GenerateMagicLink(generateJwtFn),
    renewConventionMagicLink: new RenewConventionMagicLink(
      uowPerformer,
      createNewEvent,
      generateJwtFn,
      config,
      clock,
    ),

    // immersionOffer
    searchImmersion: new SearchImmersion(
      repositories.searchesMade,
      repositories.immersionOffer,
      uuidGenerator,
    ),
    getImmersionOfferById: new GetImmersionOfferById(
      repositories.immersionOffer,
    ),
    getImmersionOfferBySiretAndRome: new GetImmersionOfferBySiretAndRome(
      repositories.immersionOffer,
    ),

    addFormEstablishment: new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),

    editFormEstablishment: new EditFormEstablishment(
      uowPerformer,
      createNewEvent,
    ),
    retrieveFormEstablishmentFromAggregates:
      new RetrieveFormEstablishmentFromAggregates(uowPerformer),
    updateEstablishmentAggregateFromForm:
      new UpdateEstablishmentAggregateFromForm(
        uowPerformer,
        repositories.sirene,
        adresseAPI,
        uuidGenerator,
        clock,
      ),
    insertEstablishmentAggregateFromForm:
      new InsertEstablishmentAggregateFromForm(
        uowPerformer,
        repositories.sirene,
        adresseAPI,
        uuidGenerator,
        clock,
        createNewEvent,
      ),
    contactEstablishment: new ContactEstablishment(
      uowPerformer,
      createNewEvent,
    ),

    callLaBonneBoiteAndUpdateRepositories:
      new CallLaBonneBoiteAndUpdateRepositories(
        repositories.immersionOffer,
        repositories.laBonneBoiteRequest,
        repositories.laBonneBoiteAPI,
        clock,
      ),
    requestEditFormEstablishment: new RequestEditFormEstablishment(
      uowPerformer,
      repositories.email,
      clock,
      makeGenerateEditFormEstablishmentUrl(config),
      createNewEvent,
    ),

    notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm:
      new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
        repositories.passEmploiGateway,
      ),

    // siret
    getSiret,
    getSiretIfNotAlreadySaved: new GetSiretIfNotAlreadySaved(
      uowPerformer,
      repositories.sirene,
    ),

    // romes
    appellationSearch: new AppellationSearch(uowPerformer),
    romeSearch: new RomeSearch(uowPerformer),

    // agencies
    listAgenciesWithPosition: new ListAgenciesWithPosition(repositories.agency),
    privateListAgencies: new PrivateListAgencies(repositories.agency),
    getAgencyPublicInfoById: new GetAgencyPublicInfoById(repositories.agency),
    sendEmailWhenAgencyIsActivated: new SendEmailWhenAgencyIsActivated(
      repositories.email,
    ),
    // notifications
    confirmToBeneficiaryThatConventionCorrectlySubmittedRequestSignature:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    confirmToMentorThatConventionCorrectlySubmittedRequestSignature:
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyAllActorsOfFinalConventionValidation:
      new NotifyAllActorsOfFinalApplicationValidation(
        uowPerformer,
        repositories.email,
      ),
    notifyNewConventionNeedsReview: new NotifyNewApplicationNeedsReview(
      repositories.email,
      repositories.agency,
      generateMagicLinkFn,
    ),
    notifyToTeamConventionSubmittedByBeneficiary:
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
    notifyToAgencyConventionSubmitted: new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailFilter,
      repositories.email,
      generateMagicLinkFn,
    ),
    notifyBeneficiaryAndEnterpriseThatConventionIsRejected:
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailFilter,
        repositories.email,
        repositories.agency,
      ),
    notifyBeneficiaryAndEnterpriseThatConventionNeedsModifications:
      new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
        emailFilter,
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
    deliverRenewedMagicLink: new DeliverRenewedMagicLink(
      emailFilter,
      repositories.email,
    ),
    notifyConfirmationEstablishmentCreated:
      new NotifyConfirmationEstablishmentCreated(
        emailFilter,
        repositories.email,
      ),
    notifyContactRequest: new NotifyContactRequest(
      repositories.immersionOffer,
      emailFilter,
      repositories.email,
    ),
    notifyBeneficiaryOrEnterpriseThatConventionWasSignedByOtherParty:
      new NotifyImmersionApplicationWasSignedByOtherParty(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyPoleEmploiUserAdvisorOnAssociation:
      new NotifyPoleEmploiUserAdvisorOnConventionAssociation(
        uowPerformer,
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    notifyPoleEmploiUserAdvisorOnConventionFullySigned:
      new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
        uowPerformer,
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
      ),
    broadcastToPoleEmploiOnConventionUpdates:
      new BroadcastToPoleEmploiOnConventionUpdates(
        uowPerformer,
        repositories.poleEmploiGateway,
      ),
    shareConventionByEmail: new ShareApplicationLinkByEmail(repositories.email),
    addAgency: new AddAgency(
      uowPerformer,
      createNewEvent,
      config.defaultAdminEmail,
    ),
    updateAgency: new UpdateAgency(uowPerformer, createNewEvent),
  };
};
