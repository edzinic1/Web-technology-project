module.exports = (sequelize, DataTypes) => {
    const Ponuda = sequelize.define('Ponuda', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tekst: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cijenaPonude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      datumPonude: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      odbijenaPonuda: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ponudaId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    });
  
    Ponuda.associate = (models) => {
      Ponuda.belongsTo(models.Korisnik, { foreignKey: 'korisnikId' });
      Ponuda.belongsTo(models.Nekretnina, { foreignKey: 'nekretninaId' });
      Ponuda.hasMany(models.Ponuda, { foreignKey: 'ponuda_id', as: 'vezanePonude' }); // Veza sa vezanim ponudama
      Ponuda.belongsTo(models.Ponuda, { foreignKey: 'ponuda_id', as: 'originalPonuda' }); // Veza sa originalnom ponudom
    };
  
    return Ponuda;
  };
  