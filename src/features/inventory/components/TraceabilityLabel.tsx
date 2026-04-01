import React from 'react';
import { Snowflake, AlertCircle, Calendar, Hash } from 'lucide-react';
import type { Batch, CatalogItem } from '../../../db/db';

interface Props {
  batch: Batch;
  product: CatalogItem;
  quantity?: number;
}

export default function TraceabilityLabel({ batch, product, quantity }: Props) {
  const isFrozen = batch.lotNumber.startsWith('FROZEN-');

  return (
    <div className="traceability-label bg-white text-black p-4 border-2 border-black w-[100mm] h-[50mm] flex flex-col justify-between overflow-hidden font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .traceability-label, .traceability-label * { visibility: visible; }
          .traceability-label { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100mm; 
            height: 50mm;
            border: 1px solid black; 
          }
        }
      `}</style>

      {/* Header: Name & Type */}
      <header className="flex justify-between items-start border-b border-black pb-1 mb-1">
        <div className="flex-1">
          <h2 className="text-sm font-black uppercase leading-tight truncate">{product.name}</h2>
          <p className="text-[8px] font-bold uppercase text-zinc-600">
            {isFrozen ? 'PRODUIT SURGELÉ (HACCP)' : 'PRODUIT RECYCLÉ'}
          </p>
        </div>
        {isFrozen && <Snowflake className="w-5 h-5 text-black" />}
      </header>

      {/* Body: Dates & Lot */}
      <div className="flex-1 grid grid-cols-2 gap-2 mt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" />
            <span className="text-[9px] font-black uppercase">LOT: {batch.lotNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            <span className="text-[8px] font-bold uppercase">PROD: {new Date(batch.purchaseDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-2.5 h-2.5" />
            <span className="text-[9px] font-black uppercase">DCD: {new Date(batch.expirationDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="border-l border-dashed border-black pl-2">
           <p className="text-[7px] font-black uppercase mb-0.5">Allergènes:</p>
           <div className="flex flex-wrap gap-0.5">
              {product.allergens && product.allergens.length > 0 ? (
                product.allergens.map(a => (
                  <span key={a} className="bg-black text-white px-1 text-[7px] font-black rounded uppercase">{a}</span>
                ))
              ) : (
                <span className="text-[7px] font-medium italic">Aucun identifié</span>
              )}
           </div>
        </div>
      </div>

      {/* Footer: Qty & Temp */}
      <footer className="mt-1 pt-1 border-t border-black flex justify-between items-end">
        <div>
          <span className="text-[7px] font-bold uppercase">Température: </span>
          <span className="text-[9px] font-black">{isFrozen ? '-18°C' : '+4°C'}</span>
        </div>
        <div className="text-right">
           <span className="text-[7px] font-bold uppercase">UVC: </span>
           <span className="text-[12px] font-black">{quantity || batch.currentQuantity}</span>
        </div>
      </footer>
    </div>
  );
}
