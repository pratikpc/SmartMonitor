import {
  Table,
  Column,
  Model,
  AllowNull,
  Default,
  Unique,
  DataType
} from 'sequelize-typescript';

import * as bcrypt from 'bcrypt';

// Set Authority Based Enummeration
export type Authority = 'NORMAL' | 'ADMIN';

// Create the Table to Store Users Data
@Table
export class Users extends Model<Users> {
  @AllowNull(false)
  @Unique
  @Column(DataType.TEXT)
  Name!: string;
  @AllowNull(false)
  @Column(DataType.TEXT)
  // Return the Password Value as it is
  get Password(): string {
    return this.getDataValue('Password');
  }
  // Salt and Hash the Password Value before setting it to this
  set Password(value: string) {
    // Set Number of Salting Rounds as 10
    const salt_rounds = 2;
    const hash = bcrypt.hashSync(value, salt_rounds);
    this.setDataValue('Password', hash);
  }
  @Default('NORMAL')
  @AllowNull(false)
  @Column(DataType.ENUM('NORMAL', 'ADMIN'))
  Authority!: string;

  public static async InsertIfNotExists(user: any) {
    // Name is the only Parameter that is supposed to be unique among all of these
    const count = await Users.count({ where: { Name: user.Name } });
    if (count === 0) await Users.create(user);
  }

  public static DefaultUser = {
    Name: 'universe',
    Password: 'universe',
    Authority: 'ADMIN'
  };
}
