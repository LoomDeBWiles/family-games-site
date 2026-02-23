using UnityEngine;

namespace BlockCraft
{
    public class PlayerInteraction : MonoBehaviour
    {
        [Header("Mining")]
        [SerializeField] private float miningRange = Constants.MiningRange;
        [SerializeField] private float placementRange = Constants.PlacementRange;
        [SerializeField] private GameObject crackOverlayPrefab;

        private Camera _cam;
        private float _miningTimer;
        private float _currentMiningTime;
        private Vector2Int _miningTarget;
        private bool _isMining;
        private SpriteRenderer _crackOverlay;

        // Crack overlay sprites (4 stages)
        private Sprite[] _crackSprites;

        private void Start()
        {
            _cam = Camera.main;
            CreateCrackOverlay();
        }

        private void CreateCrackOverlay()
        {
            var go = new GameObject("CrackOverlay");
            go.transform.SetParent(transform);
            _crackOverlay = go.AddComponent<SpriteRenderer>();
            _crackOverlay.sortingOrder = 5;
            _crackOverlay.enabled = false;

            // Generate crack sprites procedurally
            _crackSprites = new Sprite[4];
            for (int i = 0; i < 4; i++)
            {
                var tex = new Texture2D(16, 16);
                tex.filterMode = FilterMode.Point;
                var pixels = new Color[16 * 16];

                // Create crack pattern based on stage
                float density = (i + 1) * 0.15f;
                var rng = new System.Random(i * 42);
                for (int p = 0; p < pixels.Length; p++)
                {
                    if ((float)rng.NextDouble() < density)
                        pixels[p] = new Color(0, 0, 0, 0.4f + i * 0.15f);
                    else
                        pixels[p] = Color.clear;
                }
                tex.SetPixels(pixels);
                tex.Apply();

                _crackSprites[i] = Sprite.Create(tex, new Rect(0, 0, 16, 16),
                    new Vector2(0.5f, 0.5f), Constants.PixelsPerUnit);
            }
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.IsPaused) return;

            HandleMining();
            HandlePlacement();
            HandleItemUse();
        }

        private void HandleMining()
        {
            if (Input.GetMouseButton(0))
            {
                Vector2Int tilePos = TileHelper.MouseToTilePos(_cam);
                float dist = Vector2.Distance(transform.position, new Vector2(tilePos.x + 0.5f, tilePos.y + 0.5f));

                if (dist > miningRange)
                {
                    StopMining();
                    return;
                }

                TileID tileID = WorldManager.Instance.GetTile(tilePos.x, tilePos.y);
                if (tileID == TileID.Air || tileID == TileID.Bedrock)
                {
                    StopMining();
                    return;
                }

                // New target?
                if (!_isMining || _miningTarget != tilePos)
                {
                    StartMining(tilePos, tileID);
                }

                // Continue mining
                _miningTimer += Time.deltaTime;

                // Update crack overlay
                UpdateCrackOverlay();

                // Check completion
                if (_miningTimer >= _currentMiningTime)
                {
                    CompleteMining(tilePos, tileID);
                }
            }
            else if (_isMining)
            {
                StopMining();
            }
        }

        private void StartMining(Vector2Int pos, TileID tileID)
        {
            _miningTarget = pos;
            _miningTimer = 0f;
            _isMining = true;

            // Calculate mining time based on block hardness and tool
            BlockData blockData = TileRegistry.Instance?.GetBlockData(tileID);
            float hardness = blockData != null ? blockData.hardness : 1f;

            float toolMultiplier = 1f;
            var selectedSlot = InventoryManager.Instance?.SelectedSlot;
            if (selectedSlot != null && !selectedSlot.IsEmpty && selectedSlot.Item.IsTool)
            {
                // Check if correct tool type
                if (blockData != null && selectedSlot.Item.toolType == blockData.requiredToolType)
                {
                    toolMultiplier = selectedSlot.Item.toolPower;
                }
                else if (blockData != null && blockData.requiredToolType == ToolType.None)
                {
                    toolMultiplier = selectedSlot.Item.toolPower;
                }
            }

            _currentMiningTime = (Constants.BaseMiningTime * hardness) / toolMultiplier;

            // Check tool tier requirement
            if (blockData != null && selectedSlot != null && !selectedSlot.IsEmpty)
            {
                if (selectedSlot.Item.toolTier < blockData.minToolTier)
                {
                    _currentMiningTime *= 10f; // Very slow without proper tier
                }
            }

            // Position crack overlay
            _crackOverlay.transform.position = new Vector3(pos.x + 0.5f, pos.y + 0.5f, 0);
            _crackOverlay.enabled = true;
        }

        private void UpdateCrackOverlay()
        {
            if (!_isMining || _crackSprites == null) return;

            float progress = _miningTimer / _currentMiningTime;
            int stage = Mathf.Clamp(Mathf.FloorToInt(progress * 4), 0, 3);
            _crackOverlay.sprite = _crackSprites[stage];
        }

