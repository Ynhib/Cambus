import React, { useState } from 'react';
import { ChefHat, Search, Plus, Filter, CookingPot, ChevronDown, ChevronUp, PieChart as PieIcon } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Recipe } from '../db/db';
import RecipeCostCard from '../features/recipes/components/RecipeCostCard';

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Toutes');

  const recipes = useLiveQuery(
    () => db.recipes.toArray(),
    []
  ) || [];

  const categories = ['Toutes', ...new Set(recipes.map(r => r.category))];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'Toutes' || r.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-orange-500/20 rounded-xl">
              <ChefHat className="w-8 h-8 text-orange-500" />
            </span>
            Fiches Recettes
          </h1>
          <p className="text-inox-muted text-sm font-medium mt-1">Gérez vos productions et vos marges analytiques</p>
        </div>
        <button className="p-4 bg-orange-500 text-inox-900 rounded-2xl shadow-inox-glow active:scale-95 transition-transform flex items-center gap-2 font-black text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5 stroke-[3]" />
          <span className="hidden sm:inline">Nouvelle Recette</span>
        </button>
      </header>

       {/* Filtres & Recherche */}
       <div className="space-y-4">
         <div className="relative group">
            <Search className="absolute left-4 top-4 w-5 h-5 text-inox-muted group-focus-within:text-orange-400 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une recette (Baguette, Croissant...)" 
              className="w-full bg-inox-800 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-5 py-2 text-xs font-black border transition-all whitespace-nowrap min-h-[40px] uppercase tracking-widest
                ${activeCategory === cat ? 'bg-orange-500 border-orange-500 text-inox-900 shadow-inox-glow-sm' : 'bg-inox-800 border-slate-700 text-inox-muted hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
       </div>

      {/* Grid de Recettes */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <div key={recipe.id} className="space-y-4">
              <button 
                onClick={() => setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id!)}
                className={`w-full p-6 bg-inox-800 border-2 rounded-[32px] transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-inox-700/50
                  ${expandedRecipeId === recipe.id ? 'border-orange-500 bg-inox-900/50 shadow-inox' : 'border-slate-700/50'}`}
              >
                 <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-lg
                      ${expandedRecipeId === recipe.id ? 'bg-orange-500 text-inox-950' : 'bg-slate-800 text-orange-500 group-hover:bg-orange-500/10'}`}>
                      <CookingPot className="w-8 h-8" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">{recipe.category}</p>
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">{recipe.name}</h2>
                       <p className="text-xs text-inox-muted font-bold">Rendement : {recipe.yield} unité(s)</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-inox-900/50 rounded-xl border border-white/5">
                       <PieIcon className="w-4 h-4 text-action-light" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Analyse Marge</span>
                    </div>
                    {expandedRecipeId === recipe.id ? <ChevronUp className="w-6 h-6 text-orange-500" /> : <ChevronDown className="w-6 h-6 text-inox-muted" />}
                 </div>
              </button>

              {/* Analyse de Coût Déroulante */}
              {expandedRecipeId === recipe.id && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <RecipeCostCard recipe={recipe} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 border-2 border-dashed border-slate-700 rounded-[40px] flex flex-col items-center justify-center text-center gap-4 bg-slate-900/40">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
               <Filter className="w-8 h-8 text-inox-muted" />
            </div>
            <div>
              <p className="text-white font-black text-lg uppercase">Aucune recette trouvée</p>
              <p className="text-inox-muted text-xs font-medium max-w-xs mx-auto">Utilisez le bouton "Seed Analytique" dans les paramètres pour injecter des exemples de démonstration.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
          Analytic Cost Engine v5.0 // Advanced Margin Control
        </p>
      </div>
      
    </div>
  );
}

