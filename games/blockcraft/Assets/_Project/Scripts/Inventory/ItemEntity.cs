using UnityEngine;

namespace BlockCraft
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(CircleCollider2D))]
    public class ItemEntity : MonoBehaviour
    {
        [SerializeField] private ItemData itemData;
        [SerializeField] private int count = 1;
        [SerializeField] private float pickupDelay = 0.5f;
        [SerializeField] private float magnetSpeed = 8f;
        [SerializeField] private float bobAmplitude = 0.1f;
        [SerializeField] private float bobFrequency = 2f;
        [SerializeField] private float despawnTime = 300f; // 5 minutes

        private Rigidbody2D _rb;
        private SpriteRenderer _sr;
        private float _spawnTime;
        private float _bobOffset;
        private bool _beingMagneted;

        public ItemData Item => itemData;
        public int Count => count;

        public void Initialize(ItemData item, int amount, Vector2 velocity)
        {
            itemData = item;
            count = amount;

            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 2f;
            _rb.linearVelocity = velocity;

            var col = GetComponent<CircleCollider2D>();
            col.radius = 0.3f;
            col.isTrigger = true;

            _sr = GetComponentInChildren<SpriteRenderer>();
            if (_sr == null)
            {
                var spriteGO = new GameObject("Sprite");
                spriteGO.transform.SetParent(transform);
                spriteGO.transform.localPosition = Vector3.zero;
                _sr = spriteGO.AddComponent<SpriteRenderer>();
            }

            _sr.sprite = item.icon != null ? item.icon : item.worldSprite;
            _sr.sortingOrder = 7;
            transform.localScale = Vector3.one * 0.6f;

            _spawnTime = Time.time;
            _bobOffset = Random.Range(0f, Mathf.PI * 2);

            gameObject.name = $"ItemEntity_{item.displayName}";

            Destroy(gameObject, despawnTime);
        }

        private void Update()
        {
            if (Time.time - _spawnTime < pickupDelay) return;

            if (PlayerController.Instance == null) return;

            float dist = Vector2.Distance(transform.position, PlayerController.Instance.transform.position);

            // Magnet effect
            if (dist <= Constants.DropMagnetRadius)
            {
                _beingMagneted = true;
                Vector2 dir = ((Vector2)PlayerController.Instance.transform.position - (Vector2)transform.position).normalized;
                _rb.linearVelocity = dir * magnetSpeed;
            }

            // Pickup
            if (dist <= Constants.PickupRadius)
            {
                TryPickup();
            }

            // Bob animation (only when not being magneted)
            if (!_beingMagneted)
            {
                float bob = Mathf.Sin((Time.time + _bobOffset) * bobFrequency) * bobAmplitude;
                if (_sr != null)
                    _sr.transform.localPosition = new Vector3(0, bob, 0);
            }
        }

        private void TryPickup()
        {
            if (InventoryManager.Instance == null) return;

            int leftover = InventoryManager.Instance.AddItem(itemData, count);
            if (leftover <= 0)
            {
                Destroy(gameObject);
            }
            else
            {
                count = leftover;
            }
        }

        public static ItemEntity SpawnDrop(ItemData item, int count, Vector2 position)
        {
            if (item == null || count <= 0) return null;

            var go = new GameObject("ItemEntity");
            go.transform.position = position;
            go.AddComponent<Rigidbody2D>();
            go.AddComponent<CircleCollider2D>();

            var entity = go.AddComponent<ItemEntity>();
            Vector2 velocity = new Vector2(Random.Range(-2f, 2f), Random.Range(2f, 4f));
            entity.Initialize(item, count, velocity);

            return entity;
        }
    }
}
