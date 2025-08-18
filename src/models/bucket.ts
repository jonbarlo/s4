import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface BucketAttributes {
  id?: number;
  name: string;
  targetFTPfolder: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BucketCreationAttributes extends Optional<BucketAttributes, 'id'> {}

export class Bucket extends Model<BucketAttributes, BucketCreationAttributes> implements BucketAttributes {
  public id!: number;
  public name!: string;
  public targetFTPfolder!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Bucket.hasMany(models.File, { foreignKey: 'bucketId', as: 'files' });
  }
}

export default (sequelize: Sequelize) => {
  Bucket.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      targetFTPfolder: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Bucket',
      tableName: 'Buckets',
    }
  );
  return Bucket;
};
