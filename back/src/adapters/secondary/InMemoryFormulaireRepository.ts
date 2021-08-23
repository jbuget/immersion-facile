import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";
import { FormulaireIdEntity } from "../../domain/formulaires/entities/FormulaireIdEntity";
import { v4 as uuidV4 } from "uuid";

export interface InMemoryFormulaireIdGenerator {
  nextId: () => string;
}

class DefaultIdGenerator implements InMemoryFormulaireIdGenerator {
  public nextId() {
    return uuidV4();
  }
}

export class FakeIdGenerator implements InMemoryFormulaireIdGenerator {
  public id = "fake_formulaire_id";

  public nextId(): string {
    return this.id;
  }
}

export type Formulaires = {
  [id: string]: FormulaireEntity;
};

export class InMemoryFormulaireRepository implements FormulaireRepository {
  private readonly idGenerator: InMemoryFormulaireIdGenerator;
  private _formulaires: Formulaires = {};

  public constructor(
    idGenerator: InMemoryFormulaireIdGenerator = new DefaultIdGenerator()
  ) {
    this.idGenerator = idGenerator;
  }

  public async save(formulaire: FormulaireEntity): Promise<FormulaireIdEntity> {
    const id = this.idGenerator.nextId();
    this._formulaires[id] = formulaire;
    return FormulaireIdEntity.create(id);
  }

  public async getAllFormulaires() {
    const formulaires = [];
    for (let id in this._formulaires) {
      formulaires.push(this._formulaires[id]);
    }
    return formulaires;
  }

  public async getFormulaire(id: FormulaireIdEntity) {
    return this._formulaires[id.id];
  }

  public async updateFormulaire(
    id: FormulaireIdEntity,
    formulaire: FormulaireEntity
  ) {
    if (!this._formulaires[id.id]) {
      return undefined;
    }
    this._formulaires[id.id] = formulaire;
    return id;
  }

  setFormulaires(formulaires: Formulaires) {
    this._formulaires = formulaires;
  }
}
