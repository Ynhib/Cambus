# ⚓ Cambuse

> **The Local-First Command Center for Food Artisans.**

*Note: This is a passion project built during my free time to solve real-world problems for bakers, pastry chefs, and bar owners who deserve better tools than clunky, corporate ERPs.*

Food artisans don't have the time to navigate complex accounting software designed for office workers. They have their hands in the dough and need a tool that is as robust, fast, and reliable as their stainless steel workbenches. 

**Cambuse** is not an accounting app. It is a lab optimization engine focused on real margins, zero-waste, and forward-thinking production.

---

## 🛡️ Total Data Sovereignty (Zero Cloud)

Your craft is your industrial secret. Your margins are nobody's business but yours.
Cambuse is built on a strict **Local-First** architecture:
- **Zero Remote Servers:** All your data (recipes, prices, inventory) lives physically on your phone or tablet.
- **100% Offline Capable:** The app works flawlessly in a deep wine cellar or a walk-in fridge with zero Wi-Fi.
- **True Independence:** No abusive monthly SaaS subscriptions just to access your own data. You own your database.

---

## ⚙️ The 3 Core Pillars

### 1. The Stock Guardian (Native FEFO)
Stop invisible waste. The FEFO (*First Expired, First Out*) algorithm automatically deducts the oldest batches during sales or production.
- *Smart Alert:* "Chef, 3L of milk expires tomorrow. Suggestion: Bake a batch of flans."

### 2. The Cost Hunter (Energy Optimization)
In 2026, energy can cost more than raw materials. 
- Calculate the **True Baking Cost**: Cambuse divides the hourly cost of your oven by the exact number of items baked.
- *Profit Alert:* Stop running a 10kW deck oven to bake just 3 baguettes.

### 3. The Strategic Radar (Weather & Traffic)
The dashboard cross-references 15-day weather forecasts and local roadworks (Open Data) to adjust daily production.
- *Rain expected:* Ramp up soup and hot beverage production.
- *Heatwave:* Push cold drinks and salads to the front display.

---

## 🛠️ Technical Stack (Under the Hood)

The architecture is modern, lightweight, and specifically tailored for mobile-first, offline environments:

- **Core Engine:** `React` + `Vite` 
  *Why? Instant HMR, lightning-fast builds, and perfect for Single Page Applications (SPA) that need to run without a server.*
- **Database:** `Dexie.js` (IndexedDB Wrapper)
  *Why? The ultimate local-first database. Handles complex querying (like FEFO batch sorting) directly in the browser/device.*
- **Styling:** `Tailwind CSS`
  *Why? Utility-first CSS allows for a custom "Industrial/Inox" UI design with large, touch-friendly targets and native Dark Mode support without bloat.*
- **Mobile Bridge:** `Capacitor`
  *Why? Seamlessly compiles the web codebase into native, performant Android and iOS applications with access to device hardware (Camera, Storage).*
- **Smart Parsing (Optional):** `Gemini API / Local OCR`
  *Why? Used strictly as a utility service to extract structured JSON data from photos of supplier invoices, eliminating manual data entry.*
---
# ⚓ Cambuse

> **Le poste de pilotage Local-First pour les artisans de bouche.**

Les artisans (boulangers, pâtissiers, patrons de bar) n'ont pas le temps d'utiliser des logiciels comptables complexes (ERP) conçus pour des bureaux. Ils ont les mains dans la farine et besoin d'un outil aussi robuste, rapide et fiable que leur plan de travail en inox.

**Cambuse** n'est pas un logiciel de comptabilité. C'est un moteur d'optimisation de laboratoire centré sur la marge réelle, le zéro-gaspillage et l'anticipation.

---

## 🛡️ Souveraineté Totale (Zéro Cloud)

Votre savoir-faire est votre secret industriel. Vos marges ne regardent que vous.
Cambuse est conçu sur une architecture **Local-First** :
- **Zéro serveur distant :** Toutes vos données (recettes, prix, stocks) restent physiquement dans votre téléphone ou tablette.
- **Fonctionnement hors-ligne :** L'application fonctionne parfaitement au fond d'une cave à vin ou dans un frigo sans réseau Wi-Fi.
- **Indépendance :** Pas d'abonnement mensuel abusif pour accéder à vos propres données. Vous êtes le seul propriétaire de votre base de données.

---

## ⚙️ Les 3 Piliers du Moteur

### 1. Le Gardien du Stock (FEFO Natif)
Fini le gaspillage invisible. L'algorithme FEFO (*First Expired, First Out*) déduit automatiquement les lots les plus anciens lors d'une vente ou d'une production. 
- *Alerte automatique :* "Chef, 3L de lait expirent demain. Suggestion : Lancez une fournée de flans."

### 2. Le Chasseur de Coûts (Optimisation Énergie)
En 2026, l'énergie coûte parfois plus cher que la matière première.
- Calculez le **Coût de Cuisson** : Cambuse divise le coût horaire de votre four par le nombre de pièces cuites.
- *Alerte rentabilité :* Ne lancez plus un four à sole de 10kW pour cuire seulement 3 baguettes.

### 3. Le Radar Stratégique (Météo & Flux)
Le tableau de bord croise les prévisions météo à 15 jours et les travaux de voirie (Open Data) pour ajuster la production.
- *Pluie annoncée :* Augmentez la production de soupes et de boissons chaudes.
- *Canicule :* Poussez la vitrine sur les boissons fraîches et salades.

---

## 🛠️ Stack Technique (Pour les Développeurs)

Une architecture moderne, légère et taillée pour le mobile :
- **Frontend :** React + Vite (Vitesse d'exécution instantanée)
- **Styling :** Tailwind CSS (Interface UI "Inox", gros boutons tactiles, Dark Mode natif)
- **Database :** Dexie.js / IndexedDB (Persistance locale ultra-rapide)
- **Mobile Native :** Capacitor (Pour compiler en app Android & iOS fluides)
- **Smart Parsing :** Intégration optionnelle d'OCR pour la saisie rapide des factures fournisseurs.

---
---

## 🚀 Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/cambuse.git](https://github.com/your-username/cambuse.git)
   cd cambuse

2. **Install dependencies:**
   ```bash
   npm install    
    ```
3. **Run the development server:**
    ```bash
    npm run dev
    ```

4. **Build for Mobile (Capacitor):**
   ```bash
  npm run build
  npx cap sync
  npx cap open android
    ```  
5. **Open in browser:**
    Navigate to `http://localhost:5173` to see the app in action. You can test the offline capabilities by disabling your network connection. 