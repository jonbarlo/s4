import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.createTable(
    { tableName: 'Files', schema: 'scams3_root' },
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
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
        references: { model: { tableName: 'Buckets', schema: 'scams3_root' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: { tableName: 'Users', schema: 'scams3_root' }, key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    }
  );
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.dropTable({ tableName: 'Files', schema: 'scams3_root' });
};
