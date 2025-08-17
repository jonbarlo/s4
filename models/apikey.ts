import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface ApiKeyAttributes {
  id?: number;
  userId: number;
  key: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id'> {}

export class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
  public id!: number;
  public userId!: number;
  public key!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  ApiKey.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'ApiKey',
      tableName: 'ApiKeys',
    }
  );
  return ApiKey;
};
