import { X, History, BarChart3, Package, Calendar, Tag, Info, Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CatalogItem, type Batch } from '../../../db/db';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useLabelPrinter } from '../hooks/useLabelPrinter';
import TraceabilityLabel from './TraceabilityLabel';

interface Props {
  product: CatalogItem;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'LOTS' | 'PRIX';

export default function StockDetailPanel({ product, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('LOTS');
  const { printLabel, printData } = useLabelPrinter();

  // Récupérer tous les lots pour ce produit
  const allBatches = useLiveQuery(
    () => db.batches.where('productId').equals(product.id || 0).sortBy('purchaseDate'),
    [product.id]
  ) || [];

  const activeBatches = allBatches.filter(b => b.currentQuantity > 0);
  
  // Données pour le graphique de prix
  const priceData = allBatches.map(b => ({
    date: new Date(b.purchaseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    prix: b.unitPriceHT,
    lot: b.lotNumber
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="relative w-full max-w-lg bg-inox-900 border-l border-slate-700 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col h-full">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-inox-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-action-DEFAULT/10 rounded-2xl">
                 <Package className="w-6 h-6 text-action-light" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">{product.name}</h2>
                 <p className="text-xs text-inox-muted font-bold uppercase tracking-widest">{product.category} • Unité : {product.unit}</p>
               </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-inox-700 rounded-full text-inox-muted transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-inox-900 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('LOTS')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LOTS' ? 'bg-inox-800 text-white shadow-sm border border-slate-700' : 'text-inox-muted hover:text-inox-text'}`}
            >
              <History className="w-4 h-4" />
              Lots Actifs
            </button>
            <button 
              onClick={() => setActiveTab('PRIX')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PRIX' ? 'bg-inox-800 text-white shadow-sm border border-slate-700' : 'text-inox-muted hover:text-inox-text'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Analyse Coûts
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {activeTab === 'LOTS' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Traçabilité & Hygiène</h3>
                <span className="text-[10px] font-bold text-inox-muted uppercase px-2 py-1 bg-inox-800 rounded-md border border-slate-700">
                  {activeBatches.length} lots en stock
                </span>
              </div>

              {activeBatches.length > 0 ? (
                activeBatches.map(batch => (
                  <div key={batch.id} className="p-4 bg-inox-800 border-l-4 border-l-action-DEFAULT border border-slate-700 rounded-xl space-y-3 group hover:border-slate-500 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-inox-muted uppercase tracking-tighter mb-1">Lot N°</p>
                        <p className="text-lg font-black text-white">{batch.lotNumber}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => printLabel(batch.id!)}
                          className="p-2 bg-inox-950 border border-white/5 rounded-xl text-inox-muted hover:text-white hover:border-action-DEFAULT transition-all shadow-inner"
                          title="Imprimer l'étiquette de traçabilité"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <div className="text-right">
                          <p className="text-xs font-bold text-inox-muted uppercase tracking-tighter mb-1">Stock</p>
                          <p className="text-lg font-black text-white">{batch.currentQuantity} <span className="text-sm text-inox-muted font-bold">{product.unit}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-fefo-light shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold text-inox-muted uppercase">Expiration (DLC)</p>
                          <p className="text-xs font-bold text-white">{new Date(batch.expirationDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-profit-light shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold text-inox-muted uppercase">Prix Unitaire</p>
                          <p className="text-xs font-bold text-white">{batch.unitPriceHT.toFixed(2)}€ / {product.unit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-slate-700 rounded-3xl">
                   <Info className="w-12 h-12 text-inox-muted mb-4 opacity-30" />
                   <p className="text-inox-muted font-medium">Aucun lot actif pour ce produit.</p>
                   <p className="text-[10px] text-inox-muted mt-1 uppercase tracking-widest font-bold">Veuillez réceptionner un arrivage</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-64 w-full bg-inox-800/50 p-4 rounded-3xl border border-slate-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val}€`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', fontSize: '12px' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="prix" 
                      stroke="#22d3ee" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-inox-muted px-2">Historique des achats</h4>
                 <div className="overflow-hidden rounded-2xl border border-slate-700">
                   <table className="w-full text-left">
                     <thead className="bg-inox-800 border-b border-slate-700 text-[10px] font-black uppercase tracking-wider text-inox-muted">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Prix Unitaire</th>
                          <th className="px-4 py-3">Lot</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                        {allBatches.map(b => (
                          <tr key={b.id} className="text-xs font-medium hover:bg-inox-800/50 transition-colors">
                            <td className="px-4 py-3 text-inox-muted">{new Date(b.purchaseDate).toLocaleDateString('fr-FR')}</td>
                            <td className="px-4 py-3 text-white font-bold">{b.unitPriceHT.toFixed(2)}€</td>
                            <td className="px-4 py-3 text-inox-muted font-mono">{b.lotNumber}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div className="p-6 border-t border-slate-700 bg-inox-950">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-inox-800 hover:bg-inox-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl border border-slate-700 transition-all active:scale-[0.98]"
           >
             Fermer les détails
           </button>
        </div>

      </div>
      {/* Print Portal */}
      {printData && (
        <div className="hidden">
           <TraceabilityLabel batch={printData.batch} product={printData.product} />
        </div>
      )}
    </div>
  );
}
