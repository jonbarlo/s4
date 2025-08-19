import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const filesTable = isTest ? 'Files' : { tableName: 'Files', schema: 'scams3_root' };
  await context.createTable(filesTable, {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
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
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const filesTable = isTest ? 'Files' : { tableName: 'Files', schema: 'scams3_root' };
  await context.dropTable(filesTable);
};
