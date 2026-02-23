using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro;

namespace BlockCraft
{
    public class MainMenuUI : MonoBehaviour
    {
        [SerializeField] private string gameSceneName = "GameWorld";

        private Canvas _canvas;

        private void Start()
        {
            CreateMenu();
        }

        private void CreateMenu()
        {
            _canvas = GetComponent<Canvas>();
            if (_canvas == null)
            {
                _canvas = gameObject.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
                gameObject.AddComponent<GraphicRaycaster>();
            }

            // Background
            var bgGO = new GameObject("Background");
            bgGO.transform.SetParent(transform, false);
            var bgRT = bgGO.AddComponent<RectTransform>();
            bgRT.anchorMin = Vector2.zero;
            bgRT.anchorMax = Vector2.one;
            bgRT.sizeDelta = Vector2.zero;
            var bgImg = bgGO.AddComponent<Image>();
            bgImg.color = new Color(0.15f, 0.2f, 0.3f);

            // Title
            var titleGO = new GameObject("Title");
            titleGO.transform.SetParent(transform, false);
            var titleRT = titleGO.AddComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0.5f, 0.5f);
            titleRT.anchorMax = new Vector2(0.5f, 0.5f);
            titleRT.anchoredPosition = new Vector2(0, 150);
            titleRT.sizeDelta = new Vector2(600, 100);
            var titleText = titleGO.AddComponent<TextMeshProUGUI>();
            titleText.text = "BlockCraft";
            titleText.fontSize = 72;
            titleText.fontStyle = FontStyles.Bold;
            titleText.alignment = TextAlignmentOptions.Center;
            titleText.color = new Color(0.3f, 0.9f, 0.4f);

            // Subtitle
            var subGO = new GameObject("Subtitle");
            subGO.transform.SetParent(transform, false);
            var subRT = subGO.AddComponent<RectTransform>();
            subRT.anchorMin = new Vector2(0.5f, 0.5f);
            subRT.anchorMax = new Vector2(0.5f, 0.5f);
            subRT.anchoredPosition = new Vector2(0, 80);
            subRT.sizeDelta = new Vector2(600, 40);
            var subText = subGO.AddComponent<TextMeshProUGUI>();
            subText.text = "A 2D Pixel Art Survival Game";
            subText.fontSize = 20;
            subText.alignment = TextAlignmentOptions.Center;
            subText.color = new Color(0.7f, 0.7f, 0.7f);

            // Buttons container
            var buttonsGO = new GameObject("Buttons");
            buttonsGO.transform.SetParent(transform, false);
            var buttonsRT = buttonsGO.AddComponent<RectTransform>();
            buttonsRT.anchorMin = new Vector2(0.5f, 0.5f);
            buttonsRT.anchorMax = new Vector2(0.5f, 0.5f);
            buttonsRT.anchoredPosition = new Vector2(0, -30);
            buttonsRT.sizeDelta = new Vector2(300, 200);

            var vlg = buttonsGO.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 15;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childAlignment = TextAnchor.MiddleCenter;

            // New World button
            CreateButton(buttonsGO.transform, "New World", new Color(0.2f, 0.6f, 0.2f), () =>
            {
                SceneManager.LoadScene(gameSceneName);
            });

            // Load World button
            CreateButton(buttonsGO.transform, "Load World", new Color(0.3f, 0.4f, 0.6f), () =>
            {
                // TODO: Show world selection UI
                if (SaveSystem.Instance != null && SaveSystem.Instance.SaveExists("DefaultWorld"))
                {
                    SceneManager.LoadScene(gameSceneName);
                    // SaveSystem will be called after scene loads
                }
                else
                {
                    Debug.Log("No saved worlds found.");
                }
            });

            // Quit button
            CreateButton(buttonsGO.transform, "Quit", new Color(0.6f, 0.2f, 0.2f), () =>
            {
                #if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
                #else
                Application.Quit();
                #endif
            });

            // Version text
            var verGO = new GameObject("Version");
            verGO.transform.SetParent(transform, false);
            var verRT = verGO.AddComponent<RectTransform>();
            verRT.anchorMin = new Vector2(1, 0);
            verRT.anchorMax = new Vector2(1, 0);
            verRT.pivot = new Vector2(1, 0);
            verRT.anchoredPosition = new Vector2(-10, 10);
            verRT.sizeDelta = new Vector2(200, 25);
            var verText = verGO.AddComponent<TextMeshProUGUI>();
            verText.text = "v0.1.0 Alpha";
            verText.fontSize = 14;
            verText.alignment = TextAlignmentOptions.BottomRight;
            verText.color = new Color(0.5f, 0.5f, 0.5f);
        }

        private void CreateButton(Transform parent, string text, Color color, UnityEngine.Events.UnityAction onClick)
        {
            var btnGO = new GameObject($"Btn_{text}");
            btnGO.transform.SetParent(parent, false);

            var le = btnGO.AddComponent<LayoutElement>();
            le.preferredHeight = 50;

            var img = btnGO.AddComponent<Image>();
            img.color = color;

            var btn = btnGO.AddComponent<Button>();
            btn.onClick.AddListener(onClick);

            var colors = btn.colors;
            colors.highlightedColor = color * 1.2f;
            colors.pressedColor = color * 0.8f;
            btn.colors = colors;

            var textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.sizeDelta = Vector2.zero;

            var tmp = textGO.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 24;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;
            tmp.raycastTarget = false;
        }
    }
}
