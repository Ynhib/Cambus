import { db, type Recipe, type Batch } from '../../../db/db';

/**
 * Moteur de Production FEFO (First-Expiry-First-Out)
 * Déduit les quantités d'ingrédients des lots en fonction de leur date de péremption.
 */
export async function produceRecipe(recipeId: number, quantityToProduce: number) {
  return await db.transaction('rw', [db.batches, db.catalog, db.recipes, db.productionHistory], async () => {
    // 1. Récupérer la recette
    const recipe = await db.recipes.get(recipeId);
    if (!recipe) throw new Error("Recette introuvable");

    console.log(`Début de production : ${recipe.name} x ${quantityToProduce}`);

    const productionDetails: { ingredientName: string, quantityUsed: number, cost: number }[] = [];
    let totalProductionCost = 0;

    // 2. Pour chaque ingrédient, vérifier et déduire
    for (const item of recipe.ingredients) {
      const catalogItem = await db.catalog.get(item.ingredientId);
      if (!catalogItem) throw new Error(`Ingrédient ID ${item.ingredientId} introuvable dans le catalogue`);

      const totalNeeded = item.requiredQuantity * quantityToProduce;
      let remainingToDeduct = totalNeeded;
      let totalIngredientCost = 0;

      // Récupérer les lots actifs (quantité > 0) triés par expiration la plus proche (FEFO)
      const activeBatches = await db.batches
        .where('productId')
        .equals(item.ingredientId)
        .filter(b => b.currentQuantity > 0)
        .sortBy('expirationDate');

      const totalAvailable = activeBatches.reduce((acc, b) => acc + b.currentQuantity, 0);

      // Vérification Préalable (Atomicité)
      if (totalAvailable < totalNeeded) {
        throw new Error(`Rupture de stock pour "${catalogItem.name}" : Besoin ${totalNeeded}${catalogItem.unit}, disponible ${totalAvailable}${catalogItem.unit}`);
      }

      // Déduction lot par lot
      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;

        const deduction = Math.min(batch.currentQuantity, remainingToDeduct);
        const batchCost = deduction * batch.unitPriceHT;

        // Mise à jour du lot
        await db.batches.update(batch.id!, {
          currentQuantity: batch.currentQuantity - deduction
        });

        remainingToDeduct -= deduction;
        totalIngredientCost += batchCost;
      }

      productionDetails.push({
        ingredientName: catalogItem.name,
        quantityUsed: totalNeeded,
        cost: totalIngredientCost
      });

      totalProductionCost += totalIngredientCost;
    }

    // 3. Enregistrer dans l'historique
    const historyId = await db.productionHistory.add({
      recipeId: recipe.id!,
      recipeName: recipe.name,
      date: Date.now(),
      quantityProduced: quantityToProduce,
      totalCostHT: totalProductionCost,
      unitCostHT: totalProductionCost / quantityToProduce,
      details: productionDetails
    });

    console.log(`Production terminée ! ID Historique: ${historyId}, Coût Total: ${totalProductionCost.toFixed(2)}€`);
    
    return {
      historyId,
      totalCost: totalProductionCost,
      unitCost: totalProductionCost / quantityToProduce
    };
  });
}
