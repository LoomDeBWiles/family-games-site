using UnityEngine;

namespace BlockCraft
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private WorldManager worldManager;
        [SerializeField] private PlayerController playerPrefab;

        [Header("Settings")]
        [SerializeField] private int worldSeed = 0;
        [SerializeField] private bool useRandomSeed = true;

        private PlayerController _player;
        private bool _isPaused;
        private bool _isInitialized;

        public PlayerController Player => _player;
        public bool IsPaused => _isPaused;

        public enum GameState { MainMenu, Playing, Paused, Dead }
        public GameState CurrentState { get; private set; } = GameState.MainMenu;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            StartNewGame();
        }

        public void StartNewGame()
        {
            if (useRandomSeed)
                worldSeed = Random.Range(int.MinValue, int.MaxValue);

            Debug.Log($"[BlockCraft] Starting new world with seed: {worldSeed}");

            // Initialize world
            if (worldManager == null)
                worldManager = FindFirstObjectByType<WorldManager>();

            if (worldManager == null)
            {
                var wmGO = new GameObject("WorldManager");
                worldManager = wmGO.AddComponent<WorldManager>();
            }

            worldManager.InitializeWorld(worldSeed);

            // Calculate spawn position
            Vector2 spawnPos = worldManager.GetSpawnPosition();

            // Generate initial chunks around spawn
            worldManager.GenerateInitialChunks(spawnPos);

            // Spawn player
            SpawnPlayer(spawnPos);

            CurrentState = GameState.Playing;
            _isInitialized = true;
        }

        private void SpawnPlayer(Vector2 position)
        {
            if (_player != null)
            {
                _player.TeleportTo(position);
                return;
            }

            if (playerPrefab != null)
            {
                _player = Instantiate(playerPrefab, position, Quaternion.identity);
            }
            else
            {
                // Create player from scratch
                var playerGO = new GameObject("Player");
                playerGO.transform.position = new Vector3(position.x, position.y, 0);

                // Add sprite renderer
                var spriteChild = new GameObject("Sprite");
                spriteChild.transform.SetParent(playerGO.transform);
                spriteChild.transform.localPosition = Vector3.zero;
                var sr = spriteChild.AddComponent<SpriteRenderer>();
                sr.color = new Color(0.2f, 0.6f, 1f); // Blue player placeholder
                sr.sortingOrder = 10;

                // Create placeholder sprite
                var tex = new Texture2D(16, 32);
                tex.filterMode = FilterMode.Point;
                var pixels = new Color[16 * 32];
                for (int i = 0; i < pixels.Length; i++)
                    pixels[i] = Color.white;
                tex.SetPixels(pixels);
                tex.Apply();
                sr.sprite = Sprite.Create(tex, new Rect(0, 0, 16, 32), new Vector2(0.5f, 0.5f), Constants.PixelsPerUnit);

                // Add components
                _player = playerGO.AddComponent<PlayerController>();
                var collider = playerGO.AddComponent<BoxCollider2D>();
                collider.size = new Vector2(0.8f, 1.8f);
                collider.offset = new Vector2(0, 0);
                var rb = playerGO.AddComponent<Rigidbody2D>();
                rb.freezeRotation = true;
                rb.gravityScale = 3f;
            }

            // Setup camera
            var cam = CameraController.Instance;
            if (cam == null)
            {
                cam = FindFirstObjectByType<CameraController>();
            }
            if (cam == null)
            {
                var camGO = Camera.main != null ? Camera.main.gameObject : new GameObject("MainCamera");
                if (camGO.GetComponent<Camera>() == null)
                    camGO.AddComponent<Camera>();
                cam = camGO.AddComponent<CameraController>();
                camGO.tag = "MainCamera";
            }
            cam.SetTarget(_player.transform);
            cam.SnapToTarget();
        }

        private void Update()
        {
            if (!_isInitialized || CurrentState != GameState.Playing) return;

            // Toggle pause
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                TogglePause();
            }

            // Update chunks around player
            if (_player != null && worldManager != null)
            {
                worldManager.UpdateChunks(_player.transform.position);
            }
        }

        public void TogglePause()
        {
            _isPaused = !_isPaused;
            Time.timeScale = _isPaused ? 0f : 1f;
            CurrentState = _isPaused ? GameState.Paused : GameState.Playing;
        }

        public void PlayerDied()
        {
            CurrentState = GameState.Dead;
            // Handled by PlayerStats
        }

        public void Respawn()
        {
            if (_player == null || worldManager == null) return;
            Vector2 spawnPos = worldManager.GetSpawnPosition();
            _player.TeleportTo(spawnPos);
            CurrentState = GameState.Playing;
        }
    }
}
