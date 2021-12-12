import { formatISO } from "date-fns";
import { Clock } from "../../domain/core/ports/Clock";
import {
  SirenGateway,
  SirenResponse,
} from "../../domain/sirene/ports/SirenGateway";
import { SiretDto } from "../../shared/siret";
import { logAxiosError } from "../../utils/axiosUtils";
import { createLogger } from "../../utils/logger";
import { AxiosConfig } from "../primary/appConfig";
import { createAxiosInstance } from "../../utils/axiosUtils";

const logger = createLogger(__filename);

export class HttpsSirenGateway implements SirenGateway {
  public constructor(
    private readonly axiosConfig: AxiosConfig,
    private readonly clock: Clock,
  ) {}

  private createAxiosInstance() {
    return createAxiosInstance(logger, {
      baseURL: this.axiosConfig.endpoint,
      headers: {
        Authorization: `Bearer ${this.axiosConfig.bearerToken}`,
        Accept: "application/json",
      },
    });
  }

  public async get(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SirenResponse | undefined> {
    logger.debug({ siret, includeClosedEstablishments }, "get");

    try {
      const response = await this.createAxiosInstance().get("/siret", {
        params: this.createSiretQueryParams(siret, includeClosedEstablishments),
      });
      return response.data;
    } catch (error: any) {
      logAxiosError(logger, error);
      if (error.response.status == 404) {
        return undefined;
      }
      throw error;
    }
  }

  private createSiretQueryParams(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ) {
    const params: any = {
      q: `siret:${siret}`,
    };

    // According to API SIRENE documentation:
    // etatAdministratifEtablissement:
    //   État de l'établissement pendant la période :
    //     A= établissement actif
    //     F= établissement fermé
    if (!includeClosedEstablishments) {
      params.q += " AND periode(etatAdministratifEtablissement:A)";
      params.date = formatISO(this.clock.now(), { representation: "date" });
    }

    return params;
  }
}