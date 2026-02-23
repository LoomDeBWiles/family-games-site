using UnityEngine;

namespace BlockCraft
{
    public class SlimeEnemy : EnemyBase
    {
        [SerializeField] private float hopForce = 8f;
        [SerializeField] private float hopInterval = 1.5f;
        [SerializeField] private int splitCount = 2;
        [SerializeField] private float splitHealthRatio = 0.4f;
        [SerializeField] private bool canSplit = true;

        private float _hopTimer;

        protected override void UpdateAI()
        {
            if (playerTransform == null) return;

            _hopTimer -= Time.deltaTime;

            float distToPlayer = Vector2.Distance(transform.position, playerTransform.position);

            if (distToPlayer <= data.detectionRange && _hopTimer <= 0 && isGrounded)
            {
                HopTowardPlayer();
                _hopTimer = hopInterval;
            }

            if (distToPlayer <= data.attackRange && attackCooldown <= 0)
            {
                Attack();
            }
        }

        private void HopTowardPlayer()
        {
            float dirX = Mathf.Sign(playerTransform.position.x - transform.position.x);
            rb.linearVelocity = new Vector2(dirX * data.moveSpeed * 1.5f, hopForce);

            if ((dirX > 0 && !facingRight) || (dirX < 0 && facingRight))
            {
                facingRight = !facingRight;
                spriteRenderer.flipX = !facingRight;
            }
        }

        protected override void Die()
        {
            if (canSplit && splitCount > 0)
            {
                // Spawn smaller slimes
                for (int i = 0; i < splitCount; i++)
                {
                    Vector3 offset = new Vector3(Random.Range(-0.5f, 0.5f), 0.5f, 0);
                    var smallSlime = new GameObject("SmallSlime");
                    smallSlime.transform.position = transform.position + offset;

                    var enemy = smallSlime.AddComponent<SlimeEnemy>();
                    smallSlime.AddComponent<Rigidbody2D>();
                    smallSlime.AddComponent<BoxCollider2D>();

                    // Create a modified version with less health
                    enemy.Initialize(data);
                    enemy.currentHealth = data.maxHealth * splitHealthRatio;
                    enemy.canSplit = false; // Small slimes don't split further
                    enemy.transform.localScale = Vector3.one * 0.6f;

                    MobSpawner.Instance?.RegisterEnemy(enemy);
                }
            }

            base.Die();
        }
    }
}
