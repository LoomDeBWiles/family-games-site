using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    public class MobSpawner : MonoBehaviour
    {
        public static MobSpawner Instance { get; private set; }

        [SerializeField] private EnemyData[] spawnableEnemies;
        [SerializeField] private int maxActiveEnemies = Constants.MaxActiveEnemies;
        [SerializeField] private float spawnInterval = Constants.EnemySpawnInterval;
        [SerializeField] private float minSpawnDistance = 20f;
        [SerializeField] private float maxSpawnDistance = 40f;

        private List<EnemyBase> _activeEnemies = new List<EnemyBase>();
        private float _spawnTimer;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            CleanupDeadEnemies();
            DespawnFarEnemies();

            _spawnTimer -= Time.deltaTime;
            if (_spawnTimer <= 0)
            {
                _spawnTimer = spawnInterval;
                TrySpawnEnemy();
            }
        }

        private void TrySpawnEnemy()
        {
            if (_activeEnemies.Count >= maxActiveEnemies) return;
            if (spawnableEnemies == null || spawnableEnemies.Length == 0) return;
            if (PlayerController.Instance == null) return;

            bool isNight = TimeManager.Instance != null && TimeManager.Instance.IsNight;

            // Filter eligible enemies
            List<EnemyData> eligible = new List<EnemyData>();
            foreach (var enemy in spawnableEnemies)
            {
                if (enemy.nightOnly && !isNight) continue;
                eligible.Add(enemy);
            }

            if (eligible.Count == 0) return;

            // Pick random enemy
            EnemyData chosen = eligible[Random.Range(0, eligible.Count)];

            // Find spawn position
            Vector2 playerPos = PlayerController.Instance.transform.position;
            Vector2? spawnPos = FindSpawnPosition(playerPos);

            if (spawnPos.HasValue)
            {
                SpawnEnemy(chosen, spawnPos.Value);
            }
        }

        private Vector2? FindSpawnPosition(Vector2 playerPos)
        {
            for (int attempt = 0; attempt < 10; attempt++)
            {
                float angle = Random.Range(0f, 360f) * Mathf.Deg2Rad;
                float dist = Random.Range(minSpawnDistance, maxSpawnDistance);
                float x = playerPos.x + Mathf.Cos(angle) * dist;

                int worldX = Mathf.FloorToInt(x);
                if (worldX < 0 || worldX >= Constants.WorldWidth) continue;

                // Find surface
                int surfaceY = -1;
                if (WorldManager.Instance != null && WorldManager.Instance.Generator != null)
                {
                    surfaceY = WorldManager.Instance.Generator.GetSurfaceHeight(worldX);
                }

                if (surfaceY < 0) continue;

                // Check that the spawn position is on solid ground with air above
                Vector2 pos = new Vector2(worldX + 0.5f, surfaceY + 1.5f);

                // Verify it's not inside a block
                if (WorldManager.Instance.GetTile(worldX, surfaceY + 1) != TileID.Air) continue;
                if (WorldManager.Instance.GetTile(worldX, surfaceY + 2) != TileID.Air) continue;

                return pos;
            }

            return null;
        }

        private void SpawnEnemy(EnemyData data, Vector2 position)
        {
            var enemyGO = new GameObject(data.enemyName);
            enemyGO.transform.position = position;

            // Add components
            enemyGO.AddComponent<Rigidbody2D>();
            enemyGO.AddComponent<BoxCollider2D>();

            // Add correct enemy type
            EnemyBase enemy;
            if (data.enemyName.Contains("Zombie"))
                enemy = enemyGO.AddComponent<ZombieEnemy>();
            else if (data.enemyName.Contains("Slime"))
                enemy = enemyGO.AddComponent<SlimeEnemy>();
            else if (data.enemyName.Contains("Skeleton"))
                enemy = enemyGO.AddComponent<SkeletonEnemy>();
            else
                enemy = enemyGO.AddComponent<EnemyBase>();

            enemy.Initialize(data);
            _activeEnemies.Add(enemy);
        }

        public void RegisterEnemy(EnemyBase enemy)
        {
            if (!_activeEnemies.Contains(enemy))
                _activeEnemies.Add(enemy);
        }

        public void OnEnemyDied(EnemyBase enemy)
        {
            _activeEnemies.Remove(enemy);
        }

        private void CleanupDeadEnemies()
        {
            _activeEnemies.RemoveAll(e => e == null || e.IsDead);
        }

        private void DespawnFarEnemies()
        {
            if (PlayerController.Instance == null) return;
            Vector2 playerPos = PlayerController.Instance.transform.position;

            for (int i = _activeEnemies.Count - 1; i >= 0; i--)
            {
                if (_activeEnemies[i] == null) continue;

                float dist = Vector2.Distance(playerPos, _activeEnemies[i].transform.position);
                if (dist > Constants.EnemyDespawnDistance)
                {
                    Destroy(_activeEnemies[i].gameObject);
                    _activeEnemies.RemoveAt(i);
                }
            }
        }

        public int ActiveEnemyCount => _activeEnemies.Count;
        public List<EnemyBase> GetActiveEnemies() => _activeEnemies;
    }
}
