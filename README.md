# Minebox Craft

Minebox Craft est une application web interactive qui permet d'explorer des objets ("items") ainsi que leurs recettes associées présent sur le serveur Minecraft [Minebox](https://minebox.co/). L'interface offre la possibilité de rechercher un objet, d'ajuster le multiplicateur des quantités, d'afficher les ingrédients avec leur image, et d'étendre ou masquer les sous-recettes de chaque ingrédient. Le projet intègre également une gestion dynamique des paramètres d'URL afin de partager facilement l'état de l'interface.

## Fonctionnalités

- **Recherche & Sélection d'Items**  
  Parcourez la liste des objets via un champ de recherche et sélectionnez un item pour en visualiser les détails. Ce champ demande les ID des items.

- **Affichage Dynamique de Recettes**  
  Chaque objet peut contenir une recette avec plusieurs ingrédients. Pour chaque ingrédient, si une sous-recette existe, un bouton "Voir la recette" permet de l'afficher ou de la masquer.

- **Ajustement du Multiplicateur**  
  Un champ permet de modifier un multiplicateur qui actualise dynamiquement les quantités d'ingrédients affichées ainsi que le récapitulatif des ressources nécessaires.

- **Récapitulatif des Ressources**  
  Les ressources nécessaires pour réaliser l'objet sont affichées dans deux colonnes :
  - **À craft** : les items craftables (hors FARMER).
  - **Ressources de base** : les autres ingrédients ou les items de type FARMER.

- **Contrôle via l'URL**  
  Les paramètres comme l'ID de l'item, le multiplicateur, l'état d'expansion des recettes, ou l'affichage du récapitulatif sont gérés dans l'URL, facilitant le partage et la synchronisation de l'interface.

## Installation

1. **Cloner le dépôt**  
   ```bash
   git clone https://github.com/votre-utilisateur/minebox-craft.git
   ```

2. **Placer les fichiers dans un serveur web local**  
   Vous pouvez utiliser un serveur local (par exemple, Wampserver ou une solution similaire) pour ouvrir le fichier `index.html` et tester l'application.

3. **Structure du projet**  
   - `index.html` : Le fichier HTML principal de l'application, avec le CSS.
   - `script.js` : Le fichier JavaScript qui gère la logique et l'interactivité (affichage des items, recettes, mise à jour de l'URL, etc.).
   - `items.json` : Le fichier JSON contenant les données des différents objets et leurs recettes.
   - `./img/` : Le répertoire contenant les images par défaut des objets.

## Utilisation

1. **Lancer l'application**  
   Ouvrez le fichier `index.html` dans votre navigateur (préférablement via un serveur local).

2. **Rechercher et sélectionner un objet**  
   Utilisez le champ de recherche pour filtrer la liste des items dans le menu déroulant. Sélectionnez un objet pour afficher ses détails.

3. **Ajuster le multiplicateur**  
   Modifiez la valeur du multiplicateur pour ajuster automatiquement les quantités dans les recettes et mettre à jour le récapitulatif des ressources.

4. **Afficher/Masquer les sous-recettes**  
   Cliquez sur les boutons "Voir la recette" pour afficher ou masquer les sous-recettes de chaque ingrédient.  
   Vous pouvez aussi utiliser les boutons globaux pour étendre ou masquer toutes les recettes (hors ou incluant les recettes FARMER).

5. **Mise à jour de l'URL**  
   Les actions effectuées (sélection, multiplicateur, expansion des recettes, etc.) se reflètent dans l'URL, permettant ainsi de partager l'état courant de l'interface.

## Contribution

Les contributions sont les bienvenues surtout si vous comprennez pourquoi il y a une erreur de multiplication !
Si vous souhaitez améliorer l'application, veuillez suivre ces étapes :

1. Forker le dépôt.
2. Créer une branche pour vos modifications (`git checkout -b feature/ma-nouvelle-fonctionnalité`).
3. Faire vos modifications et les commit (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`).
4. Pousser la branche (`git push origin feature/ma-nouvelle-fonctionnalité`).
5. Créer une Pull Request.

## Licence

Ce projet est sous licence [MIT](LICENSE).

## Informations complémentaires

- Ce projet a été réalisé avec l'aide de l'IA o3-mini d'Open IA pour ce qui est du code.
- Le fichier `items.json` est une copie en date du 14 septembre 2025 du fichier présent à l'url suivant : [https://cdn2.minebox.co/data/items.json](https://cdn2.minebox.co/data/items.json).
- Les images présentes viennent de pack de texture diverse ou d'Internet hormis l'`enchanted_sweet_berries.png` qui est une création personnelle d'après le modèle de base.
