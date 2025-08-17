import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.createTable('Users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.ENUM(
        'FULL_CONTROL',
        'READ',
        'WRITE',
        'READ_ACP',
        'WRITE_ACP',
        'NONE'
      ),
      allowNull: false,
      defaultValue: 'READ',
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
  await context.dropTable('Users');
};
