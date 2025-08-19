import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const bucketsTable = isTest ? 'Buckets' : { tableName: 'Buckets', schema: 'scams3_root' };
  await context.createTable(bucketsTable, {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    targetFTPfolder: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DIALECT === 'sqlite';
  const bucketsTable = isTest ? 'Buckets' : { tableName: 'Buckets', schema: 'scams3_root' };
  await context.dropTable(bucketsTable);
};
