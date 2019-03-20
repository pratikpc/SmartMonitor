import {
  Table,
  AllowNull,
  Column,
  DataType,
  Unique,
  BeforeValidate,
  Model,
  ForeignKey,
  CreatedAt,
  Default
} from "sequelize-typescript";
import { existsSync } from "fs";
import { Displays } from "./Display.Models";
import { join } from "path";

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
  @Column(DataType.TEXT)
  PathToFile!: string;

  @AllowNull(false)
  @CreatedAt
  @Column
  CreationDate!: Date;

  @AllowNull(false)
  @Column(DataType.NUMERIC)
  FileSize!: number;

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

  public GetThumbnailFileLocation(): string {
    return join(this.Location, Files.GetThumbnailFileName(this.Name));
  }
  public static GetThumbnailFileName(Name: string): string {
    return "thumb-" + Name + ".png";
  }

  private GetFileLocation(): string {
    return join(this.Location, this.Name + "." + this.Extension);
  }

  @BeforeValidate
  public static SetDisplayAndDownloadToDefault(File: Files): void {
    if (File.OnDisplay == true) File.OnDisplay = true;
    if (File.Downloaded == true) File.OnDisplay = true;
  }

  @BeforeValidate
  public static CheckFileExistence(File: Files): void {
    const filename = File.GetFileLocation();
    File.PathToFile = filename;

    if (!existsSync(File.PathToFile)) {
      throw "File Not Exists at " + File.PathToFile;
    }
  }
}
