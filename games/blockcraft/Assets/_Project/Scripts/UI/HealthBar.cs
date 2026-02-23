using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace BlockCraft
{
    public class HealthBar : MonoBehaviour
    {
        [SerializeField] private Image fillImage;
        [SerializeField] private TextMeshProUGUI valueText;
        [SerializeField] private Color fullColor = Color.red;
        [SerializeField] private Color lowColor = new Color(0.5f, 0, 0);

        private void Start()
        {
            if (fillImage == null)
                CreateUI();

            if (PlayerStats.Instance != null)
                PlayerStats.Instance.OnHealthChanged += UpdateBar;

            UpdateBar(Constants.PlayerMaxHealth, Constants.PlayerMaxHealth);
        }

        private void OnDestroy()
        {
            if (PlayerStats.Instance != null)
                PlayerStats.Instance.OnHealthChanged -= UpdateBar;
        }

        private void CreateUI()
        {
            // Background
            var bg = GetComponent<Image>();
            if (bg == null) bg = gameObject.AddComponent<Image>();
            bg.color = new Color(0.2f, 0.2f, 0.2f, 0.8f);

            // Fill
            var fillGO = new GameObject("Fill");
            fillGO.transform.SetParent(transform, false);
            var fillRT = fillGO.AddComponent<RectTransform>();
            fillRT.anchorMin = Vector2.zero;
            fillRT.anchorMax = Vector2.one;
            fillRT.sizeDelta = new Vector2(-4, -4);
            fillRT.anchoredPosition = Vector2.zero;

            fillImage = fillGO.AddComponent<Image>();
            fillImage.color = fullColor;

            // Text
            var textGO = new GameObject("Value");
            textGO.transform.SetParent(transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.sizeDelta = Vector2.zero;
            textRT.anchoredPosition = Vector2.zero;

            valueText = textGO.AddComponent<TextMeshProUGUI>();
            valueText.fontSize = 12;
            valueText.alignment = TextAlignmentOptions.Center;
            valueText.color = Color.white;
        }

        private void UpdateBar(float current, float max)
        {
            float pct = max > 0 ? current / max : 0;
            if (fillImage != null)
            {
                fillImage.fillAmount = pct;
                fillImage.color = Color.Lerp(lowColor, fullColor, pct);
            }
            if (valueText != null)
                valueText.text = $"{Mathf.CeilToInt(current)}/{Mathf.CeilToInt(max)}";
        }
    }
}
