import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Recipe, type ProductionStep } from '../../../db/db';
import { getHolidays, isHoliday } from '../../planning/services/holidayService';
import { loadShopInfo } from '../../impact/services/impactLogic';
import { 
  TrendingUp, Users, Zap, ShoppingBasket, Calculator, 
  Wand2, AlertTriangle, CheckCircle2, Info, 
  Minus, Plus, ListChecks, Flame, Timer, 
  ChevronRight, UtensilsCrossed, History, ShieldCheck, Heart, Clock,
  ChefHat, BarChart3
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

    const multiplier = targetQuantity / recipe.yield;

    // 1. CALCUL DES MATIÈRES (TOUJOURS VARIABLES)
    let foodCostTarget = 0;
    let baseFoodCost = 0;
    let totalWeight = 0;
    let totalFatGrams = 0;
    const allergensSet = new Set<string>();

    const ingredientList = (recipe.ingredients || []).map(ri => {
      const item = catalog.find(c => c.id === ri.ingredientId);
      const lastBatch = batches
        .filter(b => b.productId === ri.ingredientId)
        .sort((a, b) => b.purchaseDate - a.purchaseDate)[0];
      
      const price = lastBatch?.unitPriceHT || 0;
      baseFoodCost += ri.requiredQuantity * price;
      foodCostTarget += (ri.requiredQuantity * multiplier) * price;

      if (item?.allergens) {
        item.allergens.forEach(a => allergensSet.add(a));
      }

      const weightInGrams = (ri.requiredQuantity * multiplier) * 1000;
      totalWeight += weightInGrams;
      totalFatGrams += (weightInGrams * (item?.fatPer100 || 0)) / 100;

      return { 
        id: ri.ingredientId,
        name: item?.name || '?', 
        unit: item?.unit || '', 
        baseQty: ri.requiredQuantity 
      };
    });

    const averageFatPercent = totalWeight > 0 ? (totalFatGrams / totalWeight) * 100 : 0;
    const allergensList = Array.from(allergensSet);
    const isGlutenFree = !allergensList.includes('Gluten');

    // 2. CALCUL MAIN D'ŒUVRE & ÉNERGIE (SCALING LOGIC)
    let laborCostTarget = 0;
    let overheadCostTarget = 0;
    let baseLaborCost = 0;
    let baseOverheadCost = 0;

    (recipe.productionSteps || []).forEach(step => {
      const role = roles.find(r => r.id === step.activeRoleId);
      const eq = step.equipmentId ? equipment.find(e => e.id === step.equipmentId) : null;

      const scale = step.scalingType === 'VARIABLE' ? multiplier : 1;

      // Coût Cible (Target)
      laborCostTarget += ((step.activeTimeMinutes * scale) / 60) * (role?.hourlyCost || 0);
      if (eq) {
        const totalStepTime = (step.activeTimeMinutes + step.passiveTimeMinutes) * scale;
        overheadCostTarget += (totalStepTime / 60) * (eq.hourlyCost || 0);
      }

      // Coût de Base (yield) for comparison
      baseLaborCost += (step.activeTimeMinutes / 60) * (role?.hourlyCost || 0);
      if (eq) {
        const totalBaseTime = (step.activeTimeMinutes + step.passiveTimeMinutes);
        baseOverheadCost += (totalBaseTime / 60) * (eq.hourlyCost || 0);
      }
    });

    const totalCostHTTarget = foodCostTarget + laborCostTarget + overheadCostTarget;
    const unitCostHT = totalCostHTTarget / targetQuantity;

    const baseTotalCostHT = baseFoodCost + baseLaborCost + baseOverheadCost;
    const baseUnitCostHT = baseTotalCostHT / recipe.yield;

    const marginTarget = 0.70;
    const suggPriceTTC = (unitCostHT / (1 - marginTarget)) * (1 + (recipe.vatRate || 5.5) / 100);

    const priceHT = (suggPriceTTC / (1 + (recipe.vatRate || 5.5) / 100));
    const grossMarginEUR = priceHT - (foodCostTarget / targetQuantity);
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
      const histTotalHT = (histFoodCost + baseLaborCost + baseOverheadCost) / recipe.yield;
      priceHistory.push({ cost: parseFloat(histTotalHT.toFixed(2)) });
    }

    return { 
      foodCostTotal: foodCostTarget, 
      laborCostTotal: laborCostTarget, 
      overheadCostTotal: overheadCostTarget, 
      unitCostHT, 
      baseUnitCostHT,
      suggPriceTTC, 
      ingredientList, priceHistory, averageFatPercent, allergensList, isGlutenFree,
      grossMarginEUR, grossMarginPercent, netMarginEUR, netMarginPercent,
      roles, equipment
    };
  }, [recipe]);

  const handleMagicSuggestion = async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const events = await db.events.where('date').equals(todayStr).toArray();
    
    let multiplier = 1.0;
    let reason = "";

    // ── 1. RÉCUPÉRATION INFOS BOUTIQUE & JOURS FÉRIÉS ──
    const shopInfo = loadShopInfo();
    const zipCode = shopInfo?.street?.match(/\b(\d{5})\b/)?.[1] || '';
    const holidays = await getHolidays(now.getFullYear(), 'FR', zipCode);

    const checkDate = (d: Date) => isHoliday(d, holidays);

    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);

    const holidayToday = checkDate(now);
    const holidayTomorrow = checkDate(tomorrow);
    const holidayYesterday = checkDate(yesterday);

    // ── 2. LOGIQUE DE MULTIPLICATEUR (ORDRE DE PRIORITÉ) ──
    
    if (holidayToday) {
      multiplier = 0;
      reason = `🏮 FERMÉ (${holidayToday.name})`;
    } else if (holidayTomorrow) {
      multiplier = 1.4;
      reason = `🪄 +40% (Veille de ${holidayTomorrow.name})`;
    } else if (holidayYesterday) {
      multiplier = 0.85;
      reason = `🪄 -15% (Lendemain de ${holidayYesterday.name})`;
    } else if (events.length > 0) {
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

  const [isProcessing, setIsProcessing] = useState(false);

  if (!results) return <div className="h-96 bg-inox-800 animate-pulse rounded-[40px] border-2 border-slate-700" />;

  const { unitCostHT, baseUnitCostHT, suggPriceTTC, ingredientList, foodCostTotal, laborCostTotal, overheadCostTotal, priceHistory, averageFatPercent, allergensList, isGlutenFree, grossMarginEUR, grossMarginPercent, netMarginEUR, netMarginPercent, roles, equipment } = results;
  const market = MARKET_PRICES[recipe.category] || { min: 1.0, max: 1.5 };
  const prodMultiplier = targetQuantity / recipe.yield;

  // 1. CALCUL DES BENCHMARKS DE VOLUME
  const benchmarks = [50, 100, 250, 500].map(qty => {
    const mult = qty / recipe.yield;
    const foodAtYield = foodCostTotal / prodMultiplier;
    const foodSim = foodAtYield * mult;

    let labor = 0;
    let overhead = 0;
    (recipe.productionSteps || []).forEach(step => {
      const scale = step.scalingType === 'VARIABLE' ? mult : 1;
      const role = roles.find(r => r.id === step.activeRoleId);
      const eq = step.equipmentId ? equipment.find(e => e.id === step.equipmentId) : null;
      labor += ((step.activeTimeMinutes * scale) / 60) * (role?.hourlyCost || 0);
      if (eq) overhead += ((step.activeTimeMinutes + step.passiveTimeMinutes) * scale / 60) * (eq.hourlyCost || 0);
    });
    const unit = (foodSim + labor + overhead) / qty;
    return { qty, unit, savings: baseUnitCostHT - unit };
  });

  const handleProduce = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await db.transaction('rw', [db.batches, db.productionHistory], async () => {
        for (const ing of ingredientList) {
          const totalNeeded = ing.baseQty * prodMultiplier;
          let remainingToDeduct = totalNeeded;

          const batches = await db.batches
            .where('productId').equals(ing.id!)
            .toArray();
            
          const sortedBatches = batches
            .filter(b => b.currentQuantity > 0)
            .sort((a, b) => a.expirationDate - b.expirationDate);

          for (const batch of sortedBatches) {
            if (remainingToDeduct <= 0) break;
            const deduction = Math.min(batch.currentQuantity, remainingToDeduct);
            await db.batches.update(batch.id!, { 
              currentQuantity: Math.max(0, batch.currentQuantity - deduction) 
            });
            remainingToDeduct -= deduction;
          }
        }

        await db.productionHistory.add({
          recipeId: recipe.id!,
          recipeName: recipe.name,
          date: Date.now(),
          quantityProduced: targetQuantity,
          totalCostHT: foodCostTotal + laborCostTotal + overheadCostTotal,
          unitCostHT: unitCostHT,
          details: ingredientList.map(i => ({ 
            ingredientName: i.name, 
            quantityUsed: i.baseQty * prodMultiplier, 
            cost: 0 
          }))
        });
      });

      alert(`✅ Production de ${targetQuantity} ${recipe.name} lancée ! Stocks mis à jour.`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors du déstockage.");
    } finally {
      setIsProcessing(false);
    }
  };

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
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-inox-muted uppercase py-1 px-2 bg-inox-900 rounded border border-white/5">Unité HT</span>
                <span className="text-profit-light font-black text-xl">{unitCostHT.toFixed(2)}€</span>
              </div>
              {baseUnitCostHT - unitCostHT > 0.005 && (
                <div className="mt-1 flex items-center gap-1 animate-in slide-in-from-left duration-500">
                  <TrendingUp className="w-3 h-3 text-action-light rotate-180" />
                  <span className="text-[9px] font-black text-action-light uppercase italic tracking-wider">
                    📈 Économie d'échelle : -{(baseUnitCostHT - unitCostHT).toFixed(2)}€ / pce
                  </span>
                </div>
              )}
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <p className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Historique de Coût</p>
             <BarChart3 className="w-4 h-4 text-inox-muted" />
          </div>
          <div className="h-20 bg-inox-950/40 rounded-2xl p-2 border border-white/5">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                   <Line type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* --- BENCHMARKS DE VOLUME --- */}
        <div className="space-y-3">
           <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-action-light" />
              <p className="text-[9px] font-black text-inox-muted uppercase tracking-widest">Simulation de Rentabilité par Volume</p>
           </div>
           <div className="grid grid-cols-4 gap-2">
              {benchmarks.map(b => (
                <div key={b.qty} className={`p-3 rounded-xl border text-center transition-all ${targetQuantity >= b.qty ? 'bg-action-DEFAULT/10 border-action-DEFAULT/30 shadow-inner' : 'bg-inox-950/40 border-white/5 opacity-60'}`}>
                   <p className="text-[9px] font-bold text-inox-muted mb-1">{b.qty} pce</p>
                   <p className="text-sm font-black text-white leading-none">{b.unit.toFixed(2)}€</p>
                   {b.savings > 0.01 && (
                     <p className="text-[8px] font-bold text-profit-light mt-1 whitespace-nowrap">-{((b.savings / baseUnitCostHT) * 100).toFixed(0)}%</p>
                   )}
                </div>
              ))}
           </div>
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

        {/* Gamme de Fabrication (Timeline Professionnelle) */}
        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-inox-muted uppercase tracking-widest flex items-center gap-2">
             <Timer className="w-4 h-4 text-action-light" /> Gamme de Fabrication
           </h4>
           <div className="space-y-0 relative pl-4 border-l-2 border-slate-800 ml-2">
              {(recipe.productionSteps || []).map((step, idx) => {
                const eq = equipment?.find(e => e.id === step.equipmentId);
                const role = roles?.find(r => r.id === step.activeRoleId);
                
                return (
                  <div key={step.stepId || idx} className="relative py-4 group">
                     {/* Point de branchement sur la timeline */}
                     <div className="absolute -left-[25px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-inox-950 border-2 border-slate-700 group-hover:border-action-light transition-colors z-10" />
                     
                     <div className="flex flex-col gap-3 bg-inox-900/30 p-5 rounded-[24px] border border-white/5 hover:border-white/10 transition-all shadow-lg">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-inox-800 rounded-lg shadow-inner">
                                 {step.passiveTimeMinutes > step.activeTimeMinutes ? 
                                    <Flame className="w-4 h-4 text-orange-400" /> : 
                                    <Zap className="w-4 h-4 text-blue-400" />
                                 }
                              </div>
                              <div>
                                 <span className="text-[11px] font-black text-white uppercase tracking-tight block">{step.name}</span>
                                 {eq && (
                                    <span className="text-[9px] font-bold text-inox-muted uppercase flex items-center gap-1">
                                       <UtensilsCrossed className="w-3 h-3" /> {eq.name}
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-white">{step.activeTimeMinutes + step.passiveTimeMinutes} MIN</p>
                              {role && <p className="text-[8px] font-bold text-inox-muted uppercase">{role.name}</p>}
                           </div>
                        </div>

                        {/* Badges de Temps Dissociés */}
                        <div className="flex gap-2">
                           {step.activeTimeMinutes > 0 && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="text-[9px] font-black text-blue-400 uppercase">👨‍🍳 Actif : {step.activeTimeMinutes} min</span>
                             </div>
                           )}
                           {step.passiveTimeMinutes > 0 && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase">⏳ Attente : {step.passiveTimeMinutes} min</span>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                );
              })}
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
        <div className="flex-1 space-y-4 pt-6 limit-h border-t border-slate-800">
           <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black text-inox-muted uppercase tracking-widest flex items-center gap-2">
               <ListChecks className="w-4 h-4 text-profit-light" /> Liste de pesée ajustée
             </h4>
             <p className="text-[10px] font-bold text-zinc-500 italic">Total: {((ingredientList.reduce((acc, i) => acc + i.baseQty, 0)) * prodMultiplier).toFixed(2)} kg</p>
           </div>
 
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

           {/* BOUTON PRODUIRE */}
           <button
             onClick={handleProduce}
             disabled={isProcessing}
             className="w-full mt-4 h-20 bg-action-DEFAULT hover:bg-action-light disabled:opacity-50 text-inox-950 rounded-[28px] font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-inox-glow group active:scale-95 overflow-hidden relative"
           >
             <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
             <ChefHat className={`w-8 h-8 relative z-10 transition-transform duration-500 ${isProcessing ? 'animate-bounce' : 'group-hover:rotate-12'}`} />
             <span className="relative z-10">
               {isProcessing ? 'Déstockage...' : `Lancer la Production (${targetQuantity})`}
             </span>
           </button>
        </div>

      </div>

    </div>
  );
}
