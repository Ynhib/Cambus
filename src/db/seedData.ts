import { db } from './db';

/**
 * Calcule un timestamp basé sur la date du jour plus un nombre de jours.
 */
const daysFromNow = (days: number) => {
  return Date.now() + days * 24 * 60 * 60 * 1000;
};

export async function injectDummyData() {
  try {
    // 1. Nettoyage des tables v4
    await db.catalog.clear();
    await db.batches.clear();
    await db.recipes.clear();
    await db.suppliers.clear();
    await db.productionHistory.clear();

    console.log('Tables nettoyées. Injection des données ERP (v4)...');

    // 2. Injection des Fournisseurs
    const supplierIds = await db.suppliers.bulkAdd([
      { name: 'Moulins de Paris', email: 'commandes@moulins.fr', method: 'EMAIL', contactName: 'M. Meunier' },
      { name: 'Metro (Cash & Carry)', email: 'rayon-frais@metro.fr', method: 'CASH_AND_CARRY' },
      { name: 'Beurre & Saveurs', email: 'patisserie@beurre.fr', method: 'EMAIL' },
    ], { allKeys: true });

    // 3. Injection du Catalogue (Référentiel)
    await db.catalog.bulkAdd([
      { name: 'Farine T65', category: 'Farine', unit: 'kg', minStockAlert: 100, defaultSupplierId: supplierIds[0] },
      { name: 'Beurre de Tourage 82%', category: 'Beurre', unit: 'kg', minStockAlert: 15, defaultSupplierId: supplierIds[2] },
      { name: 'Levure Fraîche', category: 'Levure', unit: 'kg', minStockAlert: 1, defaultSupplierId: supplierIds[1] },
      { name: 'Lait Entier', category: 'Laitage', unit: 'L', minStockAlert: 5, defaultSupplierId: supplierIds[1] },
      { name: 'Chocolat Noir 70%', category: 'Chocolat', unit: 'kg', minStockAlert: 2, defaultSupplierId: supplierIds[1] },
    ]);

    const catalog = await db.catalog.toArray();
    const findId = (name: string) => catalog.find(i => i.name === name)?.id || 0;

    // 4. Injection des Lots (Batches)
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await db.batches.bulkAdd([
      {
        productId: findId('Farine T65'),
        supplierId: supplierIds[0],
        lotNumber: 'FAR-001',
        purchaseDate: now - 30 * day,
        expirationDate: now + 150 * day,
        initialQuantity: 100,
        currentQuantity: 30, // SOUS LE SEUIL (100)
        totalPriceHT: 150,
        unitPriceHT: 1.50
      },
      {
        productId: findId('Beurre de Tourage 82%'),
        supplierId: supplierIds[2],
        lotNumber: 'BEU-2024-01',
        purchaseDate: now - 10 * day,
        expirationDate: now + 20 * day,
        initialQuantity: 25,
        currentQuantity: 8, // SOUS LE SEUIL (15)
        totalPriceHT: 212.5,
        unitPriceHT: 8.50
      }
    ]);

    // 5. Injection des Recettes
    await db.recipes.bulkAdd([
      {
        name: 'Croissant au beurre',
        category: 'Viennoiserie',
        yield: 50,
        ingredients: [
          { ingredientId: findId('Farine T65'), requiredQuantity: 2.5 },
          { ingredientId: findId('Beurre de Tourage 82%'), requiredQuantity: 1.25 },
        ],
      }
    ]);

    console.log('Injection v4 terminée avec succès !');
  } catch (error) {
    console.error('Erreur Seeding v4 :', error);
    throw error;
  }
}

