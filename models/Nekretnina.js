module.exports = (sequelize, DataTypes) => {
    const Nekretnina = sequelize.define('Nekretnina', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tip_nekretnine: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      naziv: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kvadratura: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cijena: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      tip_grijanja: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lokacija: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      godina_izgradnje: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      datum_objave: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      opis: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    });
  
    Nekretnina.associate = (models) => {
      Nekretnina.hasMany(models.Upit, { foreignKey: 'nekretninaId' });
      Nekretnina.hasMany(models.Zahtjev, { foreignKey: 'nekretninaId' });
      Nekretnina.hasMany(models.Ponuda, { foreignKey: 'nekretninaId' });
    };
  
    Nekretnina.prototype.getInteresovanja = function() {
      return Promise.all([
        this.getUpiti(),
        this.getZahtjevi(),
        this.getPonude()
      ]).then(([upiti, zahtjevi, ponude]) => {
        return [...upiti, ...zahtjevi, ...ponude];
      });
    };
  
    return Nekretnina;
  };
  