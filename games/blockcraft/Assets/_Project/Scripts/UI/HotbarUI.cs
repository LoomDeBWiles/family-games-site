using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace BlockCraft
{
    public class HotbarUI : MonoBehaviour
    {
        [SerializeField] private GameObject slotPrefab;
        [SerializeField] private Transform slotsParent;
        [SerializeField] private Color selectedColor = new Color(1f, 1f, 0.5f, 1f);
        [SerializeField] private Color normalColor = new Color(0.3f, 0.3f, 0.3f, 0.8f);

        private HotbarSlotUI[] _slotUIs;

        private void Start()
        {
            CreateSlots();

            if (InventoryManager.Instance != null)
            {
                InventoryManager.Instance.OnInventoryChanged += RefreshUI;
                InventoryManager.Instance.OnHotbarSelectionChanged += OnSelectionChanged;
            }

            RefreshUI();
        }

        private void OnDestroy()
        {
            if (InventoryManager.Instance != null)
            {
                InventoryManager.Instance.OnInventoryChanged -= RefreshUI;
                InventoryManager.Instance.OnHotbarSelectionChanged -= OnSelectionChanged;
            }
        }

        private void CreateSlots()
        {
            _slotUIs = new HotbarSlotUI[Constants.HotbarSize];

            for (int i = 0; i < Constants.HotbarSize; i++)
            {
                GameObject slotGO;
                if (slotPrefab != null)
                {
                    slotGO = Instantiate(slotPrefab, slotsParent);
                }
                else
                {
                    slotGO = CreateDefaultSlot(slotsParent);
                }

                var slotUI = slotGO.GetComponent<HotbarSlotUI>();
                if (slotUI == null)
                    slotUI = slotGO.AddComponent<HotbarSlotUI>();

                slotUI.SlotIndex = i;
                _slotUIs[i] = slotUI;
            }
        }

        private GameObject CreateDefaultSlot(Transform parent)
        {
            var slotGO = new GameObject("HotbarSlot");
            slotGO.transform.SetParent(parent, false);

            var rt = slotGO.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(50, 50);

            var bg = slotGO.AddComponent<Image>();
            bg.color = normalColor;

            // Icon
            var iconGO = new GameObject("Icon");
            iconGO.transform.SetParent(slotGO.transform, false);
            var iconRT = iconGO.AddComponent<RectTransform>();
            iconRT.anchorMin = Vector2.zero;
            iconRT.anchorMax = Vector2.one;
            iconRT.sizeDelta = new Vector2(-8, -8);
            iconRT.anchoredPosition = Vector2.zero;
            var iconImg = iconGO.AddComponent<Image>();
            iconImg.preserveAspect = true;
            iconImg.enabled = false;

            // Count text
            var countGO = new GameObject("Count");
            countGO.transform.SetParent(slotGO.transform, false);
            var countRT = countGO.AddComponent<RectTransform>();
            countRT.anchorMin = new Vector2(1, 0);
            countRT.anchorMax = new Vector2(1, 0);
            countRT.pivot = new Vector2(1, 0);
            countRT.sizeDelta = new Vector2(30, 20);
            countRT.anchoredPosition = new Vector2(-2, 2);
            var countText = countGO.AddComponent<TextMeshProUGUI>();
            countText.fontSize = 12;
            countText.alignment = TextAlignmentOptions.BottomRight;
            countText.text = "";

            return slotGO;
        }

        public void RefreshUI()
        {
            if (_slotUIs == null || InventoryManager.Instance == null) return;

            for (int i = 0; i < Constants.HotbarSize; i++)
            {
                var slot = InventoryManager.Instance.GetSlot(i);
                _slotUIs[i].UpdateDisplay(slot);
                _slotUIs[i].SetSelected(i == InventoryManager.Instance.SelectedHotbarIndex, selectedColor, normalColor);
            }
        }

        private void OnSelectionChanged(int index)
        {
            RefreshUI();
        }
    }

    public class HotbarSlotUI : MonoBehaviour
    {
        public int SlotIndex { get; set; }

        private Image _background;
        private Image _icon;
        private TextMeshProUGUI _countText;

        private void Awake()
        {
            _background = GetComponent<Image>();
            _icon = transform.Find("Icon")?.GetComponent<Image>();
            _countText = GetComponentInChildren<TextMeshProUGUI>();
        }

        public void UpdateDisplay(InventorySlot slot)
        {
            if (_icon == null) return;

            if (slot == null || slot.IsEmpty)
            {
                _icon.enabled = false;
                if (_countText != null) _countText.text = "";
            }
            else
            {
                _icon.enabled = true;
                _icon.sprite = slot.Item.icon;
                if (_countText != null)
                    _countText.text = slot.Count > 1 ? slot.Count.ToString() : "";
            }
        }

        public void SetSelected(bool selected, Color selectedColor, Color normalColor)
        {
            if (_background != null)
                _background.color = selected ? selectedColor : normalColor;
        }
    }
}
