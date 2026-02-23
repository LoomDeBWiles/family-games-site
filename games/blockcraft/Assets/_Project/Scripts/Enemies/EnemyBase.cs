using UnityEngine;

namespace BlockCraft
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(BoxCollider2D))]
    public class EnemyBase : MonoBehaviour
    {
        [SerializeField] protected EnemyData data;

        protected Rigidbody2D rb;
        protected BoxCollider2D col;
        protected SpriteRenderer spriteRenderer;
        protected Transform playerTransform;

        protected float currentHealth;
        protected float attackCooldown;
        protected bool facingRight = true;
        protected bool isGrounded;

        // Ground check
        protected float groundCheckDist = 0.1f;

        public EnemyData Data => data;
        public float Health => currentHealth;
        public bool IsDead => currentHealth <= 0;

        public virtual void Initialize(EnemyData enemyData)
        {
            data = enemyData;
            currentHealth = data.maxHealth;

            rb = GetComponent<Rigidbody2D>();
            rb.freezeRotation = true;
            rb.gravityScale = 3f;

            col = GetComponent<BoxCollider2D>();
            col.size = data.colliderSize;

            spriteRenderer = GetComponentInChildren<SpriteRenderer>();
            if (spriteRenderer == null)
            {
                var spriteGO = new GameObject("Sprite");
                spriteGO.transform.SetParent(transform);
                spriteGO.transform.localPosition = Vector3.zero;
                spriteRenderer = spriteGO.AddComponent<SpriteRenderer>();
            }

            if (data.sprite != null)
                spriteRenderer.sprite = data.sprite;
            spriteRenderer.color = data.tintColor;
            spriteRenderer.sortingOrder = 8;

            gameObject.name = data.enemyName;

            // Find player
            if (PlayerController.Instance != null)
                playerTransform = PlayerController.Instance.transform;
        }

        protected virtual void Update()
        {
            if (IsDead) return;

            if (playerTransform == null && PlayerController.Instance != null)
                playerTransform = PlayerController.Instance.transform;

            // Daylight burning
            if (data.burnsInDaylight && TimeManager.Instance != null && TimeManager.Instance.IsDay)
            {
                TakeDamage(data.daylightDamage * Time.deltaTime, Vector2.zero);
            }

            // Attack cooldown
            if (attackCooldown > 0)
                attackCooldown -= Time.deltaTime;

            // Ground check
            isGrounded = Physics2D.Raycast(transform.position, Vector2.down,
                col.size.y / 2 + groundCheckDist, LayerMask.GetMask("Default"));

            // AI behavior
            UpdateAI();
        }

        protected virtual void UpdateAI()
        {
            if (playerTransform == null) return;

            float distToPlayer = Vector2.Distance(transform.position, playerTransform.position);

            if (distToPlayer <= data.detectionRange)
            {
                MoveTowardPlayer();

                if (distToPlayer <= data.attackRange && attackCooldown <= 0)
                {
                    Attack();
                }
            }
            else
            {
                Idle();
            }
        }

        protected virtual void MoveTowardPlayer()
        {
            if (playerTransform == null) return;

            float dir = Mathf.Sign(playerTransform.position.x - transform.position.x);
            rb.linearVelocity = new Vector2(dir * data.moveSpeed, rb.linearVelocity.y);

            // Face movement direction
            if ((dir > 0 && !facingRight) || (dir < 0 && facingRight))
            {
                facingRight = !facingRight;
                spriteRenderer.flipX = !facingRight;
            }

            // Jump if blocked
            if (isGrounded && IsBlockedAhead())
            {
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, 10f);
            }
        }

        protected bool IsBlockedAhead()
        {
            float dir = facingRight ? 1f : -1f;
            Vector2 origin = (Vector2)transform.position + new Vector2(dir * (col.size.x / 2 + 0.1f), 0);
            RaycastHit2D hit = Physics2D.Raycast(origin, Vector2.right * dir, 0.3f, LayerMask.GetMask("Default"));
            return hit.collider != null;
        }

        protected virtual void Idle()
        {
            rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
        }

        protected virtual void Attack()
        {
            attackCooldown = 1f / data.attackSpeed;

            if (PlayerStats.Instance != null)
            {
                PlayerStats.Instance.TakeDamage(data.attackDamage);

                // Knockback player
                if (PlayerController.Instance != null)
                {
                    Vector2 knockDir = (PlayerController.Instance.transform.position - transform.position).normalized;
                    PlayerController.Instance.Rb.AddForce(knockDir * data.knockbackForce, ForceMode2D.Impulse);
                }

                DamageNumberUI.Spawn(PlayerController.Instance.transform.position, data.attackDamage, Color.red);
            }
        }

        public virtual void TakeDamage(float damage, Vector2 knockback)
        {
            if (IsDead) return;

            currentHealth -= damage;
            DamageNumberUI.Spawn(transform.position, damage, Color.yellow);

            // Knockback
            if (knockback != Vector2.zero)
                rb.AddForce(knockback, ForceMode2D.Impulse);

            // Flash red
            StartCoroutine(FlashDamage());

            if (currentHealth <= 0)
                Die();
        }

        private System.Collections.IEnumerator FlashDamage()
        {
            if (spriteRenderer == null) yield break;
            Color original = spriteRenderer.color;
            spriteRenderer.color = Color.red;
            yield return new WaitForSeconds(0.1f);
            if (spriteRenderer != null)
                spriteRenderer.color = original;
        }

        protected virtual void Die()
        {
            // Drop loot
            if (data.dropTable != null)
            {
                foreach (var drop in data.dropTable)
                {
                    if (Random.value <= drop.dropChance)
                    {
                        int count = Random.Range(drop.minCount, drop.maxCount + 1);
                        if (count > 0 && drop.item != null)
                        {
                            InventoryManager.Instance?.AddItem(drop.item, count);
                            // TODO: Spawn item entity instead of direct add
                        }
                    }
                }
            }

            // Notify spawner
            MobSpawner.Instance?.OnEnemyDied(this);

            Destroy(gameObject);
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            // Contact damage
            if (collision.gameObject.GetComponent<PlayerController>() != null)
            {
                if (attackCooldown <= 0)
                    Attack();
            }
        }
    }
}