        private void CompleteMining(Vector2Int pos, TileID tileID)
        {
            BlockData blockData = TileRegistry.Instance?.GetBlockData(tileID);

            // Drop item
            if (blockData != null && blockData.dropItem != null)
            {
                int leftover = InventoryManager.Instance.AddItem(blockData.dropItem, blockData.dropCount);
                if (leftover > 0)
                {
                    // TODO: Spawn item entity in world for leftover
                    Debug.Log($"Inventory full! {leftover} items dropped.");
                }
            }

            // Remove block
            WorldManager.Instance.SetTile(pos.x, pos.y, TileID.Air);

            // Use tool durability
            InventoryManager.Instance?.UseSelectedTool();

            // Play break sound
            if (blockData != null && blockData.breakSound != null)
            {
                AudioSource.PlayClipAtPoint(blockData.breakSound, new Vector3(pos.x, pos.y, 0));
            }

            StopMining();
        }

        private void StopMining()
        {
            _isMining = false;
            _miningTimer = 0f;
            if (_crackOverlay != null)
                _crackOverlay.enabled = false;
        }

        private void HandlePlacement()
        {
            if (!Input.GetMouseButtonDown(1)) return;

            var selectedSlot = InventoryManager.Instance?.SelectedSlot;
            if (selectedSlot == null || selectedSlot.IsEmpty) return;

            // Check if item places a block
            if (!selectedSlot.Item.IsBlock || selectedSlot.Item.placesBlock == TileID.Air) return;

            Vector2Int tilePos = TileHelper.MouseToTilePos(_cam);
            float dist = Vector2.Distance(transform.position, new Vector2(tilePos.x + 0.5f, tilePos.y + 0.5f));

            if (dist > placementRange) return;

            // Check target is air
            if (WorldManager.Instance.GetTile(tilePos.x, tilePos.y) != TileID.Air) return;

            // Check not overlapping player
            Bounds playerBounds = new Bounds(transform.position, new Vector3(0.8f, 1.8f, 0));
            Bounds tileBounds = new Bounds(new Vector3(tilePos.x + 0.5f, tilePos.y + 0.5f, 0), Vector3.one);
            if (playerBounds.Intersects(tileBounds)) return;

            // Check adjacent to solid block (can't place in mid-air)
            bool hasNeighbor =
                WorldManager.Instance.IsSolid(tilePos.x - 1, tilePos.y) ||
                WorldManager.Instance.IsSolid(tilePos.x + 1, tilePos.y) ||
                WorldManager.Instance.IsSolid(tilePos.x, tilePos.y - 1) ||
                WorldManager.Instance.IsSolid(tilePos.x, tilePos.y + 1);

            if (!hasNeighbor) return;

            // Place block
            WorldManager.Instance.SetTile(tilePos.x, tilePos.y, selectedSlot.Item.placesBlock);

            // Check if it's a crafting station
            if (selectedSlot.Item.placesBlock == TileID.Workbench || selectedSlot.Item.placesBlock == TileID.Furnace)
            {
                // Crafting station blocks are handled by PlayerInteraction when right-clicked
            }

            // Consume item
            selectedSlot.Count--;
            if (selectedSlot.Count <= 0)
                selectedSlot.Clear();

            InventoryManager.Instance.SetSlot(
                InventoryManager.Instance.SelectedHotbarIndex,
                selectedSlot
            );

            // Play place sound
            BlockData blockData = TileRegistry.Instance?.GetBlockData(selectedSlot.Item.placesBlock);
            if (blockData != null && blockData.placeSound != null)
            {
                AudioSource.PlayClipAtPoint(blockData.placeSound, new Vector3(tilePos.x, tilePos.y, 0));
            }
        }

        private void HandleItemUse()
        {
            // Right-click on crafting stations
            if (!Input.GetMouseButtonDown(1)) return;

            var selectedSlot = InventoryManager.Instance?.SelectedSlot;
            // Only check for station interaction if we're not placing a block
            if (selectedSlot != null && !selectedSlot.IsEmpty && selectedSlot.Item.IsBlock) return;

            Vector2Int tilePos = TileHelper.MouseToTilePos(_cam);
            float dist = Vector2.Distance(transform.position, new Vector2(tilePos.x + 0.5f, tilePos.y + 0.5f));
            if (dist > placementRange) return;

            TileID tileID = WorldManager.Instance.GetTile(tilePos.x, tilePos.y);

            if (tileID == TileID.Workbench)
            {
                CraftingManager.Instance?.OpenCraftingUI(CraftingStationType.Workbench);
            }
            else if (tileID == TileID.Furnace)
            {
                CraftingManager.Instance?.OpenCraftingUI(CraftingStationType.Furnace);
            }
        }
    }
}
