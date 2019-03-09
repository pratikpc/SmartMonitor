import {
  Table,
  Column,
  Model,
  AllowNull,
  Default,
  Unique,
  DataType,
  Sequelize,
  PrimaryKey
} from "sequelize-typescript";

import * as bcrypt from "bcrypt";

// Set Authority Based Enummeration
export type Authority = "NORMAL" | "ADMIN";

// Create the Table to Store Users Data
@Table
export class Users extends Model<Users> {
  @AllowNull(false)
  @Unique
  @Column
  name!: string;
  @AllowNull(false)
  @Column
  // Return the Password Value as it is
  get password(): string {
    return this.getDataValue("password");
  }
  // Salt and Hash the Password Value before setting it to this
  set password(value: string) {
    // Set Number of Salting Rounds as 10
    const salt_rounds = 5;
    const hash = bcrypt.hashSync(value, salt_rounds);
    this.setDataValue("password", hash);
  }
  @Default("NORMAL")
  @AllowNull(false)
  @Column(DataType.ENUM("NORMAL", "ADMIN"))
  authority!: string;

  public static async InsertIfNotExists(user: any) {
    const count = await Users.count({ where: { name: user.name } });
    if (count !== 0) return null;
    return Users.create(user);
  }

  public static DefaultUser = {
    name: "universe",
    password: "universe",
    authority: "ADMIN"
  };
}
