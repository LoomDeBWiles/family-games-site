using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace BlockCraft
{
    public class CraftingUI : MonoBehaviour
    {
        [SerializeField] private GameObject craftingPanel;
        [SerializeField] private Transform recipeListParent;
        [SerializeField] private TextMeshProUGUI stationTitleText;

        private List<GameObject> _recipeButtons = new List<GameObject>();
        private CraftingStationType _currentStation;

        private void Start()
        {
            if (craftingPanel == null)
                CreateUI();
            Close();
        }

        private void CreateUI()
        {
            craftingPanel = new GameObject("CraftingPanel");
            craftingPanel.transform.SetParent(transform, false);

            var rt = craftingPanel.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(300, 400);
            rt.anchoredPosition = new Vector2(-200, 50);

            var bg = craftingPanel.AddComponent<Image>();
            bg.color = new Color(0.12f, 0.12f, 0.18f, 0.95f);

            var vlg = craftingPanel.AddComponent<VerticalLayoutGroup>();
            vlg.padding = new RectOffset(8, 8, 8, 8);
            vlg.spacing = 4;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            // Title
            var titleGO = new GameObject("Title");
            titleGO.transform.SetParent(craftingPanel.transform, false);
            stationTitleText = titleGO.AddComponent<TextMeshProUGUI>();
            stationTitleText.fontSize = 18;
            stationTitleText.fontStyle = FontStyles.Bold;
            stationTitleText.color = Color.white;
            stationTitleText.alignment = TextAlignmentOptions.Center;
            var titleLE = titleGO.AddComponent<LayoutElement>();
            titleLE.preferredHeight = 30;

            // Scroll view for recipes
            var scrollGO = new GameObject("ScrollView");
            scrollGO.transform.SetParent(craftingPanel.transform, false);
            var scrollRT = scrollGO.AddComponent<RectTransform>();
            var scrollLE = scrollGO.AddComponent<LayoutElement>();
            scrollLE.flexibleHeight = 1;

            var scrollRect = scrollGO.AddComponent<ScrollRect>();
            scrollRect.vertical = true;
            scrollRect.horizontal = false;

            var viewport = new GameObject("Viewport");
            viewport.transform.SetParent(scrollGO.transform, false);
            var viewportRT = viewport.AddComponent<RectTransform>();
            viewportRT.anchorMin = Vector2.zero;
            viewportRT.anchorMax = Vector2.one;
            viewportRT.sizeDelta = Vector2.zero;
            viewport.AddComponent<Image>().color = Color.clear;
            viewport.AddComponent<Mask>().showMaskGraphic = false;

            var content = new GameObject("Content");
            content.transform.SetParent(viewport.transform, false);
            var contentRT = content.AddComponent<RectTransform>();
            contentRT.anchorMin = new Vector2(0, 1);
            contentRT.anchorMax = new Vector2(1, 1);
            contentRT.pivot = new Vector2(0.5f, 1);
            contentRT.sizeDelta = new Vector2(0, 0);

            var contentVLG = content.AddComponent<VerticalLayoutGroup>();
            contentVLG.spacing = 2;
            contentVLG.childForceExpandWidth = true;
            contentVLG.childForceExpandHeight = false;
            contentVLG.padding = new RectOffset(4, 4, 4, 4);

            var contentCSF = content.AddComponent<ContentSizeFitter>();
            contentCSF.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            scrollRect.content = contentRT;
            scrollRect.viewport = viewportRT;

            recipeListParent = content.transform;
        }

        public void Open(CraftingStationType station)
        {
            _currentStation = station;
            craftingPanel.SetActive(true);

            string title = station switch
            {
                CraftingStationType.None => "Hand Crafting",
                CraftingStationType.Workbench => "Workbench",
                CraftingStationType.Furnace => "Furnace",
                _ => "Crafting"
            };
            if (stationTitleText != null)
                stationTitleText.text = title;

            RefreshRecipes();
        }

        public void Close()
        {
            if (craftingPanel != null)
                craftingPanel.SetActive(false);
        }

        public void RefreshRecipes()
        {
            // Clear existing buttons
            foreach (var btn in _recipeButtons)
                Destroy(btn);
            _recipeButtons.Clear();

            if (RecipeRegistry.Instance == null) return;

            var recipes = RecipeRegistry.Instance.GetRecipesForStation(_currentStation);

            foreach (var recipe in recipes)
            {
                CreateRecipeButton(recipe);
            }
        }

        private void CreateRecipeButton(CraftingRecipe recipe)
        {
            var btnGO = new GameObject($"Recipe_{recipe.recipeName}");
            btnGO.transform.SetParent(recipeListParent, false);

            var rt = btnGO.AddComponent<RectTransform>();
            var le = btnGO.AddComponent<LayoutElement>();
            le.preferredHeight = 40;

            bool canCraft = recipe.CanCraft(InventoryManager.Instance);

            var bg = btnGO.AddComponent<Image>();
            bg.color = canCraft ? new Color(0.2f, 0.35f, 0.2f, 0.9f) : new Color(0.35f, 0.2f, 0.2f, 0.6f);

            var btn = btnGO.AddComponent<Button>();
            btn.interactable = canCraft;

            var capturedRecipe = recipe;
            btn.onClick.AddListener(() =>
            {
                CraftingManager.Instance?.TryCraft(capturedRecipe);
            });

            // Recipe text
            var textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.sizeDelta = new Vector2(-10, 0);
            textRT.anchoredPosition = Vector2.zero;

            var tmp = textGO.AddComponent<TextMeshProUGUI>();
            tmp.fontSize = 12;
            tmp.alignment = TextAlignmentOptions.MidlineLeft;
            tmp.color = canCraft ? Color.white : new Color(0.6f, 0.6f, 0.6f);

            string ingredientText = "";
            foreach (var ing in recipe.ingredients)
            {
                if (ingredientText.Length > 0) ingredientText += " + ";
                ingredientText += $"{ing.count}x {ing.item.displayName}";
            }
            tmp.text = $"{recipe.resultCount}x {recipe.resultItem.displayName}\n<size=9>{ingredientText}</size>";
            tmp.raycastTarget = false;

            _recipeButtons.Add(btnGO);
        }
    }
}
