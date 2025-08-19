import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface FileAttributes {
  id?: number;
  filename: string;
  size: number;
  uploadedAt: Date;
  bucketId: number;
  userId: number;
  targetFTPfolder: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FileCreationAttributes extends Optional<FileAttributes, 'id'> {}

export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number;
  public filename!: string;
  public size!: number;
  public uploadedAt!: Date;
  public bucketId!: number;
  public userId!: number;
  public targetFTPfolder!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    File.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    File.belongsTo(models.Bucket, { foreignKey: 'bucketId', as: 'bucket' });
  }
}

export default (sequelize: Sequelize) => {
  File.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      bucketId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
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
      modelName: 'File',
      tableName: 'Files',
    }
  );
  return File;
};
