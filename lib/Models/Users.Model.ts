import {
  Table,
  Column,
  Model,
  AllowNull,
  Default,
  Unique,
  DataType
} from "sequelize-typescript";

import * as bcrypt from "bcrypt";

// Set Authority Based Enummeration
export type Authority = "NORMAL" | "ADMIN";

export class UserViewModel {
  public id: number;
  public Name: string;
  public Authority: string;

  public constructor(id: number, Name: string, Authority: string) {
    this.id = id;
    this.Name = Name;
    this.Authority = Authority;
  }
}

export interface UserAddModel {
  Name: string;
  Password: string;
  Authority: string;
}

// Create the Table to Store Users Data
@Table
export class Users extends Model<Users> {
  @AllowNull(false)
  @Unique
  @Column(DataType.TEXT)
  Name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  get Password() {
    return this.getDataValue("Password");
  }
  set Password(value: string) {
    this.EncryptPassword(value);
  }

  @Default("NORMAL")
  @AllowNull(false)
  @Column(DataType.ENUM("NORMAL", "ADMIN"))
  Authority!: string;

  // Perform Password Encryption
  private EncryptPassword(value: string) {
    const salt_rounds = 2;
    const hash = bcrypt.hashSync(value, salt_rounds);
    this.setDataValue("Password", hash);
  }

  // Use this to Verify if the Entered Password is same as
  // Encrypted password
  public ComparePassword(password: string) {
    return bcrypt.compare(password, this.Password);
  }

  public static async InsertIfNotExists(user: UserAddModel) {
    // Name is the only Parameter that is supposed to be unique among all of these
    const count = await Users.count({ where: { Name: user.Name } });
    if (count === 0) await Users.create(user);
  }

  public static DefaultUser: UserAddModel = {
    Name: "universe",
    Password: "universe",
    Authority: "ADMIN"
  };
}
