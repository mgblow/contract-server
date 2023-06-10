import { v4 as uuidv4 } from "uuid";

export class User {
  constructor(phone: string) {
    this.id = phone;
    this.phone = phone;
    const date = new Date();
    this.createdAt = date.getTime();
    this.updatedAt = date.getTime();
  }

  id: string;
  phone: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}
