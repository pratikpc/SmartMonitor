import {
  Table,
  AllowNull,
  Column,
  DataType,
  Unique,
  BeforeValidate,
  BeforeCreate,
  BeforeBulkCreate,
  Model,
  ForeignKey,
  CreatedAt
} from "sequelize-typescript";
import { existsSync } from "fs";
import { Displays } from "./Display.Models";

@Table
export class Files extends Model<Files> {
  @AllowNull(false)
  @Column(DataType.TEXT)
  Name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  Extension!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  Location!: string;

  @AllowNull(false)
  @ForeignKey(() => Displays)
  @Column
  DisplayID!: number;

  @AllowNull(false)
  @Unique
  @Column(DataType.TEXT)
  PathToFile!: string;

  @AllowNull(false)
  @CreatedAt
  @Column
  CreationDate!: Date;

  private GetFileLocation(): string {
    return this.Location + "/" + this.Name + "." + this.Extension;
  }

  @BeforeBulkCreate
  @BeforeCreate
  public static CheckFileExistence(File: Files, options: any): void {
    const filename = File.GetFileLocation();
    File.PathToFile = filename;

    if (existsSync(File.PathToFile)) {
      throw "File Already Exists at " + File.PathToFile;
    }
  }
}
