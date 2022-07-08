import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UseCase } from "../../core/UseCase";
import {
  ConventionDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { withConventionIdSchema } from "shared/src/convention/convention.schema";
import { ConventionRepository } from "../ports/ConventionRepository";

export class GetConvention extends UseCase<WithConventionId, ConventionDto> {
  constructor(readonly conventionRepo: ConventionRepository) {
    super();
  }

  inputSchema = withConventionIdSchema;

  public async _execute({ id }: WithConventionId): Promise<ConventionDto> {
    const convention = await this.conventionRepo.getById(id);
    if (!convention || convention.status === "CANCELLED")
      throw new NotFoundError(id);
    return convention;
  }
}
