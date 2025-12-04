const mysql = require('mysql2/promise');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: '94.156.11.185',
    port: 3306,
    user: 'orangecandle_radmin',
    password: 'OrangeCandle14986+-',
    database: 'orangecandle_shop'
  });

  try {
    console.log('✓ Veritabanına bağlandı\n');

    // Activity logs tablosu kontrolü
    const [tables] = await connection.query("SHOW TABLES LIKE 'activity_logs'");
    console.log('activity_logs tablosu:', tables.length > 0 ? '✓ VAR' : '✗ YOK');

    if (tables.length === 0) {
      console.log('\n❌ activity_logs tablosu bulunamadı. SQL dosyasını çalıştırmanız gerekiyor.');
      console.log('Dosya yolu: prisma/migrations/add_activity_logs_manual.sql\n');
    } else {
      // Tablo yapısını göster
      const [columns] = await connection.query("DESCRIBE activity_logs");
      console.log('\nTablo yapısı:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type}`);
      });
    }

    // Address tablosu kontrolü
    console.log('\n\nAddress tablosu kontrolleri:');
    const [addressColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'orangecandle_shop' 
        AND TABLE_NAME = 'addresses' 
        AND COLUMN_NAME IN ('isBillingAddress', 'companyName', 'taxNumber', 'taxOffice')
    `);
    
    console.log('Fatura alanları:');
    const expectedFields = ['isBillingAddress', 'companyName', 'taxNumber', 'taxOffice'];
    const existingFields = addressColumns.map(c => c.COLUMN_NAME);
    
    expectedFields.forEach(field => {
      const exists = existingFields.includes(field);
      console.log(`  ${field}: ${exists ? '✓ VAR' : '✗ YOK'}`);
    });

  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabase();
