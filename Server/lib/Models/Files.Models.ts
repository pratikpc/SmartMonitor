import { Table, AllowNull, Column, DataType, Model, ForeignKey, CreatedAt, Default } from 'sequelize-typescript';
import { parse } from 'path';
import Displays from './Display.Models';

@Table
export default class Files extends Model {
   @AllowNull(false)
   @Column(DataType.TEXT)
   Extension!: string;

   @AllowNull(false)
   @ForeignKey(() => Displays as never)
   @Column
   DisplayID!: number;

   @AllowNull(false)
   @CreatedAt
   @Column
   CreationDate!: Date;

   @AllowNull(false)
   @Default(true)
   @Column(DataType.BOOLEAN)
   OnDisplay!: boolean;

   @AllowNull(false)
   @Default(true)
   @Column(DataType.BOOLEAN)
   Downloaded!: boolean;

   @AllowNull(false)
   @Column(DataType.TEXT)
   FileHash!: string;

   @AllowNull(false)
   @Column(DataType.TEXT)
   MediaType!: string;

   @AllowNull(false)
   @Column(DataType.DECIMAL)
   TimeStart!: number;

   @AllowNull(false)
   @Column(DataType.DECIMAL)
   TimeEnd!: number;

   @AllowNull(false)
   @Column(DataType.DECIMAL)
   ShowTime!: number;

   get FileName() {
      return `${this.FileHash}.${this.Extension}`;
   }

   get ThumbnailName() {
      return Files.GetThumbnailFileName(this.FileHash);
   }

   public static GetThumbnailFileName(Path: string): string {
      const Name = parse(Path).name;
      return `thumb-${Name}.png`;
   }
}
