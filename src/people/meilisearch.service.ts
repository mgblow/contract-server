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
      host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
      apiKey: process.env.MEILI_API_KEY || '',
    });

    this.peopleIndex = this.client.index('people');

    // Configure searchable, filterable, sortable fields
    await this.peopleIndex.updateSearchableAttributes([
      'username', 'about',
    ]);

    await this.peopleIndex.updateFilterableAttributes([
      'gender', 'age', 'hobbies', 'businessTypes', 'avatarStyle',
      'topType', 'accessories', 'hairColor', 'eyeType', 'skinColor',
    ]);

    await this.peopleIndex.updateSortableAttributes([
      'createdAt', 'updatedAt', 'popularityScore', 'age'
    ]);

    this.logger.log('MeiliSearch initialized for people index');
  }

  getPeopleIndex(): Index<any> {
    return this.peopleIndex;
  }

  async addOrUpdatePerson(document: any) {
    await this.peopleIndex.addDocuments([document]);
  }

  async deletePerson(id: string) {
    await this.peopleIndex.deleteDocument(id);
  }

  async searchPeople(query: string, filters?: string, limit = 20, offset = 0, sort?: string[]) {
    return this.peopleIndex.search(query || '', {
      filter: filters,
      limit,
      offset,
      sort,
    });
  }
}
