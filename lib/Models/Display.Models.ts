import {
  Table,
  Column,
  Model,
  AllowNull,
  DataType,
  CreatedAt,
  ForeignKey,
  BeforeValidate
} from "sequelize-typescript";

import * as crypto from "crypto";
import { Users } from "./Users.Model";

@Table
export class Displays extends Model<Displays> {
  @AllowNull(false)
  @Column(DataType.TEXT)
  Name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  IdentifierKey!: string;

  @ForeignKey(() => Users)
  @Column
  CreatingUserID!: number;

  @CreatedAt
  @Column
  CreationDate!: Date;

  @BeforeValidate
  static SetIdentifierKey(display: Displays): void {
    display.IdentifierKey = crypto.randomBytes(20).toString("hex");
    console.log("Hello");
  }
}
