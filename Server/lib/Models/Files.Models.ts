import {
  Table,
  AllowNull,
  Column,
  DataType,
  Model,
  ForeignKey,
  CreatedAt,
  Default
} from "sequelize-typescript";
import { Displays } from "./Display.Models";
import { parse } from "path";

@Table
export class Files extends Model<Files> {
  @AllowNull(false)
  @Column(DataType.TEXT)
  Extension!: string;

  @AllowNull(false)
  @ForeignKey(() => Displays)
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
  @Column(DataType.NUMERIC)
  TimeStart!: number;

  @AllowNull(false)
  @Column(DataType.NUMERIC)
  TimeEnd!: number;

  @AllowNull(false)
  @Column(DataType.NUMERIC)
  ShowTime!: number;

  get FileName() {
    return this.FileHash + "." + this.Extension;
  }

  get ThumbnailName() {
    return Files.GetThumbnailFileName(this.FileHash);
  }
  public static GetThumbnailFileName(
    Path: string
  ): string {
    const Name = parse(Path).name;
    return "thumb-" + Name + ".png";
  }
}
