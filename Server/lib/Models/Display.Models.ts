import { Table, Column, Model, AllowNull, DataType, CreatedAt, ForeignKey, Unique } from 'sequelize-typescript';

import Users from './Users.Model';

@Table
export default class Displays extends Model<Displays> {
   @AllowNull(false)
   @Unique
   @Column(DataType.TEXT)
   Name!: string;

   @AllowNull(false)
   @Column(DataType.TEXT)
   IdentifierKey!: string;

   @AllowNull(false)
   @ForeignKey(() => Users as never)
   @Column
   CreatingUserID!: number;

   @CreatedAt
   @Column
   CreationDate!: Date;
}
