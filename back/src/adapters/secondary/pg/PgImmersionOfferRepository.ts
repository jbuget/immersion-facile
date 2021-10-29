import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  ImmersionOfferEntity,
  ImmersionEstablishmentContact,
} from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { PoolClient } from "pg";
import format from "pg-format";
import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";
import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { Position } from "../../../domain/immersionOffer/entities/EstablishmentEntity";

const logger = createLogger(__filename);

export class PgImmersionOfferRepository implements ImmersionOfferRepository {
  constructor(private client: PoolClient) {}

  async insertSearch(searchParams: SearchParams) {
    this.client
      .query(
        "INSERT INTO searches_made (ROME, lat, lon ,distance, needsToBeSearched, gps) VALUES ($1, $2, $3, $4, $5, ST_GeographyFromText($6)) ON CONFLICT ON CONSTRAINT pk_searches_made DO UPDATE SET needstobesearched=true, update_date=NOW()",
        [
          searchParams.rome,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance,
          true,
          "POINT(" + searchParams.lon + " " + searchParams.lat + ")",
        ],
      )
      .catch((e) => {
        logger.error(e);
      });
  }

  async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    /*
    In order to lower the amount of request made to third-party services,
    after grouping by ROME searched,
    we make an aggregation of the searches made in a radius of 0.3 degrees (=29.97 kilometers)
    and take the max distance searched
    */
    return this.client
      .query(
        "SELECT requestGroupBy.ROME, requestGroupBy.max_distance as distance, ST_Y(requestGroupBy.point) as latitude, ST_X(requestGroupBy.point) as longitude \
        FROM ( \
        select ROME, MAX(distance) as max_distance, ST_AsText(ST_GeometryN(unnest(ST_ClusterWithin(gps::geometry, 0.27)),1)) as point \
        from searches_made \
        WHERE needstobesearched=true \
        GROUP by ROME \
          ) as requestGroupBy",
      )
      .then((res) => {
        this.client.query("UPDATE searches_made SET needstobesearched=false");
        return res.rows as SearchParams[];
      })
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async insertEstablishments(
    establishments: EstablishmentEntity[],
  ): Promise<void> {
    const arrayOfEstablishments = establishments.map((establishment) =>
      establishment.toArrayOfProps(),
    );

    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfEstablishments = arrayOfEstablishments.reduce(
      (acc, cur) => {
        const alreadyExist = acc.some((item: any[]) => item[0] === cur[0]);
        if (alreadyExist) return acc;
        return [...acc, cur];
      },
      [],
    );

    deduplicatedArrayOfEstablishments.map((establishment: any[]) => {
      const position: Position = establishment[7];
      establishment[7] =
        "ST_GeographyFromText('POINT(" +
        position.lon +
        " " +
        position.lat +
        ")')";
      return establishment;
    });

    const formatedQuery = format(
      "INSERT INTO establishments (siret, name, address,number_employees, naf, contact_mode, \
      data_source, gps) VALUES %L ON CONFLICT ON CONSTRAINT pk_establishments DO UPDATE SET \
      name=EXCLUDED.name, address=EXCLUDED.address, number_employees=EXCLUDED.number_employees, \
      naf=EXCLUDED.naf, contact_mode=EXCLUDED.contact_mode, data_source=EXCLUDED.data_source, \
      update_date=NOW() \
      WHERE EXCLUDED.data_source='form' OR (establishments.data_source != 'form' AND \
      (EXCLUDED.data_source = 'api_laplateformedelinclusion' AND establishments.data_source = 'api_labonneboite')) ",
      deduplicatedArrayOfEstablishments,
    );

    //We remove the dashes arround method ST_GeographyFromText to make it work
    const re =
      /'ST_GeographyFromText\(''POINT\((\d+(\.\d+)?)\s(\d+(\.\d+)?)\)''\)'/;
    const formatedQueryWorking = formatedQuery.replace(
      re,
      "ST_GeographyFromText('POINT($1 $3)')",
    );
    await this.client.query(format(formatedQueryWorking)).catch((e) => {
      logger.error(e);
    });
  }

