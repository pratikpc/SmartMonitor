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

import { Users } from "./Users.Model";

@Table
export class Displays extends Model<Displays> {
  @AllowNull(false)
  @Column(DataType.TEXT)
  Name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  IdentifierKey!: string;

  @AllowNull(false)
  @ForeignKey(() => Users)
  @Column
  CreatingUserID!: number;

  @CreatedAt
  @Column
  CreationDate!: Date;
}
