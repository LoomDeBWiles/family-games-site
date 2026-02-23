using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro;

namespace BlockCraft
{
    public class PauseMenuUI : MonoBehaviour
    {
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private string mainMenuScene = "MainMenu";

        private bool _isShowing;

        private void Start()
        {
            CreateUI();
            Hide();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (_isShowing) Hide();
                else Show();
            }
        }

        private void CreateUI()
        {
            if (pausePanel != null) return;

            pausePanel = new GameObject("PausePanel");
            pausePanel.transform.SetParent(transform, false);

            var rt = pausePanel.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;

            // Semi-transparent overlay
            var overlay = pausePanel.AddComponent<Image>();
            overlay.color = new Color(0, 0, 0, 0.6f);

            // Content container
            var content = new GameObject("Content");
            content.transform.SetParent(pausePanel.transform, false);
            var contentRT = content.AddComponent<RectTransform>();
            contentRT.anchorMin = new Vector2(0.5f, 0.5f);
            contentRT.anchorMax = new Vector2(0.5f, 0.5f);
            contentRT.sizeDelta = new Vector2(250, 250);

            var vlg = content.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 12;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childAlignment = TextAnchor.MiddleCenter;

            // Title
            var titleGO = new GameObject("Title");
            titleGO.transform.SetParent(content.transform, false);
            var titleLE = titleGO.AddComponent<LayoutElement>();
            titleLE.preferredHeight = 50;
            var titleText = titleGO.AddComponent<TextMeshProUGUI>();
            titleText.text = "PAUSED";
            titleText.fontSize = 36;
            titleText.fontStyle = FontStyles.Bold;
            titleText.alignment = TextAlignmentOptions.Center;
            titleText.color = Color.white;

            // Resume button
            CreateButton(content.transform, "Resume", new Color(0.2f, 0.5f, 0.2f), () => Hide());

            // Save button
            CreateButton(content.transform, "Save World", new Color(0.3f, 0.4f, 0.6f), () =>
            {
                SaveSystem.Instance?.SaveWorld("DefaultWorld");
            });

            // Quit to menu
            CreateButton(content.transform, "Quit to Menu", new Color(0.6f, 0.2f, 0.2f), () =>
            {
                Time.timeScale = 1f;
                SceneManager.LoadScene(mainMenuScene);
            });
        }

        private void CreateButton(Transform parent, string text, Color color, UnityEngine.Events.UnityAction onClick)
        {
            var btnGO = new GameObject($"Btn_{text}");
            btnGO.transform.SetParent(parent, false);

            var le = btnGO.AddComponent<LayoutElement>();
            le.preferredHeight = 40;

            var img = btnGO.AddComponent<Image>();
            img.color = color;

            var btn = btnGO.AddComponent<Button>();
            btn.onClick.AddListener(onClick);

            var textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.sizeDelta = Vector2.zero;

            var tmp = textGO.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 18;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;
            tmp.raycastTarget = false;
        }

        public void Show()
        {
            _isShowing = true;
            pausePanel.SetActive(true);
            Time.timeScale = 0f;
        }

        public void Hide()
        {
            _isShowing = false;
            pausePanel.SetActive(false);
            Time.timeScale = 1f;
        }
    }
}
