import { db } from './db';

/**
 * Script de Seeding Avancé (v5)
 * Injecte des données de comptabilité analytique pour tester les marges réelles.
 */
export async function injectAdvancedData() {
  try {
    await db.transaction('rw', [db.catalog, db.batches, db.recipes, db.suppliers, db.laborRoles, db.equipment], async () => {
      // 1. Nettoyage
      await db.catalog.clear();
      await db.batches.clear();
      await db.recipes.clear();
      await db.suppliers.clear();
      await db.laborRoles.clear();
      await db.equipment.clear();

      console.log('Injection des données analytiques (v5)...');

      // 2. Fournisseurs
      const supplierIds = await db.suppliers.bulkAdd([
        { name: 'Grands Moulins', email: 'meunier@moulins.com', method: 'EMAIL' },
        { name: 'Cacao Barry', email: 'direct@cacao.fr', method: 'EMAIL' },
        { name: 'Metro', email: 'contact@metro.fr', method: 'CASH_AND_CARRY' },
      ], { allKeys: true });

      // 3. Rôles (Labor)
      const roleIds = await db.laborRoles.bulkAdd([
        { name: 'Chef Pâtissier', hourlyCost: 28 },
        { name: 'Ouvrier Boulanger', hourlyCost: 22 },
        { name: 'Apprenti', hourlyCost: 12 },
      ], { allKeys: true });

      // 4. Équipement (Overhead)
      const equipIds = await db.equipment.bulkAdd([
        { name: 'Vieux Four à Sole', hourlyCost: 1.80 },
        { name: 'Four Ventilé Récent', hourlyCost: 0.60 },
        { name: 'Cellule de Refroidissement', hourlyCost: 0.40 },
        { name: 'Pétrin à Spirale', hourlyCost: 0.25 },
      ], { allKeys: true });

      // 5. Catalogue & Lots (HACCP v11)
      await db.catalog.bulkAdd([
        { 
          name: 'Farine T65', category: 'Farine', unit: 'kg', minStockAlert: 100, defaultSupplierId: supplierIds[0],
          allergens: ['Gluten'], fatPer100: 1.5, isFreezable: true
        },
        { 
          name: 'Chocolat Noir 70%', category: 'Chocolat', unit: 'kg', minStockAlert: 5, defaultSupplierId: supplierIds[1],
          allergens: ['Soja', 'Lactose'], fatPer100: 38 
        },
        { 
          name: 'Beurre de Tourage', category: 'Beurre', unit: 'kg', minStockAlert: 10, defaultSupplierId: supplierIds[2],
          allergens: ['Lactose'], fatPer100: 82 
        },
        { 
          name: 'Crème 35%', category: 'Laitage', unit: 'L', minStockAlert: 6, defaultSupplierId: supplierIds[2],
          allergens: ['Lactose'], fatPer100: 35 
        },
        // PRODUITS FINIS POUR TEST EOD
        { name: 'Baguette Tradition', category: 'Boulangerie', unit: 'pce', minStockAlert: 0, isRepurposable: true },
        { name: 'Croissant au Beurre', category: 'Viennoiserie', unit: 'pce', minStockAlert: 0, isRepurposable: true },
      ]);

      const catalog = await db.catalog.toArray();
      const findId = (name: string) => catalog.find(i => i.name === name)?.id || 0;

      const now = Date.now();
      const todayISO = new Date().toISOString().split('T')[0];

      // Ajout d'un événement pour tester l'assistant
      await db.events.add({
        title: 'Marché de Pâques',
        date: todayISO,
        type: 'LOCAL_EVENT',
        impact: 'HIGH',
        isCompleted: false,
        source: 'MANUAL'
      });
      
      // Injection de lots HISTORIQUES pour tester la courbe de prix
      await db.batches.bulkAdd([
        { productId: findId('Farine T65'), lotNumber: 'F0', purchaseDate: now - 30 * 86400000, expirationDate: now + 1e9, initialQuantity: 500, currentQuantity: 0, totalPriceHT: 350, unitPriceHT: 0.70 },
        { productId: findId('Farine T65'), lotNumber: 'F1', purchaseDate: now - 1000, expirationDate: now + 1e9, initialQuantity: 500, currentQuantity: 500, totalPriceHT: 400, unitPriceHT: 0.80 },
        { productId: findId('Chocolat Noir 70%'), lotNumber: 'C0', purchaseDate: now - 15 * 86400000, expirationDate: now + 1e9, initialQuantity: 10, currentQuantity: 0, totalPriceHT: 180, unitPriceHT: 18.00 },
        { productId: findId('Chocolat Noir 70%'), lotNumber: 'C1', purchaseDate: now - 500, expirationDate: now + 1e9, initialQuantity: 10, currentQuantity: 10, totalPriceHT: 150, unitPriceHT: 15.00 },
        { productId: findId('Beurre de Tourage'), lotNumber: 'B2', purchaseDate: now - 100, expirationDate: now + 1e9, initialQuantity: 20, currentQuantity: 20, totalPriceHT: 160, unitPriceHT: 8.00 },
        { productId: findId('Crème 35%'), lotNumber: 'L1', purchaseDate: now - 100, expirationDate: now + 1e9, initialQuantity: 10, currentQuantity: 10, totalPriceHT: 25, unitPriceHT: 2.50 },
      ]);

      // 6. Recettes (Missions v10 : Nutrition & Sécurité)
      const recipeIds = await db.recipes.bulkAdd([
        {
          name: 'Baguette Tradition',
          category: 'Boulangerie',
          yield: 1,
          vatRate: 5.5,
          shelfLife: 12,
          ingredients: [{ ingredientId: findId('Farine T65'), requiredQuantity: 0.350 }],
          labor: [{ roleId: roleIds[2], minutesSpent: 10 }],
          equipmentUsed: [{ equipmentId: equipIds[0], minutesUsed: 25 }],
          prepSteps: [{ label: "Pétrissage", minutes: 12, type: 'KNEAD' }],
          utensils: ["Pétrin"], bakingTemp: 250, bakingTime: 22
        },
        {
          name: 'Croissant au Beurre',
          category: 'Viennoiserie',
          yield: 1,
          vatRate: 5.5,
          shelfLife: 18,
          ingredients: [{ ingredientId: findId('Farine T65'), requiredQuantity: 0.200 }],
          labor: [{ roleId: roleIds[0], minutesSpent: 15 }],
          equipmentUsed: [{ equipmentId: equipIds[0], minutesUsed: 10 }],
          prepSteps: [{ label: "Tourage", minutes: 30, type: 'PREP' }],
          utensils: ["Laminoir"], bakingTemp: 180, bakingTime: 18
        }
      ], { allKeys: true });

      // 7. HISTORIQUE DE PRODUCTION POUR TEST EOD (Aujourd'hui)
      await db.productionHistory.bulkAdd([
        { recipeId: recipeIds[0], recipeName: 'Baguette Tradition', date: now, quantityProduced: 50, totalCostHT: 25, unitCostHT: 0.50, details: [] },
        { recipeId: recipeIds[1], recipeName: 'Croissant au Beurre', date: now, quantityProduced: 30, totalCostHT: 24, unitCostHT: 0.80, details: [] }
      ]);






      console.log('Seeding Analytique v5 terminé !');
    });
  } catch (error) {
    console.error('Erreur Seeding Analytique :', error);
    throw error;
  }
}
