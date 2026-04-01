import { useState, useCallback } from 'react';
import { db } from '../../../db/db';
import type { Batch, CatalogItem } from '../../../db/db';

export function useLabelPrinter() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<{ batch: Batch; product: CatalogItem } | null>(null);

  const printLabel = useCallback(async (batchId: number) => {
    setIsPrinting(true);
    try {
      const batch = await db.batches.get(batchId);
      if (!batch) throw new Error("Lot introuvable");
      
      const product = await db.catalog.get(batch.productId);
      if (!product) throw new Error("Produit introuvable");

      setPrintData({ batch, product });
      
      // Delay to allow rendering before print dialog
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
        setPrintData(null);
      }, 500);

    } catch (error) {
      console.error("Erreur d'impression:", error);
      setIsPrinting(false);
      setPrintData(null);
    }
  }, []);

  return { printLabel, isPrinting, printData };
}
