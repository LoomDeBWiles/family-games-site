using UnityEngine;

namespace BlockCraft
{
    public class PlayerCombat : MonoBehaviour
    {
        [SerializeField] private float attackCooldown = 0f;
        [SerializeField] private Transform attackPoint;
        [SerializeField] private LayerMask enemyMask;

        private float _cooldownTimer;
        private PlayerController _controller;

        private void Start()
        {
            _controller = GetComponent<PlayerController>();

            if (attackPoint == null)
            {
                var go = new GameObject("AttackPoint");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(1f, 0.2f, 0);
                attackPoint = go.transform;
            }
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.IsPaused) return;
            if (PlayerStats.Instance != null && PlayerStats.Instance.IsDead) return;

            _cooldownTimer -= Time.deltaTime;

            // Left click attack (only if not mining)
            if (Input.GetMouseButtonDown(0) && _cooldownTimer <= 0)
            {
                var selectedSlot = InventoryManager.Instance?.SelectedSlot;
                if (selectedSlot != null && !selectedSlot.IsEmpty)
                {
                    if (selectedSlot.Item.IsWeapon)
                    {
                        if (selectedSlot.Item.toolType == ToolType.Sword)
                            MeleeAttack(selectedSlot.Item);
                        else if (selectedSlot.Item.toolType == ToolType.Bow)
                            RangedAttack(selectedSlot.Item);
                    }
                }
                else
                {
                    // Bare-hand punch
                    PunchAttack();
                }
            }

            // Update attack point position based on facing
            if (_controller != null && attackPoint != null)
            {
                float dir = _controller.FacingRight ? 1f : -1f;
                attackPoint.localPosition = new Vector3(dir * 1f, 0.2f, 0);
            }
        }

        private void MeleeAttack(ItemData weapon)
        {
            _cooldownTimer = 1f / weapon.attackSpeed;

            // Detect enemies in range
            Collider2D[] hits = Physics2D.OverlapCircleAll(
                attackPoint.position, weapon.attackRange, enemyMask
            );

            foreach (var hit in hits)
            {
                var enemy = hit.GetComponent<EnemyBase>();
                if (enemy != null && !enemy.IsDead)
                {
                    Vector2 knockDir = (hit.transform.position - transform.position).normalized;
                    enemy.TakeDamage(weapon.attackDamage, knockDir * weapon.knockback);
                }
            }

            // Use durability
            InventoryManager.Instance?.UseSelectedTool();

            // TODO: Swing animation
        }

        private void RangedAttack(ItemData weapon)
        {
            _cooldownTimer = 1f / weapon.attackSpeed;

            // Check for arrow ammo
            // TODO: Implement ammo system
            // For now, just shoot

            Vector3 mouseWorld = Camera.main.ScreenToWorldPoint(Input.mousePosition);
            Vector2 dir = ((Vector2)mouseWorld - (Vector2)transform.position).normalized;
            Vector2 spawnPos = (Vector2)attackPoint.position;

            var projGO = new GameObject("Arrow");
            projGO.transform.position = spawnPos;

            var projectile = projGO.AddComponent<Projectile>();
            projectile.Initialize(dir, 15f, weapon.attackDamage, "Enemy", 5f);

            // Visual
            var sr = projGO.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 9;
            sr.color = new Color(0.6f, 0.4f, 0.2f);

            var tex = new Texture2D(8, 2);
            tex.filterMode = FilterMode.Point;
            var pixels = new Color[16];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = Color.white;
            tex.SetPixels(pixels);
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 2), new Vector2(0.5f, 0.5f), Constants.PixelsPerUnit);

            var collider = projGO.AddComponent<CircleCollider2D>();
            collider.radius = 0.1f;
            collider.isTrigger = true;

            projGO.AddComponent<Rigidbody2D>().gravityScale = 0.2f;

            // Rotate arrow to face direction
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            projGO.transform.rotation = Quaternion.Euler(0, 0, angle);

            InventoryManager.Instance?.UseSelectedTool();
        }

        private void PunchAttack()
        {
            _cooldownTimer = 0.4f;

            Collider2D[] hits = Physics2D.OverlapCircleAll(
                attackPoint.position, 1f, enemyMask
            );

            foreach (var hit in hits)
            {
                var enemy = hit.GetComponent<EnemyBase>();
                if (enemy != null && !enemy.IsDead)
                {
                    Vector2 knockDir = (hit.transform.position - transform.position).normalized;
                    enemy.TakeDamage(1f, knockDir * 2f);
                }
            }
        }

        private void OnDrawGizmosSelected()
        {
            if (attackPoint != null)
            {
                Gizmos.color = Color.red;
                Gizmos.DrawWireSphere(attackPoint.position, 1.5f);
            }
        }
    }
}
