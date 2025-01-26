module.exports = (sequelize, DataTypes) => {
    const Upit = sequelize.define('Upit', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tekst: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    });
  
    Upit.associate = (models) => {
      Upit.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
      Upit.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
    };
  
    return Upit;
  };
  