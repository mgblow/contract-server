// src/injection/meilisearch.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Index, MeiliSearch } from "meilisearch";

@Injectable()
export class MeiliSearchService implements OnModuleInit {
  private client: MeiliSearch;
  private peopleIndex: Index<any>;
  private readonly logger = new Logger(MeiliSearchService.name);

  async onModuleInit() {
    this.client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://127.0.0.1:7700",
      apiKey: process.env.MEILI_API_KEY || "",
    });

    this.peopleIndex = this.client.index("people");

    await Promise.all([
      this.peopleIndex.updateSearchableAttributes([
        "username",
        "bio",
        "hobbies",
      ]),

      this.peopleIndex.updateFilterableAttributes([
        "age",
        "gender",
        "hobbies",

        "avatarStyle",
        "topType",
        "accessoriesType",
        "hairColor",
        "facialHairType",
        "facialHairColor",
        "clotheType",
        "clotheColor",
        "eyeType",
        "eyebrowType",
        "mouthType",
        "skinColor",
      ]),

      this.peopleIndex.updateSortableAttributes([
        "createdAt",
        "updatedAt",
        "popularityScore",
        "age",
      ]),
    ]);

    this.logger.log("MeiliSearch initialized (people index)");
  }

  getPeopleIndex(): Index<any> {
    return this.peopleIndex;
  }

  // ───────────────────────────────
  // Normalized upsert
  // ───────────────────────────────
  async addOrUpdatePerson(person: any) {
    const doc = await this.mapPersonToSearchDoc(person);
    await this.peopleIndex.addDocuments([doc]);
  }

  async deletePerson(id: string) {
    await this.peopleIndex.deleteDocument(id);
  }

  async searchPeople(
    query = "",
    filters?: string,
    limit = 20,
    offset = 0,
    sort?: string[]
  ) {
    return this.peopleIndex.search(query, {
      filter: filters,
      limit,
      offset,
      sort,
    });
  }

  // ───────────────────────────────
  // Mapper (MOST IMPORTANT PART)
  // ───────────────────────────────
  async mapPersonToSearchDoc(person: any) {
    const avatar = person.avatarConfig || {};

    let newPerson = {
      id: person._id?.toString(),

      username: person.username,
      phone: person.phone,
      bio: person.bio,

      age: person.age,
      gender: person.gender,

      hobbies: person.hobbies || [],

      avatarStyle: avatar.avatarStyle,
      topType: avatar.topType,
      accessoriesType: avatar.accessoriesType,
      hairColor: avatar.hairColor,
      facialHairType: avatar.facialHairType,
      facialHairColor: avatar.facialHairColor,
      clotheType: avatar.clotheType,
      clotheColor: avatar.clotheColor,
      eyeType: avatar.eyeType,
      eyebrowType: avatar.eyebrowType,
      mouthType: avatar.mouthType,
      skinColor: avatar.skinColor,

      lat: person.location?.coordinates?.[1],
      lng: person.location?.coordinates?.[0],

      popularityScore: person.popularityScore ?? 0,

      createdAt: person.createdAt,
      updatedAt: person.updatedAt,

      _raw: person, // optional but VERY useful
    };
    return newPerson;
  }
}
