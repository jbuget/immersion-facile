import { makeGenerateJwt, makeVerifyJwt } from "../../domain/auth/jwt";
import { DeliverRenewedMagicLink } from "../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { AlwaysAllowEmailFilter } from "../../adapters/secondary/core/EmailFilterImplementations";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../../adapters/secondary/core/InMemoryEventBus";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryConventionRepository } from "../../adapters/secondary/InMemoryConventionRepository";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  ConventionDto,
  RenewMagicLinkRequestDto,
} from "shared/src/convention/convention.dto";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { RenewMagicLink } from "../../domain/convention/useCases/RenewMagicLink";
import { GenerateMagicLinkJwt } from "../../domain/auth/jwt";
import { createConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { ConventionEntityBuilder } from "../../_testBuilders/ConventionEntityBuilder";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { InMemoryOutboxQueries } from "../../adapters/secondary/core/InMemoryOutboxQueries";

const adminEmail = "admin@email.fr";

describe("Magic link renewal flow", () => {
  let conventionRepository: InMemoryConventionRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let emailGw: InMemoryEmailGateway;
  let validConvention: ConventionDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let emailFilter: EmailFilter;
  let sentEmails: TemplatedEmail[];
  let agency: AgencyDto;
  let renewMagicLink: RenewMagicLink;
  let deliverRenewedMagicLink: DeliverRenewedMagicLink;
  let config: AppConfig;
  let generateJwtFn: GenerateMagicLinkJwt;

  beforeEach(() => {
    conventionRepository = new InMemoryConventionRepository();
    outboxRepository = new InMemoryOutboxRepository();
    const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
    clock = new CustomClock();
    clock.setNextDate(new Date());
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validConvention = new ConventionDtoBuilder().build();
    eventBus = new InMemoryEventBus(clock, (e) => outboxRepository.save(e));
    eventCrawler = new BasicEventCrawler(eventBus, outboxQueries);

    emailFilter = new AlwaysAllowEmailFilter();

    agency = AgencyDtoBuilder.create(validConvention.agencyId)
      .withName("TEST-name")
      .withAdminEmails([adminEmail])
      .withQuestionnaireUrl("TEST-questionnaireUrl")
      .withSignature("TEST-signature")
      .build();
    const agencyRepository = new InMemoryAgencyRepository([agency]);
    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwt(config.magicLinkJwtPrivateKey);

    renewMagicLink = new RenewMagicLink(
      conventionRepository,
      createNewEvent,
      outboxRepository,
      agencyRepository,
      generateJwtFn,
      config,
      clock,
    );

    deliverRenewedMagicLink = new DeliverRenewedMagicLink(emailFilter, emailGw);

    const entity = new ConventionEntityBuilder().build();
    conventionRepository.setConventions({ [entity.id]: entity });
  });

  it("sends the updated magic link", async () => {
    eventBus.subscribe("MagicLinkRenewalRequested", "subscription1", (event) =>
      deliverRenewedMagicLink.execute(event.payload),
    );

    const payload = createConventionMagicLinkPayload(
      validConvention.id,
      "beneficiary",
      validConvention.email,
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.fr/%jwt%",
      expiredJwt: generateJwtFn(payload),
    };

    await renewMagicLink.execute(request);
    await eventCrawler.processNewEvents();

    sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);

    expect(sentEmails[0].type).toBe("MAGIC_LINK_RENEWAL");
    expect(sentEmails[0].recipients).toEqual([validConvention.email]);

    const ml = sentEmails[0].params.magicLink as string;
    expect(ml.startsWith("immersionfacile.fr/")).toBeTruthy();
    const jwt = ml.replace("immersionfacile.fr/", "");

    const verifyJwt = makeVerifyJwt(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
