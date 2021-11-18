import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";
import { BadRequestError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionApplicationMLResponseDto,
  AddImmersionApplicationResponseDto,
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { GenerateJwtFn } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { Role } from "../../../shared/tokens/MagicLinkPayload";
import { GetSiretRequestDto, GetSiretResponseDto } from "../../../shared/siret";

const logger = createLogger(__filename);

export class AddImmersionApplication extends UseCase<
  ImmersionApplicationDto,
  AddImmersionApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationResponseDto> {
    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );

    await rejectsSiretIfNotAnOpenCompany(
      this.getSiret,
      immersionApplicationDto.siret,
    );

    const id = await this.applicationRepository.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await this.outboxRepository.save(event);

    return { id };
  }
}

export class AddImmersionApplicationML extends UseCase<
  ImmersionApplicationDto,
  AddImmersionApplicationMLResponseDto
> {
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
    private readonly generateJwt: GenerateJwtFn,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationMLResponseDto> {
    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );
    const id = await this.applicationRepository.save(applicationEntity);

    if (!id) throw new ConflictError(applicationEntity.id);

    await rejectsSiretIfNotAnOpenCompany(
      this.getSiret,
      immersionApplicationDto.siret,
    );

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await this.outboxRepository.save(event);

    const applicantPayload = {
      applicationId: id,
      roles: ["beneficiary" as Role],
      iat: Math.round(Date.now() / 1000),
      exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
      name:
        immersionApplicationDto.firstName +
        " " +
        immersionApplicationDto.lastName,
    };

    const establishmentPayload = {
      ...applicantPayload,
      name: immersionApplicationDto.mentor,
      roles: ["establishment" as Role],
    };

    return {
      magicLinkApplicant: this.generateJwt(applicantPayload),
      magicLinkEnterprise: this.generateJwt(establishmentPayload),
    };
  }
}
