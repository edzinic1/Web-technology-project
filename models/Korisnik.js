module.exports = (sequelize, DataTypes) => {
    const Korisnik = sequelize.define('Korisnik', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      prezime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    });
  
    Korisnik.associate = (models) => {
      Korisnik.hasMany(models.Upit, { foreignKey: 'korisnikId' });
      Korisnik.hasMany(models.Zahtjev, { foreignKey: 'korisnikId' });
      Korisnik.hasMany(models.Ponuda, { foreignKey: 'korisnikId' });
    };
  
    return Korisnik;
  };
  