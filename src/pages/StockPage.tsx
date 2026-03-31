import React, { useState } from 'react';
import { Package, Search, Filter, Plus, AlertTriangle, ChevronRight, MoreVertical } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CatalogItem } from '../db/db';
import StockDetailPanel from '../features/inventory/components/StockDetailPanel';

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);

  // Charger le catalogue
  const products = useLiveQuery(
    () => db.catalog.toArray(),
    []
  ) || [];

  // Charger tous les lots pour calculer les sommes
  const batches = useLiveQuery(
    () => db.batches.toArray(),
    []
  ) || [];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcul du stock pour un produit donné
  const getProductStock = (productId: number) => {
    return batches
      .filter(b => b.productId === productId)
      .reduce((acc, curr) => acc + curr.currentQuantity, 0);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-profit-DEFAULT/20 rounded-xl">
              <Package className="w-8 h-8 text-profit-light" />
            </span>
            Gestion des Stocks
          </h1>
          <p className="text-inox-muted text-sm font-medium mt-1">Niveau industriel & Traçabilité des lots</p>
        </div>
        <button className="p-4 bg-action-DEFAULT text-inox-900 rounded-2xl shadow-inox-glow active:scale-95 transition-transform flex items-center gap-2 font-black text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 stroke-[3]" />
          <span className="hidden sm:inline">Nouveau Produit</span>
        </button>
      </header>

      {/* Barre de recherche & Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-4 w-5 h-5 text-inox-muted group-focus-within:text-action-light transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher Farine, Beurre, Lot..." 
            className="w-full bg-inox-800 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-action-DEFAULT transition-all"
          />
        </div>
        <button className="px-6 bg-inox-800 border-2 border-slate-700/50 rounded-2xl flex items-center justify-center gap-2 text-inox-muted hover:text-white transition-colors min-h-[60px]">
          <Filter className="w-5 h-5" />
          <span className="font-bold text-xs uppercase tracking-widest">Filtres</span>
        </button>
      </div>

      {/* Liste du catalogue */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const totalStock = getProductStock(product.id || 0);
            const isAlert = totalStock < product.minStockAlert;

            return (
              <button 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className={`p-5 bg-inox-800 border-2 border-slate-700/50 rounded-3xl flex flex-col md:flex-row md:items-center justify-between group hover:border-slate-500 transition-all text-left relative overflow-hidden active:scale-[0.99] ${isAlert ? 'border-fefo-DEFAULT/40' : ''}`}
              >
                {isAlert && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fefo-DEFAULT/5 rounded-bl-full -mr-8 -mt-8 flex items-center justify-center pointer-events-none">
                    <AlertTriangle className="w-6 h-6 text-fefo-light translate-x-3 translate-y-3" />
                  </div>
                )}

                <div className="flex items-center gap-5 flex-1">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isAlert ? 'bg-fefo-DEFAULT/20 text-fefo-light' : 'bg-slate-700/30 text-inox-muted group-hover:bg-slate-700/50'}`}>
                     <Package className="w-7 h-7" />
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <p className="font-black text-lg text-white uppercase tracking-tight">{product.name}</p>
                       {isAlert && (
                         <span className="text-[10px] font-black uppercase bg-fefo-DEFAULT/20 text-fefo-light px-2 py-0.5 rounded-full border border-fefo-DEFAULT/30">
                           Stock Critique
                         </span>
                       )}
                     </div>
                     <p className="text-xs text-inox-muted font-bold uppercase tracking-widest">{product.category} • Seuil : {product.minStockAlert} {product.unit}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-8 mt-5 md:mt-0 px-2 lg:px-6">
                  <div className="text-right">
                    <p className={`text-3xl font-black ${isAlert ? 'text-fefo-light' : 'text-white'}`}>
                      {totalStock} <span className="text-sm font-bold opacity-60">{product.unit}</span>
                    </p>
                    <p className="text-[10px] text-inox-muted font-bold uppercase tracking-widest mt-0.5">En Stock (Lots cumulés)</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-full group-hover:bg-action-DEFAULT group-hover:text-inox-950 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-inox-900/40 border-2 border-dashed border-slate-700 rounded-[40px]">
            <div className="p-6 bg-slate-800 rounded-3xl">
              <Search className="w-10 h-10 text-inox-muted opacity-30" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Aucun produit trouvé</p>
              <p className="text-inox-muted text-sm max-w-xs mx-auto">Vérifiez l'orthographe ou ajoutez un nouveau produit au catalogue.</p>
            </div>
            <button className="px-6 py-3 bg-action-DEFAULT/10 hover:bg-action-DEFAULT/20 text-action-light rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
              Effacer la recherche
            </button>
          </div>
        )}
      </div>

      {/* Detail Panel Slide-over */}
      {selectedProduct && (
        <StockDetailPanel 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Admin Quick Link */}
      <div className="flex justify-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
          Industrial Grade Inventory System v3.0 // AR-CAT-ERP
        </p>
      </div>
      
    </div>
  );
}

