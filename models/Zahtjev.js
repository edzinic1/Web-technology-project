module.exports = (sequelize, DataTypes) => {
    const Zahtjev = sequelize.define('Zahtjev', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tekst: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      trazeniDatum: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      odobreno: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    });
  
    Zahtjev.associate = (models) => {
      Zahtjev.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
      Zahtjev.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
    };
  
    return Zahtjev;
  };
  