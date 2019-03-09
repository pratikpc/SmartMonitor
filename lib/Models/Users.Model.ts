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
  password!: string;
  @Default("NORMAL")
  @AllowNull(false)
  @Column(DataType.ENUM("NORMAL", "ADMIN"))
  authority!: string;

  public static async InsertIfNotExists(user: any) {
    const count = await Users.count({ where: { name: user.name } });

    if (count != 0)
        return null;
    return Users.create(user);
  }

  public static DefaultUser={
    name: "universe",
    password: "universe",
    authority: "ADMIN"
  };
}