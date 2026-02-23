using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

namespace BlockCraft
{
    public class InventoryUI : MonoBehaviour
    {
        public static InventoryUI Instance { get; private set; }

        [SerializeField] private GameObject inventoryPanel;
        [SerializeField] private GameObject slotPrefab;
        [SerializeField] private Transform gridParent;
        [SerializeField] private Color normalSlotColor = new Color(0.3f, 0.3f, 0.3f, 0.8f);
        [SerializeField] private Color hoverSlotColor = new Color(0.5f, 0.5f, 0.5f, 0.9f);

        private InventorySlotUI[] _slotUIs;
        private InventorySlot _heldSlot;
        private GameObject _heldItemVisual;
        private bool _isOpen;

        public bool IsOpen => _isOpen;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            CreateUI();

            if (InventoryManager.Instance != null)
                InventoryManager.Instance.OnInventoryChanged += RefreshUI;

            Close();
        }

        private void OnDestroy()
        {
            if (InventoryManager.Instance != null)
                InventoryManager.Instance.OnInventoryChanged -= RefreshUI;
        }

        private void CreateUI()
        {
            if (inventoryPanel == null)
            {
                // Create inventory panel
                inventoryPanel = new GameObject("InventoryPanel");
                inventoryPanel.transform.SetParent(transform, false);

                var rt = inventoryPanel.AddComponent<RectTransform>();
                rt.anchorMin = new Vector2(0.5f, 0.5f);
                rt.anchorMax = new Vector2(0.5f, 0.5f);
                rt.sizeDelta = new Vector2(540, 240);
                rt.anchoredPosition = Vector2.zero;

                var bg = inventoryPanel.AddComponent<Image>();
                bg.color = new Color(0.15f, 0.15f, 0.15f, 0.95f);

                // Grid layout
                gridParent = inventoryPanel.transform;
                var layout = inventoryPanel.AddComponent<GridLayoutGroup>();
                layout.cellSize = new Vector2(48, 48);
                layout.spacing = new Vector2(4, 4);
                layout.padding = new RectOffset(8, 8, 8, 8);
                layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
                layout.constraintCount = Constants.InventoryCols;
            }

            // Create slot UIs for backpack slots (10-39)
            int backpackSlots = Constants.TotalInventorySlots - Constants.HotbarSize;
            _slotUIs = new InventorySlotUI[backpackSlots];

            for (int i = 0; i < backpackSlots; i++)
            {
                int inventoryIndex = Constants.HotbarSize + i;
                var slotGO = CreateSlotGO(gridParent, inventoryIndex);
                var slotUI = slotGO.AddComponent<InventorySlotUI>();
                slotUI.Initialize(inventoryIndex, this);
                _slotUIs[i] = slotUI;
            }

            // Create held item visual
            _heldItemVisual = new GameObject("HeldItem");
            _heldItemVisual.transform.SetParent(transform, false);
            var heldRT = _heldItemVisual.AddComponent<RectTransform>();
            heldRT.sizeDelta = new Vector2(40, 40);
            var heldImg = _heldItemVisual.AddComponent<Image>();
            heldImg.raycastTarget = false;
            heldImg.preserveAspect = true;
            _heldItemVisual.SetActive(false);
        }