  async insertImmersions(
    immersionOffers: ImmersionOfferEntity[],
  ): Promise<void> {
    const arrayOfImmersionsOffers = immersionOffers.map((immersion) =>
      immersion.toArrayOfProps(),
    );
    //We deduplicate establishments because postgres does not support duplicate rows
    const deduplicatedArrayOfImmersionsOffers = arrayOfImmersionsOffers.reduce(
      (acc: any[][], cur: any[]) => {
        const alreadyExist = acc.some(
          (item: any[]) =>
            item[1] === cur[1] && item[2] === cur[2] && item[3] === cur[3],
        );
        if (alreadyExist) return acc;
        return [...acc, cur];
      },
      [],
    );

    const deduplicatedArrayOfImmersionsOffersMapped =
      deduplicatedArrayOfImmersionsOffers.map((offer) => {
        const position: Position = offer[9];
        const newPosition = `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;
        return [...offer.slice(0, 9), newPosition, ...offer.slice(9 + 1)];
      });

    const formatedQuery = format(
      "INSERT INTO immersion_offers (uuid, rome, naf_division, siret, naf,  name,voluntary_to_immersion, data_source, score, gps) VALUES %L ON CONFLICT ON CONSTRAINT pk_immersion_offers DO UPDATE SET naf=EXCLUDED.naf, name=EXCLUDED.name, voluntary_to_immersion=EXCLUDED.voluntary_to_immersion, \
    data_source=EXCLUDED.data_source, score=EXCLUDED.score, update_date=NOW() \
    WHERE EXCLUDED.data_source='form' OR (immersion_offers.data_source != 'form' AND \
    (EXCLUDED.data_source = 'api_laplateformedelinclusion' AND immersion_offers.data_source = 'api_labonneboite')) ",
      deduplicatedArrayOfImmersionsOffersMapped,
    );

    //We remove the dashes arround method ST_GeographyFromText to make it work
    const re =
      /'ST_GeographyFromText\(''POINT\((\d+(\.\d+)?)\s(\d+(\.\d+)?)\)''\)'/;
    const formatedQueryWorking = formatedQuery.replace(
      re,
      "ST_GeographyFromText('POINT($1 $3)')",
    );
    await this.client.query(formatedQueryWorking);
  }

  async getImmersionsFromSiret(siret: string) {
    return this.client
      .query("SELECT * FROM immersion_offers WHERE siret=$1", [siret])
      .then((res) => res.rows)
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  async getEstablishmentFromSiret(siret: string) {
    return this.client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows)
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  async getFromSearch(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    let nafCategoryFilter = "";
    const parameters = [
      searchParams.rome,
      "POINT(" + searchParams.lon + " " + searchParams.lat + ")",
      searchParams.distance * 1000,
    ];
    if (searchParams.nafDivision) {
      nafCategoryFilter = "AND naf_division=$4";
      parameters.push(searchParams.nafDivision);
    }

    return this.client
      .query(
        `SELECT immersion_offers.* as immersion_offers, immersion_contacts.uuid as immersion_contacts_uuid, immersion_contacts.name as immersion_contacts_name, immersion_contacts.firstname as immersion_contacts_firstname, immersion_contacts.email as immersion_contacts_email, immersion_contacts.role as immersion_contacts_role, immersion_contacts.siret_establishment as immersion_contacts_siret_establishment, immersion_contacts.phone as immersion_contacts_phone \
         FROM (SELECT * FROM immersion_offers WHERE ROME=$1 AND ST_DWithin( \
         immersion_offers.gps, st_geographyfromtext($2), $3) \ 
         ${nafCategoryFilter} AND data_source != 'api_laplateformedelinclusion' ORDER BY data_source DESC) as immersion_offers \
         LEFT JOIN immersion_contacts as immersion_contacts \
         ON immersion_offers.contact_in_establishment_uuid = immersion_contacts.uuid`,
        parameters,
      )
      .then((res) => {
        /* todo  add contact in establishment*/
        return res.rows.map((result) => {
          if (result.contact_in_establishment_uuid != null) {
            const immersionContact: ImmersionEstablishmentContact = {
              id: result.immersion_contacts_uuid,
              name: result.immersion_contacts_name,
              firstname: result.immersion_contacts_firstname,
              email: result.immersion_contacts_email,
              role: result.immersion_contacts_role,
              siret_institution: result.immersion_contacts_siret_institution,
            };
            return new ImmersionOfferEntity({
              id: result.uuid,
              rome: result.rome,
              siret: result.siret,
              name: result.name,
              voluntary_to_immersion: result.voluntary_to_immersion,
              data_source: result.data_source,
              score: result.score,
              contact_in_establishment: immersionContact,
            });
          }
          return new ImmersionOfferEntity({
            id: result.uuid,
            rome: result.rome,
            siret: result.siret,
            name: result.name,
            voluntary_to_immersion: result.voluntary_to_immersion,
            data_source: result.data_source,
            score: result.score,
          });
        });
      })
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  async getAllSearches() {
    return this.client.query("SELECT * FROM searches_made");
  }

  async getSearchInDatabase(searchParams: SearchParams) {
    return this.client
      .query(
        "SELECT * FROM searches_made WHERE rome=$1 AND lat=$2 AND lon=$3 AND distance=$4",
        [
          searchParams.rome,
          searchParams.lat,
          searchParams.lon,
          searchParams.distance,
        ],
      )
      .then((res) => res.rows)
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}