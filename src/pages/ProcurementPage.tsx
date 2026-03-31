import React, { useState } from 'react';
import { ShoppingCart, Mail, CheckSquare, ChevronRight, AlertCircle, Building2, PackageCheck, Send } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CatalogItem, type Supplier } from '../db/db';

export default function ProcurementPage() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // 1. Charger les données nécessaires
  const catalog = useLiveQuery(() => db.catalog.toArray()) || [];
  const batches = useLiveQuery(() => db.batches.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];

  // 2. Calculer les besoins (Produits sous le seuil)
  const lowStockProducts = catalog.filter(product => {
    const totalStock = batches
      .filter(b => b.productId === product.id)
      .reduce((acc, curr) => acc + curr.currentQuantity, 0);
    return totalStock < product.minStockAlert;
  });

  // 3. Grouper par fournisseur
  const procurementBySupplier: Record<number, CatalogItem[]> = {};
  lowStockProducts.forEach(product => {
    const supplierId = product.defaultSupplierId || 0;
    if (!procurementBySupplier[supplierId]) procurementBySupplier[supplierId] = [];
    procurementBySupplier[supplierId].push(product);
  });

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateEmail = (supplier: Supplier, products: CatalogItem[]) => {
    const subject = encodeURIComponent(`Commande Cambuse - ${new Date().toLocaleDateString()}`);
    const bodyText = products.map(p => `- ${p.name} (Besoin urgent)`).join('%0D%0A');
    const body = encodeURIComponent(`Bonjour ${supplier.contactName || 'l\'équipe'},\n\nVoici ma commande :\n\n${decodeURIComponent(bodyText)}\n\nMerci,\nL'Atelier Cambuse`);
    window.location.href = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-action-DEFAULT/20 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-action-light" />
            </span>
            Réapprovisionnement
          </h1>
          <p className="text-inox-muted text-sm font-medium mt-1">Identification automatique des besoins matériels</p>
        </div>
        <div className="px-4 py-2 bg-inox-800 border border-slate-700 rounded-xl text-xs font-bold text-inox-muted uppercase tracking-widest">
           {lowStockProducts.length > 0 ? `${lowStockProducts.length} articles à commander` : "Stocks à jour"}
        </div>
      </header>

      {lowStockProducts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-inox-900/40 border-2 border-dashed border-slate-700 rounded-[40px]">
          <div className="w-20 h-20 bg-profit-DEFAULT/10 rounded-full flex items-center justify-center border border-profit-DEFAULT/20 animate-pulse">
            <PackageCheck className="w-10 h-10 text-profit-light" />
          </div>
          <div>
            <p className="text-white font-black text-xl uppercase tracking-tight">Tout est sous contrôle !</p>
            <p className="text-inox-muted text-sm max-w-xs mx-auto font-medium">Vos stocks sont actuellement au-dessus des seuils d'alerte configurés.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(procurementBySupplier).map(([sId, products]) => {
            const supplier = suppliers.find(s => s.id === Number(sId)) || { name: 'Autre / Inconnu', method: 'CASH_AND_CARRY', email: '' };
            const isEmail = supplier.method === 'EMAIL';

            return (
              <div key={sId} className="bg-inox-800 border border-slate-700 rounded-[32px] overflow-hidden flex flex-col shadow-inox shadow-lg">
                
                {/* Supplier Header */}
                <div className="p-6 bg-inox-900/50 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isEmail ? 'bg-action-DEFAULT/10' : 'bg-orange-500/10'}`}>
                      <Building2 className={`w-6 h-6 ${isEmail ? 'text-action-light' : 'text-orange-500'}`} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">{supplier.name}</h2>
                      <span className="text-[10px] font-bold text-inox-muted uppercase tracking-widest px-2 py-0.5 bg-inox-800 rounded-md border border-slate-700 italic">
                        {isEmail ? '📫 Commande par Email' : '🛒 Cash & Carry (Magasin)'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-inox-muted" />
                </div>

                {/* Items List */}
                <div className="flex-1 p-6 space-y-4">
                  {products.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => !isEmail && toggleCheck(p.id!)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${!isEmail && checkedItems[p.id!] ? 'bg-profit-DEFAULT/5 border-profit-DEFAULT/30 opacity-60' : 'bg-inox-900/30 border-slate-700/50 hover:border-slate-500'}`}
                    >
                      <div className="flex items-center gap-4">
                        {!isEmail && (
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedItems[p.id!] ? 'bg-profit-DEFAULT border-profit-DEFAULT' : 'border-slate-600'}`}>
                            {checkedItems[p.id!] && <CheckSquare className="w-4 h-4 text-inox-950" />}
                          </div>
                        )}
                        <div>
                          <p className={`font-bold uppercase tracking-wide text-sm ${!isEmail && checkedItems[p.id!] ? 'line-through text-inox-muted' : 'text-white'}`}>{p.name}</p>
                          <p className="text-[10px] font-bold text-fefo-light uppercase tracking-tighter flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Seuil {p.minStockAlert} {p.unit} (Rupture proche)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-white italic">À commander</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="p-6 bg-inox-900/30 border-t border-slate-700">
                  {isEmail ? (
                    <button 
                      onClick={() => generateEmail(supplier as Supplier, products)}
                      className="w-full py-4 bg-action-DEFAULT hover:bg-action-light text-inox-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-inox-glow transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Mail className="w-5 h-5" />
                      Générer l'email de commande
                    </button>
                  ) : (
                    <div className="flex items-center justify-between px-2">
                       <p className="text-[10px] font-bold text-inox-muted uppercase tracking-widest">
                         {Object.values(checkedItems).filter(Boolean).length} / {products.length} articles cochés
                       </p>
                       <button 
                         className="text-xs font-black text-action-light uppercase hover:underline"
                         onClick={() => setCheckedItems({})}
                       >
                         Réinitialiser
                       </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Quick Link */}
      <div className="flex justify-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
          MRP Engine Active // Automatic Procurement Logic v1.2
        </p>
      </div>

    </div>
  );
}
