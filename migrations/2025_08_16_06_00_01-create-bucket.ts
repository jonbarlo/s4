import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.createTable('Buckets', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetFTPfolder: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.dropTable('Buckets');
};
