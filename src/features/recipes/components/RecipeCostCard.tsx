import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Recipe, type RecipeStep } from '../../../db/db';
import { 
  TrendingUp, Users, Zap, ShoppingBasket, Calculator, 
  Wand2, AlertTriangle, CheckCircle2, Info, 
  Minus, Plus, ListChecks, Flame, Timer, 
  ChevronRight, UtensilsCrossed, History, ShieldCheck, Heart, Clock
} from 'lucide-react';

interface Props {
  recipe: Recipe;
}

const MARKET_PRICES: Record<string, { min: number, max: number }> = {
  "Boulangerie": { min: 1.00, max: 1.30 },
  "Viennoiserie": { min: 1.10, max: 1.60 },
  "Pâtisserie": { min: 3.50, max: 5.50 },
  "Snacking": { min: 4.50, max: 7.50 }
};

export default function RecipeCostCard({ recipe }: Props) {
  const [targetQuantity, setTargetQuantity] = useState(recipe.yield);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);

  const results = useLiveQuery(async () => {
    const catalog = await db.catalog.toArray();
    const batches = await db.batches.toArray();
    const roles = await db.laborRoles.toArray();
    const equipment = await db.equipment.toArray();

    // 1. CALCULS ACTUELS (DPA + NUTRITION + ALLERGÈNES)
    let foodCostTotal = 0;
    let totalWeight = 0;
    let totalFatGrams = 0;
    const allergensSet = new Set<string>();

    const ingredientList = (recipe.ingredients || []).map(ri => {
      const item = catalog.find(c => c.id === ri.ingredientId);
      const lastBatch = batches
        .filter(b => b.productId === ri.ingredientId)
        .sort((a, b) => b.purchaseDate - a.purchaseDate)[0];
      
      const price = lastBatch?.unitPriceHT || 0;
      const cost = ri.requiredQuantity * price;
      foodCostTotal += cost;

      // Agrégation Allergènes
      if (item?.allergens) {
        item.allergens.forEach(a => allergensSet.add(a));
      }

      // Calcul Matière Grasse (Pondéré par le poids)
      // On assume que requiredQuantity est en kg pour les calculs de poids
      const weightInGrams = ri.requiredQuantity * 1000;
      totalWeight += weightInGrams;
      totalFatGrams += (weightInGrams * (item?.fatPer100 || 0)) / 100;

      return { name: item?.name || '?', unit: item?.unit || '', baseQty: ri.requiredQuantity };
    });

    const averageFatPercent = totalWeight > 0 ? (totalFatGrams / totalWeight) * 100 : 0;
    const allergensList = Array.from(allergensSet);
    const isGlutenFree = !allergensList.includes('Gluten');

    let laborCostTotal = 0;
    (recipe.labor || []).forEach(rl => {
      const role = roles.find(r => r.id === rl.roleId);
      laborCostTotal += (rl.minutesSpent / 60) * (role?.hourlyCost || 0);
    });

    let overheadCostTotal = 0;
    (recipe.equipmentUsed || []).forEach(re => {
      const eq = equipment.find(e => e.id === re.equipmentId);
      overheadCostTotal += (re.minutesUsed / 60) * (eq?.hourlyCost || 0);
    });

    const totalCostHT = foodCostTotal + laborCostTotal + overheadCostTotal;
    const unitCostHT = totalCostHT / recipe.yield;
    const marginTarget = 0.70;
    const suggPriceTTC = (unitCostHT / (1 - marginTarget)) * (1 + (recipe.vatRate || 5.5) / 100);

    const priceHT = (suggPriceTTC / (1 + (recipe.vatRate || 5.5) / 100));
    const grossMarginEUR = priceHT - (foodCostTotal / recipe.yield);
    const grossMarginPercent = (grossMarginEUR / priceHT) * 100;
    const netMarginEUR = priceHT - unitCostHT;
    const netMarginPercent = (netMarginEUR / priceHT) * 100;

    // 2. CALCUL HISTORIQUE
    const priceHistory = [];
    const timestamps = Array.from({ length: 6 }, (_, i) => Date.now() - (5 - i) * 7 * 86400000);
    for (const ts of timestamps) {
      let histFoodCost = 0;
      for (const ri of (recipe.ingredients || [])) {
        const batchAtTs = batches
          .filter(b => b.productId === ri.ingredientId && b.purchaseDate <= ts)
          .sort((a, b) => b.purchaseDate - a.purchaseDate)[0] || 
          batches.filter(b => b.productId === ri.ingredientId).sort((a, b) => a.purchaseDate - b.purchaseDate)[0];
        histFoodCost += ri.requiredQuantity * (batchAtTs?.unitPriceHT || 0);
      }
      const histTotalHT = (histFoodCost + laborCostTotal + overheadCostTotal) / recipe.yield;
      priceHistory.push({ cost: parseFloat(histTotalHT.toFixed(2)) });
    }

    return { 
      foodCostTotal, laborCostTotal, overheadCostTotal, unitCostHT, suggPriceTTC, 
      ingredientList, priceHistory, averageFatPercent, allergensList, isGlutenFree,
      grossMarginEUR, grossMarginPercent, netMarginEUR, netMarginPercent
    };
  }, [recipe]);

  const handleMagicSuggestion = async () => {
    const today = new Date().toISOString().split('T')[0];
    const events = await db.events.where('date').equals(today).toArray();
    let multiplier = 1.0;
    let reason = "";

    if (events.length > 0) {
      multiplier = 1.4;
      reason = `🪄 +40% (${events[0].title})`;
    } else {
      const weathers = ['sun', 'rain', 'cloud'];
      const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
      if (randomWeather === 'rain') { multiplier = 0.8; reason = "🪄 -20% (Pluie)"; }
      else if (randomWeather === 'sun') { multiplier = 1.2; reason = "🪄 +20% (Soleil)"; }
    }

    setTargetQuantity(Math.round(recipe.yield * multiplier));
    setSuggestionNote(reason);
  };

  const adjustQty = (amount: number) => {
    setTargetQuantity(prev => Math.max(1, prev + amount));
    setSuggestionNote(null);
  };

  if (!results) return <div className="h-96 bg-inox-800 animate-pulse rounded-[40px] border-2 border-slate-700" />;

  const { unitCostHT, suggPriceTTC, ingredientList, foodCostTotal, laborCostTotal, overheadCostTotal, priceHistory, averageFatPercent, allergensList, isGlutenFree, grossMarginEUR, grossMarginPercent, netMarginEUR, netMarginPercent } = results;
  const market = MARKET_PRICES[recipe.category] || { min: 1.0, max: 1.5 };
  const prodMultiplier = targetQuantity / recipe.yield;

  const chartDataConfig = [
    { name: 'Matières', value: foodCostTotal, color: '#22d3ee' },
    { name: 'Travail', value: laborCostTotal, color: '#818cf8' },
    { name: 'Énergie', value: overheadCostTotal, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* COLONNE GAUCHE : FINANCE & NUTRITION */}
      <div className="bg-inox-800 border border-slate-700 rounded-[40px] p-8 space-y-8 flex flex-col relative shadow-2xl">
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Finance & Nutrition</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-inox-muted uppercase py-1 px-2 bg-inox-900 rounded border border-white/5">Unité HT</span>
              <span className="text-profit-light font-black text-xl">{unitCostHT.toFixed(2)}€</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
             {isGlutenFree && (
               <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3 text-green-400" />
                 <span className="text-[10px] font-black text-green-400 uppercase italic">Sans Gluten</span>
               </div>
             )}
             <div className="px-3 py-1 bg-inox-900 border border-slate-700 rounded-full flex items-center gap-2 shadow-sm">
                <Heart className="w-3 h-3 text-fefo-light" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{averageFatPercent.toFixed(1)}% MG</span>
             </div>
          </div>
        </header>

        {/* --- MARGES DÉTAILLÉES --- */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-inox-900/30 border border-white/5 rounded-2xl text-center space-y-1">
              <p className="text-[9px] font-black text-inox-muted uppercase tracking-widest">Marge Brute (Mat.)</p>
              <p className="text-xl font-black text-action-light">{grossMarginPercent.toFixed(1)}%</p>
              <p className="text-[10px] font-bold text-inox-muted italic">+{grossMarginEUR.toFixed(2)}€ / pce</p>
           </div>
           <div className="p-4 bg-inox-900/30 border border-white/5 rounded-2xl text-center space-y-1">
              <p className="text-[9px] font-black text-inox-muted uppercase tracking-widest">Marge Nette (Réelle)</p>
              <p className="text-xl font-black text-indigo-400">{netMarginPercent.toFixed(1)}%</p>
              <p className="text-[10px] font-bold text-inox-muted italic">+{netMarginEUR.toFixed(2)}€ / pce</p>
           </div>
        </div>

        {/* Courbe historique (Sparkline) */}
        <div className="h-24 bg-inox-950/40 rounded-2xl p-2 border border-white/5">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                 <Line type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
           </ResponsiveContainer>
        </div>

        {/* Prix Suggéré */}
        <div className="bg-inox-900/50 border border-white/5 rounded-[32px] p-8 text-center space-y-4">
           <p className="text-[10px] font-black text-inox-muted uppercase tracking-[0.2em]">Prix de vente conseillé (TTC)</p>
           <span className="text-6xl font-black text-white tracking-tighter block leading-none">{suggPriceTTC.toFixed(2)}€</span>
           <div className="pt-4 flex flex-wrap justify-center gap-2">
             {allergensList.map(a => (
               <span key={a} className="px-2 py-0.5 bg-slate-800 text-[9px] font-black text-inox-muted border border-white/5 rounded uppercase">Allergène: {a}</span>
             ))}
           </div>
        </div>

        {/* Conservation */}
        <div className="flex items-center justify-center gap-4 py-4 bg-inox-950/20 rounded-2xl border border-dashed border-slate-700">
           <Clock className="w-5 h-5 text-inox-muted" />
           <div className="text-left leading-none">
              <p className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Conservation optimale</p>
              <p className="text-lg font-black text-white uppercase">{recipe.shelfLife || "--"} HEURES</p>
           </div>
        </div>
      </div>

      {/* COLONNE DROITE : PRODUCTION & TIMELINE */}
      <div className="bg-inox-950 border border-slate-700/50 rounded-[40px] p-8 space-y-8 flex flex-col shadow-2xl relative">
        
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-action-DEFAULT/10 rounded-2xl">
               <Calculator className="w-6 h-6 text-action-light" />
             </div>
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Atelier Production</h3>
          </div>
          {/* BOUTON SUGGÉRER RE-POSITIONNÉ EN HAUT (TRÈS VISIBLE) */}
          <button 
            onClick={handleMagicSuggestion}
            className="flex items-center gap-2 px-5 py-2.5 bg-action-DEFAULT hover:bg-action-light text-inox-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-inox-glow active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            Suggérer
          </button>
        </header>

        {/* Contrôleur de Quantité */}
        <div className="bg-inox-800 rounded-[32px] p-8 border-2 border-slate-700/50 flex items-center justify-between gap-6">
            <button 
                onClick={() => adjustQty(-1)}
                className="w-16 h-16 bg-inox-900 rounded-2xl border-b-4 border-slate-950 flex items-center justify-center text-inox-muted hover:bg-inox-700 transition-all font-black text-2xl"
            >
                <Minus className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
                <p className="text-[10px] font-black text-inox-muted uppercase tracking-[0.2em] mb-2">Quantité à Produire</p>
                <span className="text-7xl font-black text-white tracking-tighter">{targetQuantity}</span>
                {suggestionNote && (
                   <p className="text-[10px] font-bold text-action-light mt-2 animate-bounce">{suggestionNote}</p>
                )}
            </div>
            <button 
                onClick={() => adjustQty(1)}
                className="w-16 h-16 bg-inox-900 rounded-2xl border-b-4 border-slate-950 flex items-center justify-center text-action-light hover:bg-inox-700 transition-all font-black text-2xl"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>

        {/* Timeline Technique */}
        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-inox-muted uppercase tracking-widest flex items-center gap-2">
             <Timer className="w-4 h-4 text-action-light" /> Chronologie de fabrication
           </h4>
           <div className="space-y-0.5 relative pl-4 border-l-2 border-slate-800">
              {(recipe.prepSteps || []).map((step, idx) => (
                <div key={idx} className="relative py-3">
                   <div className="absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700" />
                   <div className="flex items-center justify-between bg-inox-900/40 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                         {step.type === 'REST' ? <Flame className="w-4 h-4 text-orange-400 rotate-180" /> : <Zap className="w-4 h-4 text-action-light" />}
                         <span className="text-[11px] font-black text-white uppercase tracking-tight">{step.label}</span>
                      </div>
                      <span className="text-[11px] font-black text-inox-muted">{step.minutes} MIN</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Matériel & Cuisson */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-inox-900/40 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                 <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                 <span className="text-[9px] font-black text-inox-muted uppercase">Matériel</span>
              </div>
              <p className="text-[9px] font-bold text-white uppercase">{(recipe.utensils || []).join(', ')}</p>
           </div>
           <div className="p-4 bg-inox-900/40 rounded-2xl border border-white/5 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                 <Flame className="w-4 h-4 text-fefo-light" />
                 <span className="text-[9px] font-black text-inox-muted uppercase">Four</span>
              </div>
              <p className="text-[10px] font-black text-white">{recipe.bakingTemp || "--"}°C / {recipe.bakingTime || "--"} Min</p>
           </div>
        </div>

        {/* Liste de pesée */}
        <div className="flex-1 space-y-3 pt-6 border-t border-slate-800">
           <h4 className="text-[10px] font-black text-inox-muted uppercase tracking-widest flex items-center gap-2">
             <ListChecks className="w-4 h-4 text-profit-light" /> Liste de pesée ajustée
           </h4>
           <div className="space-y-2 max-h-48 overflow-y-auto pt-2 pr-2 custom-scrollbar">
              {ingredientList.map(ing => (
                <div key={ing.name} className="flex justify-between items-center p-3 bg-inox-900/50 rounded-xl border border-white/5 group hover:border-action-DEFAULT/30">
                  <span className="text-[10px] font-black text-inox-muted uppercase group-hover:text-white transition-colors">{ing.name}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">{(ing.baseQty * prodMultiplier).toFixed(3)}</span>
                    <span className="text-[9px] font-black text-inox-muted uppercase">{ing.unit}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>

      </div>

    </div>
  );
}
