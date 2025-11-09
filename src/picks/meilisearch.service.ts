import { Injectable } from "@nestjs/common";
import { MeiliSearch } from "meilisearch";

@Injectable()
export class MeiliSearchService {
  private client = new MeiliSearch({ host: process.env.MEILI_HOST, apiKey: process.env.MEILI_API_KEY });

  private peopleIndex = this.client.index("people");
  private picksIndex = this.client.index("picks");

  async addOrUpdatePerson(person: any) {
    await this.peopleIndex.addDocuments([person]);
  }

  async deletePerson(id: string) {
    await this.peopleIndex.deleteDocument(id);
  }

  async searchPeople(query: string, filters?: string, limit = 20, offset = 0, sort?: string[]) {
    return this.peopleIndex.search(query, { filter: filters, limit, offset, sort });
  }

  async addOrUpdatePick(pick: any) {
    await this.picksIndex.addDocuments([pick]);
  }

  async deletePick(id: string) {
    await this.picksIndex.deleteDocument(id);
  }

  async searchPicks(query: string, filters?: string, limit = 20, offset = 0, sort?: string[]) {
    return this.picksIndex.search(query, { filter: filters, limit, offset, sort });
  }
}