        private GameObject CreateSlotGO(Transform parent, int index)
        {
            var slotGO = new GameObject($"Slot_{index}");
            slotGO.transform.SetParent(parent, false);

            var rt = slotGO.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(48, 48);

            var bg = slotGO.AddComponent<Image>();
            bg.color = normalSlotColor;

            // Icon child
            var iconGO = new GameObject("Icon");
            iconGO.transform.SetParent(slotGO.transform, false);
            var iconRT = iconGO.AddComponent<RectTransform>();
            iconRT.anchorMin = Vector2.zero;
            iconRT.anchorMax = Vector2.one;
            iconRT.sizeDelta = new Vector2(-6, -6);
            iconRT.anchoredPosition = Vector2.zero;
            var iconImg = iconGO.AddComponent<Image>();
            iconImg.preserveAspect = true;
            iconImg.raycastTarget = false;
            iconImg.enabled = false;

            // Count text
            var countGO = new GameObject("Count");
            countGO.transform.SetParent(slotGO.transform, false);
            var countRT = countGO.AddComponent<RectTransform>();
            countRT.anchorMin = new Vector2(1, 0);
            countRT.anchorMax = new Vector2(1, 0);
            countRT.pivot = new Vector2(1, 0);
            countRT.sizeDelta = new Vector2(30, 18);
            countRT.anchoredPosition = new Vector2(-2, 2);
            var countText = countGO.AddComponent<TextMeshProUGUI>();
            countText.fontSize = 11;
            countText.alignment = TextAlignmentOptions.BottomRight;
            countText.raycastTarget = false;

            return slotGO;
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.E))
            {
                if (_isOpen) Close();
                else Open();
            }

            // Update held item position
            if (_heldSlot != null && !_heldSlot.IsEmpty && _heldItemVisual.activeSelf)
            {
                _heldItemVisual.transform.position = Input.mousePosition;
            }
        }

        public void Open()
        {
            _isOpen = true;
            if (inventoryPanel != null)
                inventoryPanel.SetActive(true);
            RefreshUI();
        }

        public void Close()
        {
            // Drop held item back
            if (_heldSlot != null && !_heldSlot.IsEmpty)
            {
                InventoryManager.Instance.AddItem(_heldSlot.Item, _heldSlot.Count);
                _heldSlot = null;
            }
            _heldItemVisual.SetActive(false);

            _isOpen = false;
            if (inventoryPanel != null)
                inventoryPanel.SetActive(false);
        }

        public void RefreshUI()
        {
            if (_slotUIs == null || InventoryManager.Instance == null) return;

            for (int i = 0; i < _slotUIs.Length; i++)
            {
                int inventoryIndex = Constants.HotbarSize + i;
                var slot = InventoryManager.Instance.GetSlot(inventoryIndex);
                _slotUIs[i].UpdateDisplay(slot);
            }
        }

        public void OnSlotClicked(int slotIndex)
        {
            if (InventoryManager.Instance == null) return;

            var clickedSlot = InventoryManager.Instance.GetSlot(slotIndex);

            if (_heldSlot == null || _heldSlot.IsEmpty)
            {
                // Pick up
                if (clickedSlot != null && !clickedSlot.IsEmpty)
                {
                    _heldSlot = clickedSlot.Clone();
                    clickedSlot.Clear();
                    InventoryManager.Instance.SetSlot(slotIndex, clickedSlot);
                    UpdateHeldVisual();
                }
            }
            else
            {
                // Place or swap
                if (clickedSlot == null || clickedSlot.IsEmpty)
                {
                    InventoryManager.Instance.SetSlot(slotIndex, _heldSlot.Clone());
                    _heldSlot = null;
                    UpdateHeldVisual();
                }
                else if (clickedSlot.Item == _heldSlot.Item && clickedSlot.Item.IsStackable)
                {
                    int remaining = clickedSlot.AddToStack(_heldSlot.Count);
                    if (remaining <= 0)
                        _heldSlot = null;
                    else
                        _heldSlot.Count = remaining;
                    InventoryManager.Instance.SetSlot(slotIndex, clickedSlot);
                    UpdateHeldVisual();
                }
                else
                {
                    // Swap
                    var temp = clickedSlot.Clone();
                    InventoryManager.Instance.SetSlot(slotIndex, _heldSlot.Clone());
                    _heldSlot = temp;
                    UpdateHeldVisual();
                }
            }

            RefreshUI();
        }

        public void OnSlotRightClicked(int slotIndex)
        {
            if (InventoryManager.Instance == null) return;

            if (_heldSlot != null && !_heldSlot.IsEmpty)
            {
                // Place one item
                var clickedSlot = InventoryManager.Instance.GetSlot(slotIndex);
                if (clickedSlot.IsEmpty)
                {
                    InventoryManager.Instance.SetSlot(slotIndex, new InventorySlot(_heldSlot.Item, 1));
                    _heldSlot.Count--;
                    if (_heldSlot.Count <= 0) _heldSlot = null;
                }
                else if (clickedSlot.Item == _heldSlot.Item && clickedSlot.Count < clickedSlot.Item.maxStackSize)
                {
                    clickedSlot.Count++;
                    InventoryManager.Instance.SetSlot(slotIndex, clickedSlot);
                    _heldSlot.Count--;
                    if (_heldSlot.Count <= 0) _heldSlot = null;
                }
                UpdateHeldVisual();
            }
            else
            {
                // Split stack
                var clickedSlot = InventoryManager.Instance.GetSlot(slotIndex);
                if (clickedSlot != null && !clickedSlot.IsEmpty && clickedSlot.Count > 1)
                {
                    _heldSlot = clickedSlot.Split();
                    InventoryManager.Instance.SetSlot(slotIndex, clickedSlot);
                    UpdateHeldVisual();
                }
            }

            RefreshUI();
        }

        private void UpdateHeldVisual()
        {
            if (_heldSlot == null || _heldSlot.IsEmpty)
            {
                _heldItemVisual.SetActive(false);
            }
            else
            {
                _heldItemVisual.SetActive(true);
                var img = _heldItemVisual.GetComponent<Image>();
                if (img != null)
                    img.sprite = _heldSlot.Item.icon;
            }
        }
    }

    public class InventorySlotUI : MonoBehaviour, IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler
    {
        private int _slotIndex;
        private InventoryUI _inventoryUI;
        private Image _background;
        private Image _icon;
        private TextMeshProUGUI _countText;

        public void Initialize(int index, InventoryUI ui)
        {
            _slotIndex = index;
            _inventoryUI = ui;
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

        public void OnPointerClick(PointerEventData eventData)
        {
            if (eventData.button == PointerEventData.InputButton.Left)
                _inventoryUI.OnSlotClicked(_slotIndex);
            else if (eventData.button == PointerEventData.InputButton.Right)
                _inventoryUI.OnSlotRightClicked(_slotIndex);
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (_background != null)
                _background.color = new Color(0.5f, 0.5f, 0.5f, 0.9f);

            // Show tooltip
            var slot = InventoryManager.Instance?.GetSlot(_slotIndex);
            if (slot != null && !slot.IsEmpty)
            {
                TooltipUI.Instance?.Show(slot.Item, Input.mousePosition);
            }
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            if (_background != null)
                _background.color = new Color(0.3f, 0.3f, 0.3f, 0.8f);
            TooltipUI.Instance?.Hide();
        }
    }
}
