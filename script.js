/*
 * Minebox Private Project
 * Copyright (c) 2025 LupusArctos4 
 * SPDX-License-Identifier: MIT
*/

"use strict";
document.addEventListener("DOMContentLoaded", () => {
  // Récupération des éléments du DOM
  const selectElement      = document.getElementById("item-select");
  const searchInput        = document.getElementById("item-search");
  const multiplierInput    = document.getElementById("multiplier");
  const container          = document.getElementById("item-container");
  const toggleResourcesBtn = document.getElementById("toggle-resources-btn");
  const resourcesBox       = document.getElementById("resources-box");
  let items = [];
  let farmerModeExpanded = false;
  let resourcesVisible   = false; // pour l'affichage du récapitulatif

  /**
   * Met à jour un paramètre donné dans l'URL sans recharger la page.
   *
   * @param {string} param - Le nom du paramètre à mettre à jour.
   * @param {string|boolean} value - La nouvelle valeur du paramètre.
   */
  function updateURLParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.replaceState({}, '', url);
  }

  /**
   * Retourne l'URL de l'image associée à un ingrédient.
   * Cherche dans la liste des items et, s'il trouve une image codée en base64,
   * la retourne ; sinon, il retourne le chemin par défaut.
   *
   * @param {string} ingredientId - L'identifiant de l'ingrédient.
   * @returns {string} - L'URL de l'image.
   */
  function getIngredientImage(ingredientId) {
    const ingredientData = items.find(item => item.id === ingredientId);
    if (ingredientData && ingredientData.image) {
      return `data:image/png;base64,${ingredientData.image}`;
    }
    return `./img/item-vanilla/${ingredientId}.png`;
  }

  /**
   * Récupère et valide la valeur du multiplicateur.
   *
   * @returns {number} - La valeur numérique du multiplicateur (par défaut 1).
   */
  function getMultiplier() {
    const value = parseFloat(multiplierInput.value);
    return isNaN(value) ? 1 : value;
  }
  
  /**
   * Génère le code HTML pour afficher une image.
   *
   * @param {string} src - L'URL de l'image.
   * @param {string} altText - Le texte alternatif en cas d'erreur ou pour l'accessibilité.
   * @returns {string} - La balise HTML img.
   */
  function renderImage(src, altText) {
    return `<img src="${src}" alt="${altText}" width="150" height="150" 
            onerror="this.onerror=null;this.src='./img/item-vanilla/ruby.png';">`;
  }

  /**
   * Génère le HTML permettant d'afficher la liste des ingrédients.
   * Pour chaque ingrédient, il affiche la quantité, l'image associée,
   * et éventuellement un bouton pour afficher la recette si disponible.
   *
   * @param {Array} ingredients - La liste des ingrédients de la recette.
   * @param {number} factor - Le facteur multiplicatif à appliquer aux quantités.
   * @returns {string} - Le code HTML correspondant à la liste des ingrédients.
   */
  function renderIngredients(ingredients, factor) {
    let html = "";
    ingredients.forEach(ingredient => {
      const ingredientObj = items.find(i => i.id === ingredient.id);
      const imgSrc        = getIngredientImage(ingredient.id);
      const hasSubRecipe  = ingredientObj && ingredientObj.recipe;
      const effectiveQty  = ingredient.amount * factor;
      html += `<li class="ingredient">
        <div class="ingredient-quantity">x${effectiveQty.toLocaleString()}</div>
        <div class="ingredient-details">
          ${ imgSrc ? renderImage(imgSrc, ingredient.id) : "" }
          <span>${ingredient.id}</span>
          ${
            hasSubRecipe 
              ? `<span>(${ingredientObj.recipe.job || "N/A"})</span>
                 <button data-job="${ingredientObj.recipe.job || ''}" 
                         data-ingredient-id="${ingredient.id}"
                         onclick="displaySubRecipe('${ingredient.id}', this, ${effectiveQty})">
                   Voir la recette
                 </button>`
              : ""
          }
        </div>
      </li>`;
    });
    return html;
  }

  /**
   * Génère le HTML complet d'une sous-recette pour un item donné.
   *
   * @param {Object} item - L'objet dont on veut afficher la recette.
   * @param {number} [factor=1] - Le facteur multiplicatif appliqué aux quantités.
   * @returns {string} - Le code HTML de la sous-recette ou une chaîne vide.
   */
  function renderRecipe(item, factor = 1) {
    if (!item.recipe || !item.recipe.ingredients) return "";
    return `<ul class="sub-recipe" data-ingredient-id="${item.id}">
      ${renderIngredients(item.recipe.ingredients, factor)}
    </ul>`;
  }

  /*  
      separateResourcesForBase():
      Pour chaque ingrédient DIRECT de l’item de base :
         - Si l’ingrédient possède une recette avec un tag de job non vide et que ce job n'est pas FARMER,
           on ajoute cet ingrédient dans la colonne craft ET on explore ses sous-recettes avec gatherSubResources().
         - Sinon, on l’ajoute dans raw.
  */
  function separateResourcesForBase(item, factor) {
    let result = { craft: {}, raw: {} };
    if (!item.recipe || !item.recipe.ingredients) return result;
    item.recipe.ingredients.forEach(ingredient => {
      const quantity = ingredient.amount * factor;
      const ingrItem = items.find(i => i.id === ingredient.id);
      if (ingrItem && ingrItem.recipe && ingrItem.recipe.job) {
        if (ingrItem.recipe.job.toUpperCase() === "FARMER") {
          // Les items FARMER sont ignorés dans craft et ajoutés en raw
          result.raw[ingredient.id] = (result.raw[ingredient.id] || 0) + quantity;
        } else {
          // Ajout direct de l'item craftable dans la catégorie craft
          result.craft[ingredient.id] = (result.craft[ingredient.id] || 0) + quantity;
          // Exploration récursive pour récupérer les sous-produits
          gatherSubResources(ingrItem, quantity, result);
        }
      } else {
        result.raw[ingredient.id] = (result.raw[ingredient.id] || 0) + quantity;
      }
    });
    return result;
  }

  /*  
      gatherSubResources():
      Explore récursivement la recette d’un ingrédient craftable (job ≠ FARMER).
      Pour chaque ingrédient rencontré :
         - Si l’ingrédient possède un tag de job non vide et différent de FARMER,
           on le collecte (soit par récursion s'il a des enfants, soit en craft final).
         - Sinon, il va dans raw.
  */
  function gatherSubResources(item, factor, result) {
    if (!item.recipe || !item.recipe.ingredients) return;
    item.recipe.ingredients.forEach(ingredient => {
      const quantity = ingredient.amount * factor;
      const ingrItem = items.find(i => i.id === ingredient.id);
      if (ingrItem && ingrItem.recipe && ingrItem.recipe.job) {
        if (ingrItem.recipe.job.toUpperCase() === "FARMER") {
          // Ajoute les items de type FARMER dans raw
          result.raw[ingredient.id] = (result.raw[ingredient.id] || 0) + quantity;
        } else {
          // Ajoute tous les autres items craftables (non FARMER) dans craft
          result.craft[ingredient.id] = (result.craft[ingredient.id] || 0) + quantity;
          // Poursuite de la récursion pour cumuler tous les items craft à faire
          gatherSubResources(ingrItem, quantity, result);
        }
      } else {
        result.raw[ingredient.id] = (result.raw[ingredient.id] || 0) + quantity;
      }
    });
  }

  /*  
      updateResourceSummary():
      - Fait appel à separateResourcesForBase() pour obtenir la répartition.
      - Trie les clés alphabétiquement et formate les quantités avec toLocaleString().
      - Affiche deux colonnes : 
            Colonne gauche "À craft" affiche tous les items craftables (directs et issus de la récursion) EXCLUANT les items FARMER.
            Colonne droite "Ressources de base" affiche le reste.
  */
  function updateResourceSummary(item) {
    if (!resourcesBox) return;
    if (!item) {
      resourcesBox.innerHTML = "";
      return;
    }
    const multiplier = getMultiplier();
    const resourcesSeparated = separateResourcesForBase(item, multiplier);
    
    if (Object.keys(resourcesSeparated.craft).length === 0 &&
        Object.keys(resourcesSeparated.raw).length === 0) {
      resourcesBox.innerHTML = "<p>Aucune ressource nécessaire pour ce craft.</p>";
      return;
    }
    
    let craftHtml = "<h3>À craft :</h3><ul>";
    const sortedCraftKeys = Object.keys(resourcesSeparated.craft).sort((a, b) => a.localeCompare(b));
    sortedCraftKeys.forEach(resId => {
      const quantity = resourcesSeparated.craft[resId];
      const formattedQty = quantity.toLocaleString();
      const imgSrc   = getIngredientImage(resId);
      craftHtml += `<li style="display: flex; align-items: center;">
                      <span style="width:150px;text-align:right;font-weight:bold;">x${formattedQty}</span>
                      <img src="${imgSrc}" alt="${resId}" width="30" height="30" style="margin:0 10px;">
                      <span>${resId}</span>
                    </li>`;
    });
    craftHtml += "</ul>";

    let rawHtml = "<h3>Ressources de base :</h3><ul>";
    const sortedRawKeys = Object.keys(resourcesSeparated.raw).sort((a, b) => a.localeCompare(b));
    sortedRawKeys.forEach(resId => {
      const quantity = resourcesSeparated.raw[resId];
      const formattedQty = quantity.toLocaleString();
      const imgSrc   = getIngredientImage(resId);
      rawHtml += `<li style="display: flex; align-items: center;">
                    <span style="width:150px;text-align:right;font-weight:bold;">x${formattedQty}</span>
                    <img src="${imgSrc}" alt="${resId}" width="30" height="30" style="margin:0 10px;">
                    <span>${resId}</span>
                  </li>`;
    });
    rawHtml += "</ul>";

    resourcesBox.innerHTML = `
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">${craftHtml}</div>
        <div style="flex: 1;">${rawHtml}</div>
      </div>
    `;
  }

  /**
   * Affiche les détails d'un objet (item) dans le conteneur principal.
   * 
   * Fonctionnement :
   *   - Si aucun item n'est fourni, affiche un message invitant à sélectionner un objet
   *     et réinitialise le récapitulatif des ressources.
   *   - Récupère la valeur du multiplicateur et l'image associée (en base64 ou par défaut).
   *   - Affiche les informations de l'item (ID, rareté, niveau, catégorie, statistiques) et sa recette.
   *   - Met ensuite à jour le récapitulatif des ressources nécessaires.
   * 
   * @param {Object|null} item - L'objet à afficher. S'il est nul, un message est affiché.
   */
  function displayItem(item) {
    if (!item) {
      container.innerHTML = `<p>Veuillez sélectionner un objet.</p>`;
      updateResourceSummary(null);
      return;
    }
    const baseFactor = getMultiplier();
    const imageSrc   = item.image 
                         ? `data:image/png;base64,${item.image}` 
                         : `./img/item-vanilla/${item.id}.png`;
    const ingredientsHTML =
      (item.recipe && item.recipe.ingredients)
        ? renderIngredients(item.recipe.ingredients, baseFactor)
        : `<li>Aucune recette</li>`;

    container.innerHTML = `
      <h2>Objet : ${item.id}</h2>
      <p><strong>Rareté :</strong> ${item.rarity}</p>
      <p><strong>Niveau :</strong> ${item.level}</p>
      <p><strong>Catégorie :</strong> ${item.category}</p>
      ${ imageSrc ? renderImage(imageSrc, item.id) : "" }
      <h3>Statistiques :</h3>
      <ul>
        ${
          item.stats
            ? Object.entries(item.stats)
                .map(([key, value]) => `<li>${key} : ${value.join(" à ")}</li>`)
                .join("")
            : "<li>Aucune statistique disponible</li>"
        }
      </ul>
      <h3>Recette :</h3>
      <ul>
        ${ingredientsHTML}
      </ul>
    `;
    updateResourceSummary(item);
  }

  /**
   * Remplit la liste déroulante des items en fonction d'un filtre textuel.
   *
   * @param {string} [filterText=""] - Le texte servant à filtrer les résultats.
   */
  function populateSelect(filterText = "") {
    selectElement.innerHTML = `<option value="">-- Sélectionnez un objet --</option>`;
    items.forEach((item, index) => {
      if (item.id.toLowerCase().includes(filterText.toLowerCase())) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = item.id;
        selectElement.appendChild(option);
      }
    });
  }

  /**
   * Explore récursivement le conteneur des recettes et affiche celles qui sont masquées.
   * Pour chaque bouton "Voir la recette" dont le job n'est pas FARMER (selon includeFarmer),
   * déclenche displaySubRecipe().
   *
   * @param {HTMLElement} containerElement - Le conteneur contenant les recettes.
   * @param {boolean} [includeFarmer=false] - Détermine si les recettes FARMER doivent être traitées.
   */
  function recursiveExpand(containerElement, includeFarmer = false) {
    let changed = false;
    const buttons = Array.from(containerElement.querySelectorAll("button[data-job]"));
    buttons.forEach(button => {
      const job = button.getAttribute("data-job");
      if ((!includeFarmer && job === "FARMER") || button.textContent.trim() !== "Voir la recette") {
        return;
      }
      const liElement = button.closest("li.ingredient");
      if (!liElement) return;
      const qtyText = liElement.querySelector(".ingredient-quantity")?.textContent;
      if (!qtyText) return;
      const currentFactor = parseFloat(qtyText.replace("x", ""));
      displaySubRecipe(button.getAttribute("data-ingredient-id"), button, currentFactor);
      changed = true;
    });
    if (changed) {
      setTimeout(() => { recursiveExpand(containerElement, includeFarmer); }, 100);
    }
  }

  /**
   * Parcourt le conteneur à la recherche des boutons liés aux recettes FARMER et
   * déclenche leur affichage via displaySubRecipe().
   *
   * @param {HTMLElement} containerElement - Le conteneur dans lequel chercher les recettes FARMER.
   */
  function recursiveExpandFarmerRecipes(containerElement) {
    let changed = false;
    const farmerButtons = Array.from(containerElement.querySelectorAll("button[data-job='FARMER']"))
                              .filter(btn => btn.textContent.trim() === "Voir la recette");
    farmerButtons.forEach(button => {
      const liElement = button.closest("li.ingredient");
      if (!liElement) return;
      const qtyText = liElement.querySelector(".ingredient-quantity")?.textContent;
      if (!qtyText) return;
      const currentFactor = parseFloat(qtyText.replace("x", ""));
      displaySubRecipe(button.getAttribute("data-ingredient-id"), button, currentFactor);
      changed = true;
    });
    if (changed) {
      setTimeout(() => { recursiveExpandFarmerRecipes(containerElement); }, 100);
    }
  }

  /**
   * Affiche toutes les recettes (hors FARMER) en appelant recursiveExpand().
   */
  function expandAllRecipesExcludingFarmer() {
    recursiveExpand(container, false);
  }

  /**
   * Affiche les recettes de type FARMER en appelant recursiveExpandFarmerRecipes().
   */
  function expandFarmerRecipes() {
    recursiveExpandFarmerRecipes(container);
  }
  
  /**
   * Masque les recettes FARMER affichées et remet à jour le texte des boutons correspondants.
   */
  function collapseFarmerRecipes() {
    container.querySelectorAll("button[data-job='FARMER']").forEach(button => {
      const liElement = button.closest("li.ingredient");
      const subRecipeElement = liElement.nextElementSibling;
      if (subRecipeElement && subRecipeElement.classList.contains("sub-recipe")) {
        subRecipeElement.style.display = "none";
        button.textContent = "Voir la recette";
      }
    });
  }
  
  /**
   * Masque toutes les sous-recettes affichées et réinitialise le texte de tous les boutons d'affichage.
   */
  function collapseAllRecipesIncludingFarmer() {
    container.querySelectorAll("ul.sub-recipe").forEach(ul => { ul.style.display = "none"; });
    container.querySelectorAll("button[data-ingredient-id]").forEach(button => { button.textContent = "Voir la recette"; });
  }

  // Gestion des paramètres d'affichage via l'URL
  const params = new URLSearchParams(window.location.search);
  const showResourcesParam = params.get("showResources");
  if (showResourcesParam && showResourcesParam.toLowerCase() === "true") {
    resourcesVisible = true;
    resourcesBox.style.display = "block";
    toggleResourcesBtn.textContent = "Cacher le récapitulatif des ressources";
  }
  
  // Activation/désactivation de l'affichage du récapitulatif des ressources
  toggleResourcesBtn.addEventListener("click", () => {
    resourcesVisible = !resourcesVisible;
    if (resourcesVisible) {
      resourcesBox.style.display = "block";
      toggleResourcesBtn.textContent = "Cacher le récapitulatif des ressources";
    } else {
      resourcesBox.style.display = "none";
      toggleResourcesBtn.textContent = "Afficher le récapitulatif des ressources";
    }
    updateURLParam("showResources", resourcesVisible);
  });

  // Gestion de l'expansion globale des recettes hors FARMER
  const globalExpandBtn = document.getElementById("expand-all-btn");
  if (globalExpandBtn) {
    globalExpandBtn.addEventListener("click", () => {
      if (globalExpandBtn.textContent.trim() === "Étendre toutes les recettes (hors FARMER)") {
        expandAllRecipesExcludingFarmer();
        globalExpandBtn.textContent = "Cacher toutes les recettes";
        updateURLParam("expandAll", true);
      } else {
        collapseAllRecipesIncludingFarmer();
        globalExpandBtn.textContent = "Étendre toutes les recettes (hors FARMER)";
        updateURLParam("expandAll", false);
        updateURLParam("expandAllFarmer", false);
      }
    });
  }
  
  // Gestion de l'affichage global des recettes FARMER
  const globalExpandFarmerBtn = document.getElementById("expand-all-farmer-btn");
  if (globalExpandFarmerBtn) {
    globalExpandFarmerBtn.addEventListener("click", () => {
      if (!farmerModeExpanded) {
        expandFarmerRecipes();
        farmerModeExpanded = true;
        globalExpandFarmerBtn.textContent = "Cacher les recettes FARMER";
        updateURLParam("expandAllFarmer", true);
      } else {
        collapseFarmerRecipes();
        farmerModeExpanded = false;
        globalExpandFarmerBtn.textContent = "Étendre les recettes FARMER";
        updateURLParam("expandAllFarmer", false);
      }
    });
  }

  // Chargement des données JSON et initialisation de l'interface
  fetch("items.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du fichier JSON");
      }
      return response.json();
    })
    .then(data => {
      items = data;
      populateSelect();
      displayItem(null);
      const idParam = params.get("id");
      const multiplierParam = params.get("multiplier");
      if (multiplierParam && !isNaN(parseFloat(multiplierParam))) {
        multiplierInput.value = parseFloat(multiplierParam);
      }
      if (idParam) {
        const index = items.findIndex(item => item.id === idParam);
        if (index !== -1) {
          selectElement.value = index;
          displayItem(items[index]);
        } else {
          console.warn("Aucun item trouvé avec l'id :", idParam);
        }
      }
      
      const paramsAfter = new URLSearchParams(window.location.search);
      if (paramsAfter.get("expandAll") && paramsAfter.get("expandAll").toLowerCase() === "true") {
        expandAllRecipesExcludingFarmer();
        globalExpandBtn.textContent = "Cacher toutes les recettes";
      }
      if (paramsAfter.get("expandAllFarmer") && paramsAfter.get("expandAllFarmer").toLowerCase() === "true") {
        globalExpandFarmerBtn.disabled = false;
        expandFarmerRecipes();
        farmerModeExpanded = true;
        globalExpandFarmerBtn.textContent = "Cacher les recettes FARMER";
      }
    })
    .catch(error => {
      console.error("Erreur :", error);
      container.innerHTML = `<p>Erreur lors du chargement des données.</p>`;
    });

  // Mise à jour de la liste des items lors de la saisie dans le champ de recherche
  searchInput.addEventListener("input", e => {
    populateSelect(e.target.value);
  });

  // Lorsque l'utilisateur change l'item dans le select, afficher l'objet et mettre à jour l'URL
  selectElement.addEventListener("change", e => {
    const index = e.target.value;
    if (index !== "") {
      // Affiche l'item sélectionné
      displayItem(items[index]);

      // Met à jour l'URL avec l'id de l'item et le multiplicateur actuel
      updateURLParam("id", items[index].id);
      updateURLParam("multiplier", multiplierInput.value);
    } else {
      displayItem(null);
      updateURLParam("id", ""); // Effacer le paramètre id si aucun item n'est sélectionné
    }
  });

  // Lors de la modification du multiplicateur, met à jour l'URL et rafraîchit l'affichage de l'objet sélectionné
  multiplierInput.addEventListener("input", () => {
    const index = selectElement.value;
    // Met à jour immédiatement l'URL avec le nouveau multiplicateur
    updateURLParam("multiplier", multiplierInput.value);
    
    if (index !== "") {
      // Si un item est sélectionné, on met à jour son affichage avec le bon multiplicateur et ses sous-recettes éventuelles
      const openSubRecipes = [];
      container.querySelectorAll("ul.sub-recipe[data-ingredient-id]").forEach(ul => {
        openSubRecipes.push(ul.getAttribute("data-ingredient-id"));
      });
      displayItem(items[index]);
      openSubRecipes.forEach(id => {
        const button = container.querySelector(`button[data-ingredient-id="${id}"]`);
        if (button) {
          const parentLi = button.closest("li");
          const qtyText = parentLi.querySelector(".ingredient-quantity")?.textContent;
          if (qtyText) {
            const currentFactor = parseFloat(qtyText.replace("x", ""));
            displaySubRecipe(id, button, currentFactor);
          }
        }
      });
    }
  });

  /**
   * Affiche ou masque la sous-recette d'un ingrédient lorsque l'utilisateur clique sur le bouton correspondant.
   * 
   * Fonctionnement :
   *   - Si la sous-recette est déjà affichée, elle est masquée et le texte du bouton est mis à jour.
   *   - Si elle n'est pas affichée, le code HTML de la sous-recette est généré via renderRecipe() et inséré après l'élément de l'ingrédient.
   *   - En cas d'absence de recette, un message d'alerte est affiché.
   *
   * @param {string} ingredientId - L'identifiant de l'ingrédient dont on souhaite afficher la recette.
   * @param {HTMLElement} buttonElement - Le bouton qui a déclenché l'action.
   * @param {number} cumulativeFactor - Le facteur multiplicatif cumulé à appliquer à la recette.
   */
  window.displaySubRecipe = function(ingredientId, buttonElement, cumulativeFactor) {
    const liElement = buttonElement.parentElement.parentElement;
    let subRecipeElement = liElement.nextElementSibling;
    if (subRecipeElement && subRecipeElement.classList.contains("sub-recipe")) {
      if (subRecipeElement.style.display === "none") {
        subRecipeElement.style.display = "block";
        buttonElement.textContent = "Cacher la recette";
      } else {
        subRecipeElement.style.display = "none";
        buttonElement.textContent = "Voir la recette";
      }
      return;
    }
    const ingredientData = items.find(item => item.id === ingredientId);
    if (ingredientData && ingredientData.recipe) {
      liElement.insertAdjacentHTML("afterend", renderRecipe(ingredientData, cumulativeFactor));
      buttonElement.textContent = "Cacher la recette";
    } else {
      alert("Aucune recette disponible pour cet ingrédient.");
    }
  };
});
